import cropImageData from "crop-image-data";

import { boxToCropOptions, rescaleBox } from "@/app/utils";
import type { Box, GridParams } from "@/app/types";

const generateFrames = (
  userBox: Box,
  gridParams: GridParams,
  imageData: ImageData,
  imageWidth: number,
  imageHeight: number
) => {
  let frames = [];

  for (let i = 0; i < gridParams.numRows; i++) {
    for (let j = 0; j < gridParams.numCols; j++) {
      const box = {
        x: userBox.x + j * (userBox.width + gridParams.xSpacing),
        y: userBox.y + i * (userBox.height + gridParams.ySpacing),
        width: userBox.width,
        height: userBox.height,
      };
      frames.push({
        ...box,
        data: imageData
          ? cropImageData(
              imageData,
              boxToCropOptions(
                rescaleBox(
                  box,
                  {
                    width: imageWidth,
                    height: imageHeight,
                  },
                  { width: imageData.width, height: imageData.height }
                ),
                {
                  width: imageData.width,
                  height: imageData.height,
                }
              )
            )
          : null,
      });
    }
  }
  return frames;
};

onmessage = (e) => {
  const { userBox, gridParams, imageData, imageWidth, imageHeight } = e.data;
  postMessage({
    frames: generateFrames(
      userBox,
      gridParams,
      imageData,
      imageWidth,
      imageHeight
    ),
  });
};
