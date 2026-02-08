/**
 * Generate a black-and-white mask from a lasso path.
 * The mask is a PNG data URL where white = selected area, black = unselected.
 */
export function generateMaskFromPath(
  path: number[][],
  width: number,
  height: number
): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Fill entire canvas black (unselected)
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  // Draw lasso path filled white (selected area)
  if (path.length > 0) {
    ctx.beginPath();
    ctx.moveTo(path[0][0], path[0][1]);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i][0], path[i][1]);
    }
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }

  return canvas.toDataURL("image/png");
}
