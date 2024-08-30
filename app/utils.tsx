import type { CropOptions } from "crop-image-data";
import type { Box, Frame, GridOptions, Size } from "@/app/types";

/** True if a corner frame */
export function isCornerFrame(frame: Frame, gridOptions: GridOptions): boolean {
  const row = frame.row;
  const col = frame.col;
  const lastRow = gridOptions.numRows - 1;
  const lastCol = gridOptions.numCols - 1;
  return (
    (row == 0 && col == 0) ||
    (row == 0 && col == lastCol) ||
    (row == lastRow && col == 0) ||
    (row == lastRow && col == lastCol)
  );
}

/** True if two line segments (a1, b1) and (a2, b2) overlap */
const overlaps1d = (
  a1: number,
  b1: number,
  a2: number,
  b2: number
): boolean => {
  return Math.min(b1, b2) > Math.max(a1, a2);
};

/** True if two box1 and box2 intersect */
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
  const result = {
    ...box,
    x: box.x * horizontalFactor,
    y: box.y * verticalFactor,
    width: box.width * horizontalFactor,
    height: box.height * verticalFactor,
  };
  return result;
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
export const framesInBounds = (frames: Frame[], imageSize: Size): boolean => {
  for (var i = 0; i < frames.length; i++) {
    if (
      frames[i].x < 0 ||
      frames[i].x + frames[i].width > imageSize.width ||
      frames[i].y < 0 ||
      frames[i].y + frames[i].height > imageSize.height
    ) {
      return false;
    }
  }
  return true;
};
export const getLockAspectRatio = (
  gridOptions: GridOptions
): boolean | number => {
  if (gridOptions.lockAspectRatio === false) {
    return false;
  } else {
    return gridOptions.frameWidth / gridOptions.frameHeight;
  }
};
