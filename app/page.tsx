"use client";

import { Box as MantineBox, Group, Image } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import GridOptionsComponent from "@/app/components/GridOptionsComponent";
import FramePlayer from "@/app/components/FramePlayer";
import ImageLoader from "@/app/components/ImageLoader";
import { Frame, GridOptions, SelectionMode, Size } from "@/app/types";

const defaultGridOptions: GridOptions = {
  frameWidth: -1,
  frameHeight: -1,
  numRows: -1,
  numCols: -1,
  color: "#ff6666",
  lockAspectRatio: false,
  locked: true,
  selectionMode: SelectionMode.EQUAL,
  startOffset: 0,
  endOffset: 0,
};

// Fraction of image width/height to reserve for padding and spacing
// during frame initialization.
// These are just meant to supply *some* decent looking initialization
// and are not terribly important.
const initialPaddingFraction = 0.1;
const initialFrameSizeFraction = 0.1;

/**
 * A heuristic to initialize frames to fit into a new image.
 * This is used when the user adds a new image.
 */
const initializeFramePositions = (
  gridOptions: GridOptions,
  imageSize: Size
): Frame[] => {
  const widthPadding = imageSize.width * initialPaddingFraction;
  const widthMinusPadding = imageSize.width - 2 * widthPadding;
  const heightPadding = imageSize.height * initialPaddingFraction;
  const heightMinusPadding = imageSize.height - 2 * heightPadding;

  const frameSize = Math.max(
    Math.floor(imageSize.width * initialFrameSizeFraction),
    Math.floor(imageSize.height * initialFrameSizeFraction)
  );

  gridOptions.frameWidth = gridOptions.frameHeight = frameSize;
  gridOptions.numCols = Math.floor(widthMinusPadding / frameSize) -1;
  gridOptions.numRows = Math.floor(heightMinusPadding / frameSize)-1;

  const widthSpacing =
    (widthMinusPadding - gridOptions.numCols * frameSize) /
    (gridOptions.numCols - 1);
  const heightSpacing =
    (heightMinusPadding - gridOptions.numRows * frameSize) /
    (gridOptions.numRows - 1);

  console.debug({
    imageSize,
    gridOptions,
    frameSize,
    widthSpacing,
    heightSpacing,
  });

  var frames: Frame[] = [];

  for (var i = 0; i < gridOptions.numRows; i++) {
    for (var j = 0; j < gridOptions.numCols; j++) {
      frames.push({
        // active if greater than or equal to offset value
        active: i * gridOptions.numRows + j >= gridOptions.startOffset,
        row: i,
        col: j,
        width: frameSize,
        height: frameSize,
        x: j * frameSize + j * widthSpacing + widthPadding,
        y: i * frameSize + i * heightSpacing + heightPadding,
        data: null,
      });
    }
  }

  return frames;
};

// const getFramePositions = (
//   gridOptions: GridOptions,
//   imageSize: Size,
//   prevFrames: Frame[] | null = null,
//   newFrame: Frame | null = null
// ): Frame[] => {
//   return [];
// };

export default function Home() {
  ///////////////////////////////////////////////////////////////////
  // State variables, refs, etc.
  const [imageUrl, setImageUrl] = useState<string>();
  const [imageData, setImageData] = useState<ImageData>();
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker>();
  const {
    ref: imageRef,
    width: imageWidth,
    height: imageHeight,
  } = useElementSize();
  const [gridOptions, setGridOptions] =
    useState<GridOptions>(defaultGridOptions);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [framesLoading, setFramesLoading] = useState(false);
  const [zoomScale, setZoomScale] = useState(1.0);

  ///////////////////////////////////////////////////////////////////
  // Hooks and what not
  useEffect(() => {
    if (imageData === null || imageWidth == 0 || imageHeight == 0) {
      return
    }
      // setFramesLoading(true);
    if (frames.length == 0) {
      setFrames(
        initializeFramePositions(gridOptions, {
          width: imageWidth,
          height: imageHeight,
        })
      );
      setGridOptions(gridOptions);
    }
      // workerRef.current.postMessage({
      //   gridOptions: gridOptions,
      //   imageData: imageData,
      //   imageWidth: imageWidth,
      //   imageHeight: imageHeight,
      // });
  }, [imageData, imageHeight, imageWidth]);

  useEffect(() => {
    // Setup worker
    workerRef.current = new Worker(
      new URL("./frame-cropper.ts", import.meta.url)
    );
    workerRef.current.onmessage = (e) => {
      setFrames(e.data.frames);
      setFramesLoading(false);
    };
  }, []);

  return (
    <>
      <Group align="start">
        {imageUrl && (
          <GridOptionsComponent
            gridOptions={gridOptions}
            setGridOptions={setGridOptions}
            loading={framesLoading}
            frames={frames}
          />
        )}
        {imageUrl ? (
          <>
            <Group align="start">
              <TransformWrapper
                panning={{ disabled: true }}
                onZoomStop={(ref, event) => setZoomScale(ref.state.scale)}
              >
                <TransformComponent>
                  <MantineBox
                    w="fit-content"
                    m="auto"
                    pos="relative"
                    mah="calc(100% - 80px - (1rem * 2))"
                  >
                    {frames.map((frame, i) => {
                      console.debug(frame);
                      return (
                        <Rnd
                          key={i}
                          bounds="parent"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "solid 1px blue",
                            background: "none",
                            borderColor: gridOptions.color,
                            borderStyle: "solid",
                            borderWidth: "1px",
                          }}
                          size={{
                            width: frame.width,
                            height: frame.height,
                          }}
                          lockAspectRatio={gridOptions.lockAspectRatio}
                          position={{ x: frame.x, y: frame.y }}
                          disableDragging={gridOptions.locked}
                          onDragStop={(e, pos) => {
                            console.log(i);
                          }}
                          // onDragStop={(e, pos) =>
                          //   setAutoBoxes(
                          //     (boxes) => {
                          //       return boxes.map((b, j) => {
                          //         return i == j ? { ...b, x: pos.x, y: pos.y } : b;
                          //       });
                          //     }
                          //     // autoBoxPositions.map((p, j) =>
                          //     //   i == j ? { x: pos.x, y: pos.y } : p
                          //     // )
                          //   )
                          // }
                          enableResizing={true}
                        />
                      );
                    })}
                    <Image
                      ref={imageRef}
                      style={{ border: "1px solid #ccc" }}
                      radius="sm"
                      alt="Main image to divide into animation frames"
                      w={800}
                      h="auto"
                      src={imageUrl}
                      onLoad={(e) => {
                        const img: HTMLImageElement = e.currentTarget;
                        const h = img.naturalHeight;
                        const w = img.naturalWidth;
                        const canvas = imageCanvasRef.current!;
                        canvas.width = w;
                        canvas.height = h;
                        const context = canvas.getContext("2d")!;
                        context.drawImage(img, 0, 0);
                        setImageData(context.getImageData(0, 0, w, h));
                      }}
                    />
                  </MantineBox>
                </TransformComponent>
              </TransformWrapper>
            </Group>
            <Group>
              {/* Hidden canvas used to extract image pixel data */}
              <canvas ref={imageCanvasRef} style={{ display: "none" }} />
              {frames.length > 0 && <FramePlayer frames={frames} />}
            </Group>
          </>
        ) : (
          <ImageLoader setImageUrl={setImageUrl} />
        )}
      </Group>
    </>
  );
}
