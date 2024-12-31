import cv from "@techstark/opencv-js";

import type { Box, Frame, Grid, WorkerMessage } from "@/app/types";

var templateImage: cv.Mat | null = null;

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

  const adjustedFrame = adjustFramePosition(
    nextFrame,
    image,
    templateImage,
    searchSizeFraction
  );

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

  return { ...frame, x: minMax.maxLoc.x + xmin, y: minMax.maxLoc.y + ymin };
}

function cropFramesFromImage(
  image: cv.Mat,
  firstFrame: Frame,
  frameSpacingWidth: number,
  frameSpacingHeight: number,
  grid: Grid,
  searchSizeFraction: number = 0.25,
  nLagFrames: number = 16,
  templateImage: cv.Mat | null = null
): cv.Mat {
  if (nLagFrames <= 0) {
    throw new Error(`nLagFrames=${nLagFrames} must be greater than 0`);
  }

  let currFrame = { ...firstFrame };

  if (templateImage === null) {
    console.log("template image is null");
    templateImage = cropFromFrame(firstFrame, image);
  } else {
    // Only needed when handling sheets (images) beyond
    currFrame = adjustFramePosition(
      currFrame,
      image,
      templateImage,
      // The initial frame adjustment should use a larger search
      // space to account for the fact that there could be movement
      // in the overall grid position between frames.
      1.5*searchSizeFraction
    );
  }

  let frames: Frame[] = [currFrame];

  while (
    !(currFrame.row === grid.nRows - 1 && currFrame.col === grid.nCols - 1)
  ) {
    const msg: WorkerMessage = { type: "newFrame", frame: currFrame };
    postMessage(msg);

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

  const msg: WorkerMessage = { type: "newFrame", frame: currFrame };
  postMessage(msg);
  const endMsg: WorkerMessage = { type: "sheetEnd" };
  postMessage(endMsg);
  return templateImage;
}

cv["onRuntimeInitialized"] = () => {
  onmessage = (e) => {
    const {
      imageData,
      firstFrame,
      frameSpacingBox,
      gridDimensions,
    }: {
      imageData: ImageData;
      firstFrame: Frame;
      frameSpacingBox: Box;
      gridDimensions: Grid;
    } = e.data;

    try {

      const imageMat = cv.matFromImageData(imageData);
      const frameSpacingHeight = frameSpacingBox.height - 2 * firstFrame.height;
      const frameSpacingWidth = frameSpacingBox.width - 2 * firstFrame.width;

      // This is a bit hacky. templateImage is global state
      // so that it persists betweeen detections for adjacent
      // sheets. An alternative would be to post the template
      // image on the "sheet end" message. But cv.Mat isn't
      // serializable.
      if (firstFrame.sheet == 0) templateImage = null
      // assign to templateImage so that it is used on the next sheet
      templateImage = cropFramesFromImage(
        imageMat,
        firstFrame,
        frameSpacingWidth,
        frameSpacingHeight,
        gridDimensions,
        0.25,
        16,
        templateImage
      );
    } catch (err: any) {
      const errMsg: WorkerMessage = {type: "error", error: err.stack}
      console.error(err)
      postMessage(errMsg)
    }
  };
};
