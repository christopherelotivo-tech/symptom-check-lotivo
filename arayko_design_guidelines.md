# SymptaCare Design System & Guidelines

This document outlines the core design system, visual identity, and UI/UX guidelines for the **SymptaCare** mobile application. It is meant to serve as a reference for designers and AI tools (like Stitch) to maintain a cohesive, premium, and friendly healthcare consumer aesthetic.

---

## 1. Core Philosophy
SymptaCare is a healthcare assessment tool. The design must communicate **trust, calmness, and clarity**. 
- **Not a Developer Console:** Avoid hyper-dense, dark, or overly technical aesthetics.
- **Friendly Healthcare:** Use soft colors, ample white space, and human-readable conversational language.
- **Progressive Disclosure:** Present complex medical logic in simple, bite-sized steps (e.g., Symptom -> Context -> Result).

## 2. Color Palette
The app relies on a carefully curated medical color palette.

### Brand Colors
*   **Deep Navy (Primary):** `#1A3A6C` — Used for main headings, active states, and primary typography. Trustworthy and professional.
*   **Brand Green (Primary Action):** `#10B981` — Used for primary buttons, success states, and key selections. Softened in some areas to `#78D596` for gradients/glows.
*   **Brand Blue / Cyan:** `#38BDF8` — Used for links, secondary accents, and informational icons.
*   **Warm Yellow / Amber:** `#FBBF24` — Used for warnings and amber triage states.

### Backgrounds & Surfaces
*   **Primary Background:** `#EFF6FF` (Very soft blue/mint tint). Provides a breathable, clinical-yet-friendly canvas.
*   **Surfaces (Cards/Modals):** `#FFFFFF` (Pure white). 
*   **Subtle Tints:** Used behind active elements (e.g., `#F0FDF4` for active green pills, `#F8FAFC` for hover states).

### Triage / Risk Colors
*   **Green (Low Risk):** Text `#166534`, BG `#F0FDF4`, Border `#86EFAC`
*   **Amber (Medium Risk):** Text `#92400E`, BG `#FFFBEB`, Border `#FCD34D`
*   **Red (High Risk):** Text `#991B1B`, BG `#FFF1F2`, Border `#FDA4AF`

## 3. Typography
The application uses a clean, modern sans-serif stack.
*   **Font Family:** System UI default (San Francisco on iOS, Roboto on Android) with a preference for rounded geometric sans-serif if custom fonts are added.
*   **Hierarchy:**
    *   **Hero/Page Titles:** 24px - 32px, `extrabold`, Deep Navy. Tightly tracked (letter-spacing: -0.5px to -1px).
    *   **Section Headers:** 18px - 20px, `bold`.
    *   **Body / Base:** 16px, `regular` or `medium`. Line height: 22px+.
    *   **Metadata / Badges:** 10px - 14px, `bold`, uppercase with wide tracking (letter-spacing: 0.5px - 1px).

## 4. Geometry & Shapes
The defining visual characteristic of the SymptaCare refresh is the **"Pill" and "Soft Card" geometry**.

*   **Pill Shapes (`borderRadius: 9999` or `50`):** Used for all primary actionable elements:
    *   Primary CTAs (Buttons)
    *   Bottom Navigation bar
    *   Checkboxes and Option Selectors
    *   Search inputs
*   **Soft Cards (`borderRadius: 16` to `24`):** Used for containers holding information:
    *   Triage Results
    *   Symptom Context Cards
    *   Admin Guideline Cards
*   **Borders:** Extremely subtle. Borders on white cards should barely be visible (`rgba(26, 58, 108, 0.04)`), acting merely to contain the element alongside soft shadows.

## 5. Shadows & Elevation
Shadows must be airy and non-intrusive.
*   **Base Shadow:** `shadowColor: '#1A3A6C'`, `shadowOpacity: 0.04` to `0.05`, `shadowRadius: 12`, `shadowOffset: { width: 0, height: 4 }`.
*   **Elevation (Android):** Keep elevation low (1 or 2) and rely primarily on border definitions to avoid harsh native Android shadows.

## 6. Interaction & Motion
*   **Subtle Scaling:** Interactive elements (buttons, pills, tabs) should gently scale down (e.g., to `0.96` or `0.98`) when pressed using spring physics. No harsh flashes.
*   **Loading States:** Prefer subtle, continuous motion (like a slowly pulsing brand logo or soft skeleton screens) over standard high-frequency spinners.

## 7. Component Paradigms
*   **Bottom Navigation:** A floating white pill at the bottom of the screen with a subtle shadow, rather than a full-width footer anchored to the edges. Active states use a soft green pill background.
*   **Checkboxes / Selection:** Treated as horizontal pills. Unselected items have a transparent border and grey icon. Selected items gain a soft green border, a very light mint background, and a green checkmark.
*   **Explainability (Audit Trails):** Highly technical data (e.g., rule IDs, boolean derivations) must be hidden behind an expandable "Technical Trace" accordion, keeping the primary UI clean for patients.

