import crypto from "node:crypto";
import { cookies } from "next/headers";

export interface PortalLaunchClaims {
  aud: string | string[];
  email?: string;
  exp: number;
  handle?: string;
  iss: string;
  moduleSlug: string;
  name?: string;
  picture?: string;
  profileID?: number | string;
  roles?: string[];
  sub: string;
  typ: "portal_module_launch";
  userID: number | string;
}

export interface LocalSession {
  authenticated: boolean;
  email?: string;
  handle: string;
  name?: string;
  picture?: string;
  portalProfileID?: string;
  portalUserID: string;
  roles: string[];
}

export const SESSION_COOKIE = "cypherpunk_archive_session";

const DEFAULT_MODULE_SLUG = "cypherpunk-archive";
const DEFAULT_PORTAL_ISSUER = "https://portal.raidguild.org";
const textEncoder = new TextEncoder();

export function verifyPortalLaunchToken(token: string): PortalLaunchClaims {
  const [encodedHeader, encodedPayload, signature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error("Malformed launch token.");
  }

  const header = parseBase64UrlJson<{ alg?: string; typ?: string }>(encodedHeader);
  if (header.alg !== "HS256") {
    throw new Error("Unsupported launch token algorithm.");
  }

  const secret = process.env.PORTAL_MODULE_LAUNCH_SECRET;
  if (!secret) throw new Error("PORTAL_MODULE_LAUNCH_SECRET is not configured.");

  const expected = hmacBase64Url(`${encodedHeader}.${encodedPayload}`, secret);
  if (!timingSafeEqual(signature, expected)) {
    throw new Error("Invalid launch token signature.");
  }

  const claims = parseBase64UrlJson<PortalLaunchClaims>(encodedPayload);
  const expectedAudience = process.env.PORTAL_MODULE_AUDIENCE ?? DEFAULT_MODULE_SLUG;
  const expectedSlug = process.env.PORTAL_MODULE_SLUG ?? expectedAudience;
  const expectedIssuers = portalModuleIssuers();
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];

  if (claims.typ !== "portal_module_launch") throw new Error("Invalid launch token type.");
  if (!expectedIssuers.includes(normalizeIssuer(claims.iss))) throw new Error("Invalid launch token issuer.");
  if (!audience.includes(expectedAudience)) throw new Error("Invalid launch token audience.");
  if (claims.moduleSlug !== expectedSlug) throw new Error("Invalid launch module slug.");
  if (!claims.exp || claims.exp * 1000 < Date.now()) throw new Error("Launch token expired.");
  if (claims.userID === undefined || claims.userID === null) throw new Error("Launch token is missing userID.");

  return claims;
}

export function sessionFromClaims(claims: PortalLaunchClaims): LocalSession {
  const handle = claims.handle || claims.name || `raider-${claims.userID}`;
  return {
    authenticated: true,
    email: claims.email,
    handle,
    name: claims.name,
    picture: claims.picture,
    portalProfileID: claims.profileID === undefined ? undefined : String(claims.profileID),
    portalUserID: String(claims.userID),
    roles: Array.isArray(claims.roles) ? claims.roles : [],
  };
}

export function signLocalSession(session: LocalSession): string {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const signature = hmacBase64Url(payload, localSessionSecret());
  return `${payload}.${signature}`;
}

export function verifyLocalSession(value: string | undefined): LocalSession | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expected = hmacBase64Url(payload, localSessionSecret());
  if (!timingSafeEqual(signature, expected)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as LocalSession;
    if (!session.authenticated || !session.portalUserID || !session.handle) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getCurrentSession(): Promise<LocalSession> {
  const cookieStore = await cookies();
  return verifyLocalSession(cookieStore.get(SESSION_COOKIE)?.value) ?? anonymousSession();
}

export function anonymousSession(): LocalSession {
  return {
    authenticated: false,
    handle: "Stranger",
    portalUserID: "anonymous",
    roles: [],
  };
}

export function portalModulesUrl() {
  return process.env.PORTAL_MODULES_URL ?? "https://portal.raidguild.org/modules";
}

function parseBase64UrlJson<T>(value: string): T {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

function hmacBase64Url(value: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function timingSafeEqual(a: string, b: string) {
  const left = textEncoder.encode(a);
  const right = textEncoder.encode(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function localSessionSecret() {
  return (
    process.env.SESSION_SECRET ??
    process.env.PORTAL_MODULE_LAUNCH_SECRET ?? "local-dev-session-secret"
  );
}

function portalModuleIssuers() {
  const issuers =
    process.env.PORTAL_MODULE_ALLOWED_ISSUERS ?? process.env.PORTAL_MODULE_ISSUER;

  return (issuers ?? DEFAULT_PORTAL_ISSUER)
    .split(",")
    .map((issuer) => normalizeIssuer(issuer.trim()))
    .filter(Boolean);
}

function normalizeIssuer(issuer: string) {
  return issuer.replace(/\/+$/, "");
}
