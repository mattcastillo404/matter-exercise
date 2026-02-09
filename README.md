# AI Image Inpainting Editor

A single-page prototype for AI-powered image inpainting. Users upload an image, select a region with a freehand lasso tool, describe their desired edits in natural language, and the app generates an updated image using an AI model.

## Technology

- **Next.js 16** (App Router) with **React 19** and **TypeScript**
- **Fabric.js** for canvas rendering and freehand lasso drawing
- **fal.ai** (`qwen-image-edit/inpaint` model) for AI inpainting
- **Tailwind CSS 4** and **shadcn/ui** for styling and UI components
- **Motion** for animations and transitions

## Flow

1. **Upload** — Drag-and-drop or click to upload a PNG/JPEG image (up to 10 MB). A progress animation plays while the image loads.
2. **Select** — The image renders on a Fabric.js canvas. Draw a freehand lasso to highlight the area you want to edit. A fuchsia overlay shows the selection. Use the floating toolbar to clear the selection, start over, or download the current image.
3. **Prompt** — Once a selection is confirmed, a chat input appears. Type a natural-language description of the edit you want (e.g., "replace with a blue sky").
4. **Edit** — The prompt, image, and generated mask are sent to the `/api/inpaint` route, which uploads the assets to fal.ai storage and calls the Qwen inpainting model. A blurred overlay with a glow effect indicates processing.
5. **Result** — The edited image replaces the canvas content. Previous versions are kept in a thumbnail strip so you can compare or revert, and you can continue making additional edits.

## Getting Started

```bash
# Install dependencies
npm install

# Add your fal.ai key
echo 'FAL_KEY=your_key:your_secret' > .env.local

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the editor.
