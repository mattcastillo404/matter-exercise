"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { AnimatePresence } from "motion/react";
import { motion } from "motion/react";
import { RotateCcw, Trash2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditor } from "@/lib/editor-store";
import { generateMaskFromPath } from "@/lib/mask";
import { FloatingToolbar, ToolbarButton } from "@/components/floating-toolbar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/motion-primitives/dialog";
import { Button } from "@/components/ui/button";

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
  const [isReady, setIsReady] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  // Track the natural image dimensions for mask generation
  const imageDimensionsRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  // Track the viewport scale so we can adjust brush width
  const viewportScaleRef = useRef(1);

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

    // Load the image
    const imgElement = new Image();
    imgElement.crossOrigin = "anonymous";
    imgElement.onload = () => {
      const imgW = imgElement.naturalWidth;
      const imgH = imgElement.naturalHeight;

      imageDimensionsRef.current = { width: imgW, height: imgH };

      // Place the image at the origin at its natural size (no scaling on the object).
      // Explicitly use top-left origin so (0,0) is the image's top-left corner.
      const fabricImage = new fabric.FabricImage(imgElement, {
        left: 0,
        top: 0,
        originX: "left",
        originY: "top",
        selectable: false,
        evented: false,
      });

      fCanvas.add(fabricImage);
      fCanvas.sendObjectToBack(fabricImage);

      // Compute the uniform scale to fit the image in the viewport, never
      // upscaling beyond 1:1
      const scale = Math.min(rect.width / imgW, rect.height / imgH, 1);
      viewportScaleRef.current = scale;

      // Center the image via the viewport transform.
      // The viewport transform is a 3x2 matrix [a, b, c, d, e, f] where
      //   a = scaleX, d = scaleY, e = translateX, f = translateY
      const offsetX = (rect.width - imgW * scale) / 2;
      const offsetY = (rect.height - imgH * scale) / 2;
      fCanvas.setViewportTransform([scale, 0, 0, scale, offsetX, offsetY]);

      // Set up drawing brush - fuchsia color.
      // Adjust width so the visual stroke stays consistent regardless of zoom.
      fCanvas.freeDrawingBrush = new fabric.PencilBrush(fCanvas);
      fCanvas.freeDrawingBrush.color = "rgba(217, 70, 239, 0.8)";
      fCanvas.freeDrawingBrush.width = 3 / scale;

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

      const scale = viewportScaleRef.current;

      // Ensure the path is closed so the dashed border fully surrounds the
      // selection — even if the user released without returning to the start.
      if (path.path && path.path.length > 0) {
        const lastCmd = path.path[path.path.length - 1];
        if ((lastCmd[0] as string) !== "z" && (lastCmd[0] as string) !== "Z") {
          path.path.push(["Z"] as unknown as (typeof path.path)[number]);
        }
      }

      // Style the drawn path as a filled fuchsia overlay with dashed border.
      // Dash/stroke sizes are in image-space, so divide by scale for a
      // consistent visual size.
      path.set({
        fill: "rgba(217, 70, 239, 0.25)",
        stroke: "rgba(217, 70, 239, 0.9)",
        strokeWidth: 2 / scale,
        strokeDashArray: [8 / scale, 4 / scale],
        selectable: false,
        evented: false,
      });

      currentPathRef.current = path;
      fCanvas.renderAll();

      // Because the viewport transform maps canvas-space to image-space,
      // the path coordinates from Fabric are already in image-pixel
      // coordinates. We just need to extract them.
      const imagePoints = extractPathPoints(path);

      // Generate mask at the image's native resolution
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
      initial={{ opacity: 0, scale: 1 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative h-full w-full cursor-crosshair p-20"
    >
      {/* Top bar — version thumbnails or instructional text */}
      {(state.status === "selection" || state.status === "selected") && isReady && (
        <div className="absolute top-6 left-0 right-0 z-10 flex justify-center">
          {state.imageVersions.length > 1 ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2"
            >
              {state.imageVersions.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => dispatch({ type: "SELECT_VERSION", index: i })}
                  className={cn(
                    "h-10 w-10 overflow-hidden rounded border transition-all",
                    i === state.activeVersionIndex
                      ? "ring-2 ring-fuchsia-500 border-fuchsia-500"
                      : "border-zinc-700 opacity-60 hover:opacity-100"
                  )}
                >
                  <img
                    src={url}
                    alt={i === 0 ? "Original" : `Version ${i}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-zinc-400"
            >
              Draw to select an area to edit
            </motion.p>
          )}
        </div>
      )}

      {/* containerRef must tightly wrap the canvas so getBoundingClientRect
          returns the actual drawing area (excluding padding). */}
      <div ref={containerRef} className="relative h-full w-full">
        <canvas ref={canvasRef} />
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-fuchsia-500" />
          </div>
        )}
      </div>

      {/* Floating toolbar — visible in selection mode */}
      <AnimatePresence>
        {(state.status === "selection" || state.status === "selected") && isReady && (
          <FloatingToolbar>
            <ToolbarButton
              icon={<RotateCcw className="h-4 w-4" />}
              label="Start over"
              onClick={() => setShowResetDialog(true)}
            />
            <ToolbarButton
              icon={<Trash2 className="h-4 w-4" />}
              label="Clear selection"
              disabled={state.status !== "selected"}
              onClick={() => {
                // Remove the drawn path from the canvas
                if (currentPathRef.current && fabricCanvasRef.current) {
                  fabricCanvasRef.current.remove(currentPathRef.current);
                  currentPathRef.current = null;
                  fabricCanvasRef.current.renderAll();
                }
                dispatch({ type: "CLEAR_LASSO" });
              }}
            />
            {state.imageDataUrl && (
              <ToolbarButton
                icon={<Download className="h-4 w-4" />}
                label="Download"
                href={state.imageDataUrl}
                download="edited-image.png"
              />
            )}
          </FloatingToolbar>
        )}
      </AnimatePresence>

      {/* Confirmation dialog for Start over */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="w-full max-w-sm bg-zinc-900 p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-zinc-100">Start over?</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">
              Your current changes will not be saved.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setShowResetDialog(false);
                dispatch({ type: "RESET" });
              }}
            >
              Start over
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

/**
 * Extract absolute image-space points from a Fabric.js Path object.
 *
 * When a viewport transform is applied, Fabric's PencilBrush records path
 * commands in the *image* coordinate system (the inverse viewport transform is
 * already applied). The path object stores coordinates relative to its own
 * bounding-box center (`pathOffset`), so we undo that to recover the absolute
 * image-space coordinates for each command endpoint.
 */
function extractPathPoints(
  path: InstanceType<typeof import("fabric").Path>
): number[][] {
  const points: number[][] = [];
  const pathData = path.path;
  if (!pathData) return points;

  // pathOffset is the center of the path's local bounding box.
  // path.left / path.top is the position of the object's center on the canvas.
  const ox = path.pathOffset?.x ?? 0;
  const oy = path.pathOffset?.y ?? 0;
  const left = path.left ?? 0;
  const top = path.top ?? 0;

  // Convert a local path coordinate to absolute image-space
  const toAbs = (lx: number, ly: number): [number, number] => [
    lx - ox + left,
    ly - oy + top,
  ];

  for (const cmd of pathData) {
    const command = cmd[0] as string;
    switch (command) {
      case "M":
      case "L":
        points.push(toAbs(cmd[1] as number, cmd[2] as number));
        break;
      case "Q":
        // cmd = ['Q', cx, cy, x, y] — take endpoint
        points.push(toAbs(cmd[3] as number, cmd[4] as number));
        break;
      case "C":
        // cmd = ['C', c1x, c1y, c2x, c2y, x, y] — take endpoint
        points.push(toAbs(cmd[5] as number, cmd[6] as number));
        break;
    }
  }

  return points;
}
