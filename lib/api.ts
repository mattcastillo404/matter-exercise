export type InpaintResponse = {
  editedImageUrl: string;
  width: number;
  height: number;
};

export type InpaintError = {
  error: string;
};

export async function submitInpaint(
  image: string,
  mask: string,
  prompt: string,
  signal?: AbortSignal
): Promise<InpaintResponse> {
  const response = await fetch("/api/inpaint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, mask, prompt }),
    signal,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as InpaintError).error || "Failed to edit image.");
  }

  return data as InpaintResponse;
}
