import cv, { bool } from "@techstark/opencv-js";

import { Box, Frame, Grid } from "@/app/types";

/** Crop an image according to the bounds of Frame */
function cropFromFrame(frame: Frame, image: cv.Mat): cv.Mat {
  return image.roi({
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
  });
}

function locateNextFrame(
  image: cv.Mat,
  currFrame: Frame,
  frameSpacingWidth: number,
  frameSpacingHeight: number,
  grid: Grid,
  templateImage: cv.Mat,
  searchSizeFraction: number = 0.25
): Frame {
  if (currFrame.row === grid.nRows - 1 && currFrame.col === grid.nCols - 1) {
    throw new Error("Reached the last frame.");
  }

  // Copy the current frame as a starting point for the next frame
  let nextFrame = { ...currFrame };

  // Update the row/col coordinate/number if applicable

  // If last column, increment row number and coordinate and reset
  // column number and coordinate back to beginning of the row.
  if (currFrame.col === grid.nCols - 1) {
    nextFrame.row += 1;
    nextFrame.y += currFrame.height + frameSpacingHeight;
    // reset column coordinate and number
    nextFrame.col = 0;
    nextFrame.x -=
      currFrame.width * (grid.nCols - 1) + frameSpacingWidth * (grid.nCols - 1);
  } else {
    nextFrame.col += 1;
    nextFrame.x += currFrame.width + frameSpacingWidth;
  }

  if (
    !(0 <= nextFrame.y && nextFrame.y < image.rows) ||
    !(
      0 <= nextFrame.y + nextFrame.height &&
      nextFrame.y + nextFrame.height < image.rows
    )
  ) {
    throw new Error(
      `Frame row coordinate ${nextFrame.y} exceeds image height ${image.rows}`
    );
  }

  if (
    !(0 <= nextFrame.x && nextFrame.x < image.cols) ||
    !(
      0 <= nextFrame.x + nextFrame.width &&
      nextFrame.x + nextFrame.width < image.cols
    )
  ) {
    throw new Error(
      `Frame col coordinate ${nextFrame.x} exceeds image width ${image.cols}`
    );
  }

  // adjustFramePosition(nextFrame, image, templateImage, searchSizeFraction);

  return nextFrame;
}

// function adjustFramePosition(
//   frame: Frame,
//   image: cv.Mat,
//   templateImage: cv.Mat,
//   searchSizeFraction: number,
// ): void {
//   if (image.channels !== 3) {
//     throw new Error("Only RGB images supported (no grayscale or RGBA)");
//   }

//   const searchSizeWidth = Math.round(searchSizeFraction * frame.width);
//   const searchSizeHeight = Math.round(searchSizeFraction * frame.height);

//   const imin = Math.max(0, frame.i - searchSizeHeight);
//   const imax = Math.min(image.rows - 1, frame.i + frame.height + searchSizeHeight);
//   const jmin = Math.max(0, frame.j - searchSizeWidth);
//   const jmax = Math.min(image.cols - 1, frame.j + frame.width + searchSizeWidth);

//   // Cropped portion of the image to search for location of new frame
//   const searchImage = image.roi({ x: jmin, y: imin, width: jmax - jmin, height: imax - imin });

//   let result = cv.matchTemplate(searchImage, templateImage, cv.TM_CCOEFF_NORMED);
//   let minMax = result.minMaxLoc();
//   const { maxLoc: { x: jbest, y: ibest } } = minMax;

//   frame.i = ibest + imin;
//   frame.j = jbest + jmin;
// }

function cropFramesFromImage(
  image: cv.Mat,
  firstFrame: Frame,
  frameSpacingWidth: number,
  frameSpacingHeight: number,
  grid: Grid,
  searchSizeFraction: number = 0.15,
  nLagFrames: number = 16,
  templateImage: cv.Mat | null = null
) {
  if (nLagFrames < 1) {
    throw new Error(`nLagFrames=${nLagFrames} must be greater than 0`);
  }

  if (templateImage === null) {
    templateImage = cropFromFrame(firstFrame, image);
  } else {
    // Only needed when handling sheets (images) beyond
    // adjustFramePosition(firstFrame, image, templateImage, searchSizeFraction);
  }

  let currFrame = firstFrame;
  let frames: Frame[] = [currFrame];

  while (
    !(currFrame.row === grid.nRows - 1 && currFrame.col === grid.nCols - 1)
  ) {
    postMessage({ frame: currFrame });

    const nextFrame = locateNextFrame(
      image,
      currFrame,
      frameSpacingWidth,
      frameSpacingHeight,
      grid,
      templateImage
    );

    frames.push(nextFrame);
    // Keep only the last nLagFrames
    if (frames.length > nLagFrames) {
      frames = frames.slice(1);
    }

    // let meanImage: cv.Mat = new cv.Mat(
    //   templateImage.rows,
    //   templateImage.cols,
    //   templateImage.type,
    //   [0, 0, 0]
    // );

    // for (const frame of frames) {
    //   cv.addWeighted(
    //     meanImage,
    //     1,
    //     cropFromFrame(frame, image),
    //     1 / frames.length,
    //     0,
    //     meanImage
    //   );
    // }
    // templateImage = meanImage;

    currFrame = nextFrame;
  }

  postMessage({ frame: currFrame });
}

cv["onRuntimeInitialized"] = () => {
  onmessage = (e) => {
    const { imageData, firstFrame, frameSpacingBox, gridDimensions } = e.data;
    const imageMat = cv.matFromImageData(imageData);
    const frameSpacingHeight = frameSpacingBox.height - 2 * firstFrame.height;
    const frameSpacingWidth = frameSpacingBox.width - 2 * firstFrame.width;

    // TODO: loop over images (handle multiple sheets)
    cropFramesFromImage(
      imageMat,
      firstFrame,
      frameSpacingWidth,
      frameSpacingHeight,
      gridDimensions
    );
  };
};
