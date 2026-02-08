"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { motion } from "motion/react";
import { useEditor } from "@/lib/editor-store";
import { generateMaskFromPath } from "@/lib/mask";

// Fabric.js v7 is ESM and we need to import it dynamically on the client
let fabricModule: typeof import("fabric") | null = null;

async function getFabric() {
  if (!fabricModule) {
    fabricModule = await import("fabric");
  }
  return fabricModule;
}

export function ImageCanvas() {
  const { state, dispatch } = useEditor();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<InstanceType<
    typeof import("fabric").Canvas
  > | null>(null);
  const currentPathRef = useRef<InstanceType<
    typeof import("fabric").FabricObject
  > | null>(null);
  const imageRef = useRef<InstanceType<
    typeof import("fabric").FabricImage
  > | null>(null);
  const [isReady, setIsReady] = useState(false);
  // Track the natural image dimensions for mask generation
  const imageDimensionsRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const initCanvas = useCallback(async () => {
    if (!canvasRef.current || !containerRef.current || !state.imageDataUrl)
      return;

    const fabric = await getFabric();
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    // Clean up existing canvas
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
      fabricCanvasRef.current = null;
    }

    const fCanvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      width: rect.width,
      height: rect.height,
      selection: false,
    });

    // Set up drawing brush - fuchsia color, thin for lasso outline
    fCanvas.freeDrawingBrush = new fabric.PencilBrush(fCanvas);
    fCanvas.freeDrawingBrush.color = "rgba(217, 70, 239, 0.8)"; // fuchsia-500
    fCanvas.freeDrawingBrush.width = 3;

    // Load the image as background
    const imgElement = new Image();
    imgElement.crossOrigin = "anonymous";
    imgElement.onload = () => {
      imageDimensionsRef.current = {
        width: imgElement.naturalWidth,
        height: imgElement.naturalHeight,
      };

      const fabricImage = new fabric.FabricImage(imgElement, {
        selectable: false,
        evented: false,
      });

      // Scale image to fit canvas while maintaining aspect ratio
      const scaleX = rect.width / imgElement.naturalWidth;
      const scaleY = rect.height / imgElement.naturalHeight;
      const scale = Math.min(scaleX, scaleY, 1);

      fabricImage.scaleX = scale;
      fabricImage.scaleY = scale;

      // Center the image
      fabricImage.left = (rect.width - imgElement.naturalWidth * scale) / 2;
      fabricImage.top = (rect.height - imgElement.naturalHeight * scale) / 2;

      imageRef.current = fabricImage;
      fCanvas.add(fabricImage);
      fCanvas.sendObjectToBack(fabricImage);
      fCanvas.renderAll();
      setIsReady(true);
    };
    imgElement.src = state.imageDataUrl;

    // Handle path:created - when user finishes drawing
    fCanvas.on("path:created", (opt) => {
      const path = (opt as { path: InstanceType<typeof fabric.Path> }).path;

      // Remove previous selection if any
      if (currentPathRef.current) {
        fCanvas.remove(currentPathRef.current);
      }

      // Style the drawn path as a filled fuchsia overlay with dashed border
      path.set({
        fill: "rgba(217, 70, 239, 0.25)",
        stroke: "rgba(217, 70, 239, 0.9)",
        strokeWidth: 2,
        strokeDashArray: [8, 4],
        selectable: false,
        evented: false,
      });

      currentPathRef.current = path;
      fCanvas.renderAll();

      // Extract path points for mask generation
      // Get the path data points relative to the image
      const image = imageRef.current;
      if (!image) return;

      const imgLeft = image.left ?? 0;
      const imgTop = image.top ?? 0;
      const imgScaleX = image.scaleX ?? 1;
      const imgScaleY = image.scaleY ?? 1;

      // Parse the SVG path to get points
      const points = extractPathPoints(path, fabric);

      // Convert canvas coordinates to image coordinates
      const imagePoints = points.map((p) => [
        (p[0] - imgLeft) / imgScaleX,
        (p[1] - imgTop) / imgScaleY,
      ]);

      // Generate mask
      const maskDataUrl = generateMaskFromPath(
        imagePoints,
        imageDimensionsRef.current.width,
        imageDimensionsRef.current.height
      );

      dispatch({
        type: "SET_LASSO",
        maskDataUrl,
        lassoPath: imagePoints,
      });

      // Stay in drawing mode for potential re-draw
      fCanvas.isDrawingMode = true;
    });

    fabricCanvasRef.current = fCanvas;
  }, [state.imageDataUrl, dispatch]);

  useEffect(() => {
    initCanvas();

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [initCanvas]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !fabricCanvasRef.current) return;
      // Re-init on resize for simplicity
      initCanvas();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initCanvas]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative h-full w-full cursor-crosshair"
    >
      <canvas ref={canvasRef} />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-fuchsia-500" />
        </div>
      )}
    </motion.div>
  );
}

/**
 * Extract points from a Fabric.js Path object for mask generation.
 * Parses SVG path commands to get absolute coordinates.
 */
function extractPathPoints(
  path: InstanceType<typeof import("fabric").Path>,
  fabric: typeof import("fabric")
): number[][] {
  const points: number[][] = [];
  const pathData = path.path;
  if (!pathData) return points;

  // path.path is an array of path commands like [['M', x, y], ['Q', cx, cy, x, y], ...]
  // The path's left/top represent the offset of the path's bounding box
  const pathLeft = path.left ?? 0;
  const pathTop = path.top ?? 0;
  const pathWidth = path.width ?? 0;
  const pathHeight = path.height ?? 0;

  // Fabric stores the path relative to its bounding box center by default
  // pathOffset is the center of the path's bounding box
  const minX = path.pathOffset?.x ?? 0;
  const minY = path.pathOffset?.y ?? 0;

  for (const cmd of pathData) {
    const command = cmd[0] as string;
    switch (command) {
      case "M":
      case "L":
        // cmd = ['M'|'L', x, y]
        points.push([
          (cmd[1] as number) - minX + pathLeft + pathWidth / 2,
          (cmd[2] as number) - minY + pathTop + pathHeight / 2,
        ]);
        break;
      case "Q":
        // cmd = ['Q', cx, cy, x, y] - take endpoint
        points.push([
          (cmd[3] as number) - minX + pathLeft + pathWidth / 2,
          (cmd[4] as number) - minY + pathTop + pathHeight / 2,
        ]);
        break;
      case "C":
        // cmd = ['C', c1x, c1y, c2x, c2y, x, y] - take endpoint
        points.push([
          (cmd[5] as number) - minX + pathLeft + pathWidth / 2,
          (cmd[6] as number) - minY + pathTop + pathHeight / 2,
        ]);
        break;
    }
  }

  return points;
}
