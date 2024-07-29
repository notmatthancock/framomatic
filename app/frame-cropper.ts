import cropImageData from "crop-image-data";

import { boxToCropOptions, rescaleBox } from "@/app/utils";
import type { Box, GridOptions } from "@/app/types";

const generateFrames = (
  gridOptions: GridOptions,
  imageData: ImageData,
  imageWidth: number,
  imageHeight: number
) => {
  let frames = [];

  for (let i = 0; i < gridOptions.numRows; i++) {
    for (let j = 0; j < gridOptions.numCols; j++) {
      const box = {
        x: userBox.x + j * (userBox.width + gridOptions.xSpacing),
        y: userBox.y + i * (userBox.height + gridOptions.ySpacing),
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
  const { gridParams, imageData, imageWidth, imageHeight } = e.data;
  postMessage({
    frames: generateFrames(
      gridParams,
      imageData,
      imageWidth,
      imageHeight
    ),
  });
};
