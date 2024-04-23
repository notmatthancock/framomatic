"use client";

import { Box as MantineBox, Group, Image } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import Controls from "@/app/components/Controls";
import FramePlayer from "@/app/components/FramePlayer";
import ImageLoader from "@/app/components/ImageLoader";
import type { Box, Frame, GridParams } from "@/app/types";
import { setSourceMapsEnabled } from "process";

export default function Home() {
  ///////////////////////////////////////////////////////////////////
  // State variables, refs, etc.
  const [imageUrl, setImageUrl] = useState<string>();
  const [imageData, setImageData] = useState<ImageData>();
  const [userBoxColor, setUserBoxColor] = useState("#ff0000");
  const [autoBoxColor, setautoBoxColor] = useState("#0000ff");
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker>();
  const {
    ref: imageRef,
    width: imageWidth,
    height: imageHeight,
  } = useElementSize();
  const [userBox, setUserBox] = useState<Box>({
    x: 10,
    y: 10,
    width: 75,
    height: 75,
  });
  const [gridParams, setGridParams] = useState<GridParams>({
    xSpacing: 15,
    ySpacing: 15,
    numRows: 4,
    numCols: 5,
  });
  const [autoBoxesLocked, setAutoBoxesLocked] = useState(true);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [framesLoading, setFramesLoading] = useState(false);
  const [zoomScale, setZoomScale] = useState(1.0)

  ///////////////////////////////////////////////////////////////////
  // Hooks and what not
  useEffect(() => {
    if (imageData && workerRef.current) {
      setFramesLoading(true);
      workerRef.current.postMessage({
        userBox: userBox,
        gridParams: gridParams,
        imageData: imageData,
        imageWidth: imageWidth,
        imageHeight: imageHeight,
      });
    }
  }, [gridParams, imageData, imageHeight, imageWidth, userBox]);

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
          autoBoxColor={autoBoxColor}
          autoBoxesLocked={autoBoxesLocked}
          gridParams={gridParams}
          setGridParams={setGridParams}
          setAutoBoxColor={setautoBoxColor}
          setAutoBoxesLocked={setAutoBoxesLocked}
          setUserBox={setUserBox}
          setUserBoxColor={setUserBoxColor}
          userBox={userBox}
          userBoxColor={userBoxColor}
          loading={framesLoading}
        />
        {imageUrl ? (
          <>
            <Group align="start">
                <TransformWrapper panning={{disabled: true}} onZoomStop={(ref, event) => setZoomScale(ref.state.scale)}>
                  <TransformComponent>
              <MantineBox
                w="fit-content"
                m="auto"
                pos="relative"
                mah="calc(100% - 80px - (1rem * 2))"
              >
                <Rnd
                  bounds={imageRef.current}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderColor: userBoxColor,
                    borderStyle: "solid",
                    borderWidth: "1px",
                    background: "none",
                  }}
                  scale={zoomScale}
                  lockAspectRatio={false}
                  size={{ width: userBox.width, height: userBox.height }}
                  position={{ x: userBox.x, y: userBox.y }}
                  onDragStop={(e, b) => {
                    setUserBox({ ...userBox, x: b.x, y: b.y });
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    setUserBox({
                      width: parseInt(ref.style.width),
                      height: parseInt(ref.style.height),
                      ...position,
                    });
                  }}
                />
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
                            borderColor: autoBoxColor,
                            borderStyle: "solid",
                            borderWidth: "1px",
                          }}
                          size={{ width: frame.width, height: frame.height }}
                          position={{ x: frame.x, y: frame.y }}
                          disableDragging={autoBoxesLocked}
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
