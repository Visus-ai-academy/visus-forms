```markdown
# Design System Strategy: The Elevated Dialogue

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Atelier."** 

Unlike standard form builders that feel like mechanical spreadsheets, this system treats data collection as a premium, editorial experience. We are moving away from the "web-form-as-a-document" mental model and toward "web-form-as-a-conversation." 

To break the template look, we utilize **Intentional Asymmetry**. Instead of centering every element, we use the spacing scale to create wide, breathable gutters and offset typography. We lean heavily into high-contrast type scales—pairing the functional precision of `Inter` with the architectural elegance of `Manrope`. The result is a UI that feels curated, snappy, and expensive.

---

## 2. Colors & Surface Philosophy
This palette is rooted in a deep indigo (`primary`) and a professional slate (`secondary`), balanced by an expansive use of off-whites and cool greys.

### The "No-Line" Rule
**Traditional 1px solid borders are strictly prohibited for sectioning.** 
Visual boundaries must be defined through background color shifts. For example, a `surface-container-low` input field should sit on a `surface` background. This creates a "molded" look rather than a "drawn" look, making the UI feel like a single, cohesive object.

### Surface Hierarchy & Nesting
Depth is achieved through a "Physical Layering" model. Use the `surface-container` tiers to define importance:
- **Base Layer:** `surface` (#f7f9fb) for the main canvas.
- **Mid Layer:** `surface-container-low` (#f2f4f6) for secondary sidebars or grouped inputs.
- **Focus Layer:** `surface-container-lowest` (#ffffff) for the active question or primary card, creating a subtle "lift" against the background.

### The "Glass & Gradient" Rule
To elevate main CTAs and floating navigation:
- **Glassmorphism:** Use `surface_variant` at 60% opacity with a `20px` backdrop-blur for floating headers.
- **Signature Textures:** Apply a linear gradient from `primary` (#3730a3) to `primary_container` (#4f4bbc) on primary action buttons. This adds a "soul" to the UI that flat colors lack.

---

## 3. Typography: The Editorial Voice
We use two typefaces to distinguish between *Action* and *Atmosphere*.

- **Display & Headlines (Manrope):** These are our architectural anchors. Use `display-lg` for welcome screens and `headline-md` for question titles. The generous x-height of Manrope provides a modern, authoritative feel.
- **Body & Labels (Inter):** Inter is used for all functional data. Use `body-lg` for respondent answers and `label-md` for metadata. Inter’s neutrality ensures that the "utility" of the form never conflicts with the "beauty" of the brand.

**Hierarchy Tip:** Always skip a size in the scale to create dramatic contrast. Pair a `headline-lg` question with a `body-sm` helper text to create a clear, sophisticated visual path.

---

## 4. Elevation & Depth
We reject the heavy, muddy shadows of the early 2010s.

- **The Layering Principle:** Use color tokens first. An inner card should be `surface-container-lowest` while the outer wrapper is `surface-container`.
- **Ambient Shadows:** For floating elements (like a "Add Question" FAB), use a shadow with a 32px blur, 0% spread, and 6% opacity of `on-surface` (#191c1e). This mimics natural gallery lighting.
- **The "Ghost Border" Fallback:** If a border is required for accessibility in input fields, use `outline-variant` (#c5c5d4) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons
- **Primary:** Gradient (`primary` to `primary_container`), `xl` roundedness (1.5rem), white text.
- **Secondary:** `surface-container-high` background with `on-secondary-container` text. No border.
- **Interaction:** On hover, shift the gradient 10% brighter; on tap, scale the button to 0.98.

### Dynamic Form Elements
- **Input Fields:** Use `surface-container-lowest` as the base. Upon focus, the "Ghost Border" transitions to a 2px `primary` bottom-stroke only. This maintains the minimalist aesthetic while providing clear feedback.
- **Radio Buttons & Selection:** Forget the standard circle. Use "Tile Selectors"—large blocks of `surface-container-low` that transition to `primary_fixed` with a `primary` "Ghost Border" when selected.
- **File Uploads:** A large, dashed `outline-variant` (20% opacity) area using `spacing-12` for padding. Use a `surface-bright` background to make the drop zone feel "hollow" and ready to be filled.

### Data Visualization
- **Charts:** Use `primary` for the main data line and `tertiary` (#6c3400) for highlight anomalies. 
- **The "Breathe" Rule:** All charts must have a minimum of `spacing-8` padding from their container edges.

---

## 6. Do’s and Don’ts

### Do:
- **Embrace White Space:** Use `spacing-16` or `spacing-20` between major form sections. Air is luxury.
- **Use Tonal Transitions:** Separate the builder's sidebar from the canvas using `surface-dim` vs `surface`.
- **Soft Corners:** Stick to `lg` (1rem) and `xl` (1.5rem) roundedness for a friendly, modern feel.

### Don’t:
- **No Hard Dividers:** Never use a 1px solid line to separate questions. Use `spacing-10` of vertical gap instead.
- **No Pure Black:** Never use #000000. Use `on-surface` (#191c1e) for text to maintain the sophisticated slate-indigo tone.
- **No Default Focus States:** Replace browser-default blue rings with our `primary` tonal glow.

---

## 7. Signature Interaction: The "Fluid Flow"
Every transition between questions should use a 400ms "Slide & Fade" (Ease-in-out). As the user moves to the next item, the current container should subtly scale down to 95% while the new one scales up from 105%, creating a sense of physical movement through a 3D space. 

This is not just a form; it is a choreographed experience.```