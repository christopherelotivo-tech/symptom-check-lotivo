---
name: design-taste-frontend
version: 2.0.0-experimental
DESIGN_VARIANCE: 3
MOTION_INTENSITY: 4
VISUAL_DENSITY: 6
---

# Taste Skill Ruleset (React Native Mobile Edition)

## 🚫 Critical Anti-Slop Bans
- BANNED: Uniform, massive rounded cards nested inside *other* rounded cards with heavy borders.
- BANNED: Stacked, repeating thick pill buttons or navigation items that dominate screen space.
- BANNED: Default gray line borders (`#CCCCCC` or `#E5E7EB`) wrapping every text grouping.
- BANNED: Unoptimized, uniform text sizing that makes headers and details look identical.

## ✨ Layout & Structure Guide (Impeccable Context)
- Focus layout architecture on high readability using clinical whitespace instead of containment boxes.
- For patient-facing views, leave 20px-24px margins to avoid cognitive overload.
- For admin-facing nested structures, use ultra-thin rows with light background shifts instead of thick columns.
- All visual dividers must use a maximum opacity tint (`rgba(0,0,0,0.04)`) or soft background changes (`#F4FBF7`).

## 📱 Mobile Interaction & Typography Scales
- Typography must utilize native system weights (`Avenir Next` on iOS, `sans-serif-medium` on Android).
- Active elements must animate smoothly using the React Native `Animated` API using scale factor transformations rather than sudden layout changes.
- Checked list selections must switch into clear visual active tokens using micro-elements (crisp feather checkmarks) and subtle, elegant layout tints (`rgba(16, 185, 129, 0.05)`).
