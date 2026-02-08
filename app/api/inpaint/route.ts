import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

// Configure fal client with the API key from environment
fal.config({
  credentials: process.env.FAL_KEY,
});

/**
 * Convert a base64 data URL to a Blob for uploading.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64Data] = dataUrl.split(",");
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const binary = Buffer.from(base64Data, "base64");
  return new Blob([binary], { type: mime });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, mask, prompt } = body as {
      image: string;
      mask: string;
      prompt: string;
    };

    if (!image || !mask || !prompt) {
      return NextResponse.json(
        { error: "Missing required fields: image, mask, prompt" },
        { status: 400 }
      );
    }

    if (!process.env.FAL_KEY || process.env.FAL_KEY === "your_fal_api_key_here") {
      return NextResponse.json(
        { error: "FAL_KEY is not configured. Please add your fal.ai API key to .env.local" },
        { status: 500 }
      );
    }

    // Upload image and mask to fal.storage to get accessible URLs
    const imageBlob = dataUrlToBlob(image);
    const maskBlob = dataUrlToBlob(mask);

    const [imageUrl, maskUrl] = await Promise.all([
      fal.storage.upload(new File([imageBlob], "image.png", { type: imageBlob.type })),
      fal.storage.upload(new File([maskBlob], "mask.png", { type: maskBlob.type })),
    ]);

    // Call the Qwen inpaint endpoint
    const result = await fal.subscribe("fal-ai/qwen-image-edit/inpaint", {
      input: {
        prompt,
        image_url: imageUrl,
        mask_url: maskUrl,
        num_inference_steps: 30,
        guidance_scale: 4,
        output_format: "png",
        strength: 0.93,
      },
      logs: true,
    });

    // Extract the edited image URL from the result
    const resultData = result.data as {
      images: Array<{ url: string; width: number; height: number }>;
    };

    if (!resultData?.images?.[0]?.url) {
      return NextResponse.json(
        { error: "No image was returned from the AI model." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      editedImageUrl: resultData.images[0].url,
      width: resultData.images[0].width,
      height: resultData.images[0].height,
    });
  } catch (error) {
    console.error("Inpaint API error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
