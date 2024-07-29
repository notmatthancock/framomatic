"use client";

import { Box as MantineBox, Group, Image } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import { useEffect, useRef, useState } from "react";
import { Grid, Rnd } from "react-rnd";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import Controls from "@/app/components/Controls";
import FramePlayer from "@/app/components/FramePlayer";
import ImageLoader from "@/app/components/ImageLoader";
import {
  Frame,
  GridOptions,
  ScanOrder,
  SelectionMode,
  Size,
} from "@/app/types";

const defaultGridOptions: GridOptions = {
  frameWidth: 20,
  frameHeight: 20,
  numRows: 5,
  numCols: 5,
  color: "red",
  locked: false,
  selectionMode: SelectionMode.FREE,
  startOffset: 0,
  endOffset: 0,
  scanOrder: ScanOrder.COLS_FIRST,
};

const initializeFramePositions = (
  gridOptions: GridOptions,
  imageSize: Size
): Frame[] => {
  const frameSize = Math.min(
    Math.floor(imageSize.width / gridOptions.numCols),
    Math.floor(imageSize.height / gridOptions.numRows)
  );
  gridOptions.frameWidth = gridOptions.frameWidth = frameSize;
  const minHeight = gridOptions.numRows * frameSize;
  const minWidth = gridOptions.numCols * frameSize;
  const widthRemainder = imageSize.width - minWidth;
  const heightRemainder = imageSize.height - minHeight;

  return [];
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
    if (imageData && workerRef.current) {
      setFramesLoading(true);
      workerRef.current.postMessage({
        gridOptions: gridOptions,
        imageData: imageData,
        imageWidth: imageWidth,
        imageHeight: imageHeight,
      });
    }
  }, [gridOptions, imageData, imageHeight, imageWidth]);

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
        <Controls
          gridOptions={gridOptions}
          setGridOptions={setGridOptions}
          loading={framesLoading}
        />
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
                      return (
                        <>
                          {i != 0 && (
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
                              position={{ x: frame.x, y: frame.y }}
                              disableDragging={gridOptions.locked}
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
                              enableResizing={false}
                            />
                          )}
                        </>
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
