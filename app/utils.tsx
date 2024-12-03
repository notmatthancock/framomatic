import type { CropOptions } from "crop-image-data";
import type {
  Box,
  Frame,
  GridOptions,
  Size,
  SpatialPosition,
} from "@/app/types";

/** True if two line segments (a1, b1) and (a2, b2) overlap */
const overlaps1d = (
  a1: number,
  b1: number,
  a2: number,
  b2: number
): boolean => {
  return Math.min(b1, b2) > Math.max(a1, a2);
};

/** True if box1 and box2 intersect */
export function overlaps(box1: Box, box2: Box): boolean {
  return (
    // overlaps in x
    overlaps1d(box1.x, box1.x + box1.width, box2.x, box2.x + box2.width) &&
    // overlaps in y
    overlaps1d(box1.y, box1.y + box1.height, box2.y, box2.y + box2.height)
  );
}

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
  return result;
}

export function rescaleBox(box: Box, sourceSize: Size, targetSize: Size): Box {
  const horizontalFactor = targetSize.width / sourceSize.width;
  const verticalFactor = targetSize.height / sourceSize.height;
  return {
    ...box,
    x: box.x * horizontalFactor,
    y: box.y * verticalFactor,
    width: box.width * horizontalFactor,
    height: box.height * verticalFactor,
  };
}

// @ts-ignore
export function cartesian(...a) {
  // @ts-ignore
  return a.reduce((a, b) => a.flatMap((d) => b.map((e) => [d, e].flat())));
}

type valueof<T> = T[keyof T];

export function enumKeys<O extends object, K extends keyof O = keyof O>(
  obj: O
): K[] {
  return Object.keys(obj) as K[];
}

export function enumEntries<
  O extends object,
  K extends keyof O = keyof O,
  V extends valueof<O> = valueof<O>
>(obj: O): [K, V][] {
  return Object.entries(obj).map(([k, v]) => {
    return [k as K, v as V]; //{ key: k as K, val: v as V };
  });
}

export function enumValues<O extends object, V extends valueof<O> = valueof<O>>(
  obj: O
): V[] {
  return Object.values(obj);
}
export const framesOverlap = (frames: Frame[]): boolean => {
  // Brute force every pair of boxes and check for overlap
  for (var i = 0; i < frames.length; i++) {
    for (var j = i + 1; j < frames.length; j++) {
      if (overlaps(frames[i], frames[j])) {
        return true;
      }
    }
  }
  return false;
};

export function frameInBounds(frame: Frame, imageSize: Size): boolean {
  return !(
    frame.x < 0 ||
    frame.x + frame.width > imageSize.width ||
    frame.y < 0 ||
    frame.y + frame.height > imageSize.height
  );
}

export const framesInBounds = (frames: Frame[], imageSize: Size): boolean => {
  for (var i = 0; i < frames.length; i++) {
    if (!frameInBounds(frames[i], imageSize)) return false;
  }
  return true;
};

const INIT_FRAME_SIZE_FRACTION = 0.1;

export function getInitialFirstFrame(imageSize: Size): Frame {
  const x = Math.floor(imageSize.width * INIT_FRAME_SIZE_FRACTION);
  const y = Math.floor(imageSize.height * INIT_FRAME_SIZE_FRACTION);
  const size = Math.max(x, y);
  const firstFrame: Frame = {
    row: 0,
    col: 0,
    x: x,
    y: y,
    width: size,
    height: size,
    active: true,
    locked: false,
    sheet: 0,
  };
  return firstFrame;
}

// camelCase to Title Case
export function toTitle(text: string): string {
  const result = text.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function transformCoords(
  frame: Frame,
  sourceSize: Size,
  targetSize: Size
): Frame {
  const horizontalFactor = targetSize.width / sourceSize.width; // zoomScale;
  const verticalFactor = targetSize.height / sourceSize.height; // zoomScale;
  return {
    ...frame,
    x: frame.x * horizontalFactor,
    y: frame.y * verticalFactor,
    width: frame.width * horizontalFactor,
    height: frame.height * verticalFactor,
  };
}
