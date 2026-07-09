# Image Generation Asset Notes

## Purpose

The module can reuse assets from `~/Projects/raidguild/forge/arcade-roundtable-melee`, but it will likely need new room details, puzzle props, lore artifacts, and possibly sprite variants.

Use image generation for raster assets where a custom illustrated/pixel-art visual is useful and deterministic SVG/CSS would be too limited. Keep generated assets organized, documented, and consistent with the rest of the module.

## Good Imagegen Candidates

- Dungeon archive background variants.
- Cipher puzzle props:
  - Caesar wheel door.
  - Rail Fence table.
  - Vigenere terminal.
  - Diffie-Hellman altar.
  - Final vault door.
- Lore artifacts:
  - old notes.
  - terminal fragments.
  - sealed envelopes.
  - key cards.
  - archive plaques.
- Character portraits or guide busts for historical voices.
- Item sprites and inventory icons.
- Decorative room-state overlays such as glowing seals, unlocked panels, and activated machines.

## Avoid Imagegen For

- Simple UI icons that can use lucide or repo-native SVG.
- Text-heavy images, unless the exact text can be added later in HTML/CSS.
- Diagrams that need mathematical precision.
- Puzzle answer content that should remain dynamic/randomized.
- Assets that need clean animation frames unless we have a defined sprite-sheet workflow.

## Style Direction

The first pass should stay visually compatible with the arcade reference:

- Pixel-art or pixel-adjacent fantasy dungeon style.
- Dark archive / cryptolab mood.
- Readable silhouettes.
- High contrast interactive props.
- Minimal baked-in text.
- No modern stock-photo look.
- No heavy blur, dark crops, or atmospheric-only images.

Interactive objects should be easy to identify at room scale. If an object is important to gameplay, generate it with a strong silhouette and enough empty space around it for hotspot placement.

## Asset Types

### Room Backgrounds

Use for the main one-room archive or later room-state variants.

Requirements:

- 16:9 or fixed game-friendly aspect ratio.
- Clear locations for 4-5 puzzle stations.
- No embedded puzzle answers.
- No tiny unreadable text.
- Leave visual space for UI overlays.

### Props and Hotspots

Use for station objects that can be composited into the room.

Requirements:

- Isolated object on a flat chroma-key background if transparency is needed.
- Strong silhouette.
- Consistent perspective with the room.
- No shadows if the asset will be composited manually.

### Character Portraits

Use for guide voices or lore unlocks, not as factual documentary likenesses unless references and permissions are resolved.

Requirements:

- Treat as stylized archive portraits, not photoreal identity claims.
- Avoid implying exact historical likeness if not using verified references.
- Keep framing consistent across all guide portraits.

### Item Sprites

Use for inventory-style keys, notes, seals, puzzle fragments, and artifacts.

Requirements:

- Small-size readability.
- Transparent PNG/WebP after background removal.
- Consistent lighting and outline treatment.
- Avoid fine details that disappear at UI size.

## Transparency Workflow

For project-bound transparent assets, generate on a flat chroma-key background first, then remove the background locally.

Default chroma-key prompt addition:

```text
Create the requested subject on a perfectly flat solid #00ff00 chroma-key background for background removal.
The background must be one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation.
Keep the subject fully separated from the background with crisp edges and generous padding.
Do not use #00ff00 anywhere in the subject.
No cast shadow, no contact shadow, no reflection, no watermark, and no text unless explicitly requested.
```

After generation, move the selected source into the workspace and remove the chroma key with:

```bash
python "${CODEX_HOME:-$HOME/.codex}/skills/.system/imagegen/scripts/remove_chroma_key.py" \
  --input <source> \
  --out <final.png> \
  --auto-key border \
  --soft-matte \
  --transparent-threshold 12 \
  --opaque-threshold 220 \
  --despill
```

Validate that corners are transparent, subject edges are clean, and no green fringe remains before using the asset.

## Suggested Folder Structure

```text
public/
  backgrounds/
  sprites/
    props/
    items/
    portraits/
  generated/
    sources/
```

Keep final usable assets under normal public asset folders. Keep selected raw generated sources only when useful for audit or iteration.

## Prompt Templates

### Room Background

```text
Use case: stylized-concept
Asset type: game room background
Primary request: A single-room cypherpunk archive dungeon for an educational cipher escape room.
Scene/backdrop: fantasy stone archive mixed with subtle cryptography lab details, top-down or slightly isometric view, clear stations for a cipher wheel door, rail table, terminal, altar, and final vault.
Style: pixel-art or pixel-adjacent, compatible with a fantasy arcade dungeon game, readable silhouettes, high contrast, no embedded text.
Constraints: no characters, no UI, no puzzle answers, no watermark, leave open space for clickable hotspots.
```

### Puzzle Prop

```text
Use case: stylized-concept
Asset type: transparent game prop
Primary request: <specific puzzle object>.
Scene/backdrop: isolated object for a dungeon archive room.
Style: pixel-art or pixel-adjacent fantasy cryptolab, strong silhouette, readable at small size.
Constraints: no text, no watermark, no cast shadow, flat #00ff00 chroma-key background.
```

### Lore Artifact

```text
Use case: stylized-concept
Asset type: inventory artifact
Primary request: <specific artifact, such as sealed archive note or public key card>.
Scene/backdrop: isolated inventory item.
Style: pixel-art or pixel-adjacent, aged archive material with subtle cryptographic markings.
Constraints: no readable text, no watermark, flat #00ff00 chroma-key background.
```

## Asset Tracking

When adding generated assets, record:

- Final saved path.
- Source generated path, if retained.
- Prompt used.
- Date generated.
- Intended use.
- Any post-processing applied.

This can start as a simple markdown table in this file or become `docs/asset-log.md` once assets are created.

