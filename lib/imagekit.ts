// Types for ImageKit transformations
export type GravityValue =
  | "center"
  | "north_west"
  | "north_east"
  | "south_west"
  | "south_east"
  | "north"
  | "south"
  | "west"
  | "east";

export interface ImageKitTransformation {
  width?: number;
  height?: number;
  focus?: string;
  cropMode?: string;
  effect?: string;
  background?: string;
  overlayText?: string;
  overlayTextFontSize?: number;
  overlayTextColor?: string;
  gravity?: GravityValue;
  overlayTextPadding?: number;
  overlayBackground?: string;
}

// Helper to build ImageKit transformation URLs
export const buildTransformationUrl = (
  src: string,
  transformations: ImageKitTransformation[] = []
): string => {
  if (!transformations.length) return src;

  // Convert transformation objects to URL parameters
  const transformParamStrings = transformations
    .map((transform) => {
      const params: string[] = [];

      // Handle resizing transformations
      if (transform.width) params.push(`w-${transform.width}`);
      if (transform.height) params.push(`h-${transform.height}`);
      if (transform.focus && transform.focus.trim()) {
        // ImageKit focus values: auto, face, etc.
        params.push(`fo-${transform.focus.trim()}`);
      }
      if (transform.cropMode) params.push(`cm-${transform.cropMode}`);

      // Handle effects
      if (transform.effect) params.push(`e-${transform.effect}`);

      // Handle background
      if (transform.background) params.push(`bg-${transform.background}`);

      // Handle text overlays using layer syntax
      if (transform.overlayText) {
        const layerParams: string[] = [
          `l-text`,
          `i-${encodeURIComponent(transform.overlayText)}`,
        ];

        if (transform.overlayTextFontSize)
          layerParams.push(`fs-${transform.overlayTextFontSize}`);
        if (transform.overlayTextColor)
          layerParams.push(`co-${transform.overlayTextColor}`);
        if (transform.gravity) {
          // Map common gravity values to ImageKit positioning
          const gravityMap: Record<GravityValue, string> = {
            center: "center",
            north_west: "top_left",
            north_east: "top_right",
            south_west: "bottom_left",
            south_east: "bottom_right",
            north: "top",
            south: "bottom",
            west: "left",
            east: "right",
          };
          const mappedGravity =
            gravityMap[transform.gravity] || transform.gravity;
          layerParams.push(`lfo-${mappedGravity}`);
        }
        if (transform.overlayTextPadding)
          layerParams.push(`pa-${transform.overlayTextPadding}`);
        if (transform.overlayBackground)
          layerParams.push(`bg-${transform.overlayBackground}`);

        layerParams.push("l-end");
        return layerParams.join(",");
      }

      return params.join(",");
    })
    .filter((param) => param.length > 0);

  if (transformParamStrings.length === 0) return src;

  // Join transformations with : (each transform group separated by :)
  const transformParams = transformParamStrings.join(":");

  // Insert transformation parameters into URL
  // ImageKit format: https://ik.imagekit.io/endpoint/tr:param1,param2:param3/image.jpg
  try {
    const url = new URL(src);
    const pathParts = url.pathname.split("/").filter((p) => p);
    
    // Remove any existing tr: transformation
    const pathWithoutTr = pathParts.filter((p) => !p.startsWith("tr:"));
    const filename = pathWithoutTr[pathWithoutTr.length - 1];
    const basePath = pathWithoutTr.slice(0, -1);
    
    // Build new path with transformations
    const newPath = [...basePath, `tr:${transformParams}`, filename]
      .filter((p) => p)
      .join("/");
    
    url.pathname = `/${newPath}`;
    return url.toString();
  } catch {
    // Fallback for relative URLs or invalid URLs
    if (src.includes("/tr:")) {
      // Already has transformations, replace
      const baseUrl = src.split("/tr:")[0];
      const afterTr = src.split("/tr:")[1];
      const filename = afterTr.split("/").pop() || "";
      return `${baseUrl}/tr:${transformParams}/${filename}`;
    } else {
      // Add new transformations before the filename
      const urlParts = src.split("/");
      const filename = urlParts[urlParts.length - 1];
      const basePath = urlParts.slice(0, -1).join("/");
      return `${basePath}/tr:${transformParams}/${filename}`;
    }
  }
};
  
// Types for upload response
export interface ImageKitUploadSuccessData {
  fileId: string;
  name: string;
  url: string;
  width: number;
  height: number;
  size: number;
}

export interface ImageKitUploadSuccessResponse {
  success: true;
  data: ImageKitUploadSuccessData;
}

export interface ImageKitUploadErrorResponse {
  success: false;
  error: string;
}

export type ImageKitUploadResponse =
  | ImageKitUploadSuccessResponse
  | ImageKitUploadErrorResponse;

// Upload file to ImageKit using your server-side API
export const uploadToImageKit = async (
  file: File,
  fileName: string
): Promise<ImageKitUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", fileName);

    const response = await fetch("/api/imagekit/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { error?: string };
      throw new Error(errorData.error || "Upload failed");
    }

    const result = (await response.json()) as ImageKitUploadSuccessData;

    return {
      success: true,
      data: {
        fileId: result.fileId,
        name: result.name,
        url: result.url,
        width: result.width,
        height: result.height,
        size: result.size,
      },
    };
  } catch (error) {
    console.error("ImageKit upload error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
};