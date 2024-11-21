import cv from "@techstark/opencv-js";

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

  const adjustedFrame = adjustFramePosition(nextFrame, image, templateImage, searchSizeFraction);

  return adjustedFrame;
}

function adjustFramePosition(
  frame: Frame,
  image: cv.Mat,
  templateImage: cv.Mat,
  searchSizeFraction: number
): Frame {
  const searchSizeWidth = Math.round(searchSizeFraction * frame.width);
  const searchSizeHeight = Math.round(searchSizeFraction * frame.height);

  const ymin = Math.max(0, frame.y - searchSizeHeight);
  const ymax = Math.min(
    image.rows - 1,
    frame.y + frame.height + searchSizeHeight
  );
  const xmin = Math.max(0, frame.x - searchSizeWidth);
  const xmax = Math.min(
    image.cols - 1,
    frame.x + frame.width + searchSizeWidth
  );

  // Cropped portion of the image to search for location of new frame
  const searchImage = image.roi({
    x: xmin,
    y: ymin,
    width: xmax - xmin,
    height: ymax - ymin,
  });

  let result = new cv.Mat(
    searchImage.rows - templateImage.rows + 1,
    searchImage.cols - templateImage.cols + 1,
    cv.CV_32FC1
  );

  cv.matchTemplate(searchImage, templateImage, result, cv.TM_CCOEFF_NORMED);
  // @ts-ignore
  let minMax = cv.minMaxLoc(result);

  // debug: ignore this below
  const newSearch = new cv.Mat()
  cv.cvtColor(searchImage, newSearch, cv.COLOR_RGB2RGBA)
  if (frame.row == 4 && frame.col == 3) {
  postMessage({
    searchImage: new ImageData(
      new Uint8ClampedArray(newSearch.data),
      newSearch.cols,
      newSearch.rows
    ),
    maxLoc: minMax.maxLoc,
  });
}

  return {...frame, 
   x: minMax.maxLoc.x + xmin,
   y: minMax.maxLoc.y + ymin,
  }

}

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
  if (nLagFrames <= 0) {
    throw new Error(`nLagFrames=${nLagFrames} must be greater than 0`);
  }

  if (templateImage === null) {
    templateImage = cropFromFrame(firstFrame, image);
  } else {
    // Only needed when handling sheets (images) beyond
    adjustFramePosition(firstFrame, image, templateImage, searchSizeFraction);
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

    // Keep only the last nLagFrames
    frames.push(nextFrame);
    if (frames.length > nLagFrames) {
      frames = frames.slice(1);
    }

    let meanImage: cv.Mat = new cv.Mat(
      templateImage.rows,
      templateImage.cols,
      templateImage.type(),
      [0, 0, 0, 0]
    );

    for (const frame of frames) {
      cv.addWeighted(
        meanImage,
        1,
        cropFromFrame(frame, image),
        1 / frames.length,
        0,
        meanImage
      );
    }
    templateImage = meanImage;

    currFrame = nextFrame;
  }

  postMessage({ frame: currFrame });
}

cv["onRuntimeInitialized"] = () => {
  onmessage = (e) => {
    const {
      sheet,
      imageData,
      firstFrame,
      frameSpacingBox,
      gridDimensions,
    }: {
      sheet: number;
      imageData: ImageData;
      firstFrame: Frame;
      frameSpacingBox: Box;
      gridDimensions: Grid;
    } = e.data;
    const imageMat = cv.matFromImageData(imageData);
    const frameSpacingHeight = frameSpacingBox.height - 2 * firstFrame.height;
    const frameSpacingWidth = frameSpacingBox.width - 2 * firstFrame.width;

    console.log("sheet from worker", sheet)

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
