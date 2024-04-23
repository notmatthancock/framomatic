import type { CropOptions } from "crop-image-data";
import type { Box, Size } from "@/app/types";

/**
 * Convert bounding box (x, y, width, height) to
 * CropOptions (top, right, bottom, left)
 *
 * @param box Bounding box
 * @param imageSize Size of the image being cropped.
 * @returns CropOptions
 */
export function boxToCropOptions(box: Box, imageSize: Size): CropOptions {
  const result = {
    top: Math.round(box.y),
    right: Math.round(imageSize.width - (box.x + box.width)),
    bottom: Math.round(imageSize.height - (box.y + box.height)),
    left: Math.round(box.x),
  };
  return result
}

export function rescaleBox(box: Box, sourceSize: Size, targetSize: Size): Box {
  const horizontalFactor = targetSize.width / sourceSize.width;
  const verticalFactor = targetSize.height / sourceSize.height;
  const result = {
    x: box.x * horizontalFactor,
    y: box.y * verticalFactor,
    width: box.width * horizontalFactor,
    height: box.height * verticalFactor,
  };
  return result
}

// @ts-ignore
export function cartesian(...a) {
  // @ts-ignore
  return a.reduce((a, b) => a.flatMap((d) => b.map((e) => [d, e].flat())));
}
