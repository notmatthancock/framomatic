"use client";

import {
  Box as MantineBox,
  Button,
  Group,
  Image,
  Modal,
  NumberInput,
  Stack,
  Title,
  Text,
} from "@mantine/core";
import { useDisclosure, useElementSize } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Rnd, DraggableData, ResizableDelta, Position } from "react-rnd";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { IconLock } from "@tabler/icons-react";

import GridOptionsComponent from "@/app/components/GridOptionsComponent";
import FramePlayer from "@/app/components/FramePlayer";
import ImageLoader from "@/app/components/ImageLoader";
import { Box, Frame, Grid, GridOptions, Size, WizardStep } from "@/app/types";
import { framesOverlap, rescaleBox } from "@/app/utils";

const defaultGridOptions: GridOptions = {
  frameWidth: -1,
  frameHeight: -1,
  frameColor: "#ff6666",
  frameThickness: 1,
  lockAspectRatio: false,
  x: 0,
  y: 0,
};

const initialFrameSizeFraction = 0.1;

const getInitialFrame = (imageSize: Size): Frame => {
  const x = Math.floor(imageSize.width * initialFrameSizeFraction);
  const y = Math.floor(imageSize.height * initialFrameSizeFraction);
  const size = Math.max(x, y);
  const firstFrame: Frame = {
    row: 0,
    col: 0,
    x: x,
    y: y,
    width: size,
    height: size,
    data: null,
    active: true,
    locked: false,
  };
  return firstFrame;
};

export default function Home() {
  ///////////////////////////////////////////////////////////////////
  // State variables, refs, etc.
  const [imageUrl, setImageUrl] = useState<string>();
  const [imageData, setImageData] = useState<ImageData>();
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker>();
  const {
    ref: imageRef,
    width: imageElementWidth,
    height: imageElementHeight,
  } = useElementSize();
  const [gridDimensions, setGridDimensions] = useState<Grid>({
    nRows: 0,
    nCols: 0,
  });
  const [gridOptions, setGridOptions] =
    useState<GridOptions>(defaultGridOptions);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [framesLoading, setFramesLoading] = useState(false);
  const [frameSpacingBox, setFrameSpacingBox] = useState<Box | undefined>();
  const [zoomScale, setZoomScale] = useState(1.0);
  const [wizardStep, setWizardStep] = useState<WizardStep>(null);

  ///////////////////////////////////////////////////////////////////
  // Hooks and what not
  useEffect(() => {
    if (imageData === null || imageRef.current === null) {
      return;
    }
    // setFramesLoading(true);
    if (frames.length == 0) {
      const firstFrame = getInitialFrame({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
      setFrames([firstFrame]);
      setGridOptions({
        ...gridOptions,
        frameWidth: firstFrame.width,
        frameHeight: firstFrame.height,
      });
      setWizardStep("gridDims");
    }
  }, [frames.length, gridOptions, imageData, imageRef]);

  useEffect(() => {
    // // Instantiate worker for doing frame extraction
    workerRef.current = new Worker(
      new URL("./crop-frames.ts", import.meta.url)
    );
    // // Handle messages from worker
    workerRef.current.onmessage = (e) => {
      if ("frame" in e.data) {
        const frame: Frame = e.data.frame;
        setFrames((prevFrames) => [...prevFrames, frame]);
        // setFramesLoading(false);
        if (
          frame.row == gridDimensions.nRows - 1 &&
          frame.col == gridDimensions.nCols - 1
        ) {
          setWizardStep("free");
        }
      }
    };
    // // Cleanup the worker
    return () => {
      return workerRef.current!.terminate();
    };
  }, []);

  useEffect(() => {
    if (workerRef.current !== undefined && wizardStep == "compute") {
      workerRef.current.postMessage({
        imageData: imageData,
        firstFrame: frames[0],
        frameSpacingBox: frameSpacingBox,
        gridDimensions: gridDimensions,
      });
    }
  }, [wizardStep]);

  const [gridModalOpened, { open: openGridModal, close: closeGridModal }] =
    useDisclosure(false);

  // Coordinate transform to "index space", the coordinate system
  // of the full-res image
  const toIndexSpace = (
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    const sourceWidth = imageElementWidth;
    const sourceHeight = imageElementHeight;
    const targetWidth = imageRef.current!.naturalWidth;
    const targetHeight = imageRef.current!.naturalHeight;
    const horizontalFactor = targetWidth / sourceWidth;
    const verticalFactor = targetHeight / sourceHeight;

    return {
      x: x * horizontalFactor,
      y: y * verticalFactor,
      width: width * horizontalFactor,
      height: height * verticalFactor,
    };
  };

  // coordinate transform to "element space", the coordinate
  // system of the (probably smaller) html image element
  const toElementSpace = (
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    const sourceWidth = imageRef.current!.naturalWidth;
    const sourceHeight = imageRef.current!.naturalHeight;
    const targetWidth = imageElementWidth;
    const targetHeight = imageElementHeight;
    const horizontalFactor = targetWidth / sourceWidth;
    const verticalFactor = targetHeight / sourceHeight;

    return {
      x: x * horizontalFactor,
      y: y * verticalFactor,
      width: width * horizontalFactor,
      height: height * verticalFactor,
    };
  };

  let frameSpacingElementSpace: Omit<Box, "row" | "col">;
  if (wizardStep == "frameSpacing" && frameSpacingBox !== undefined) {
    frameSpacingElementSpace = toElementSpace(
      frameSpacingBox.x,
      frameSpacingBox.y,
      frameSpacingBox.width,
      frameSpacingBox.height
    );
  }
  else {
    // placeholder
    frameSpacingElementSpace = {x: 0, y: 0, width: 1, height: 1} 
  }

  return (
    <>
      <Group align="start">
        <Modal
          opened={gridModalOpened}
          onClose={closeGridModal}
          withCloseButton={false}
          closeOnClickOutside={false}
          closeOnEscape={false}
        >
          <Stack>
            <Group>
              <NumberInput
                label="Num. Rows"
                value={gridDimensions.nRows}
                onChange={(value) => {
                  setGridDimensions({
                    ...gridDimensions,
                    nRows: parseInt(value as string),
                  });
                }}
                min={1}
                error={
                  gridDimensions.nRows < 1
                    ? "Num. Rows must be greater than 0"
                    : false
                }
                placeholder="Enter the number of rows in the frame grid"
                w={100}
              />
              <NumberInput
                label="Num. Cols"
                value={gridDimensions.nCols}
                onChange={(value) => {
                  setGridDimensions({
                    ...gridDimensions,
                    nCols: parseInt(value as string),
                  });
                }}
                min={1}
                error={
                  gridDimensions.nCols < 1
                    ? "Num. Cols must be greater than 0"
                    : false
                }
                placeholder="Enter the number of rows in the frame grid"
                w={100}
              />
            </Group>

            <Text>
              Configure the number of rows and columns in a sheet of animation
              frames.
            </Text>

            <Title order={5}>Sheet Preview</Title>
            <Image alt="Preview" src={imageUrl} />

            <Button
              onClick={() => {
                setWizardStep("firstFrame");
                closeGridModal();
              }}
              disabled={gridDimensions.nRows < 1 || gridDimensions.nCols < 1}
            >
              OK
            </Button>
          </Stack>
        </Modal>
        {imageUrl && (
          <GridOptionsComponent
            gridOptions={gridOptions}
            setGridOptions={setGridOptions}
            loading={framesLoading}
            frames={frames}
            setFrames={setFrames}
            // TODO: since frames are in image coord size,
            // this needs to supply the image ref natural width / height
            imageSize={{ width: imageElementWidth, height: imageElementHeight }}
            wizardStep={wizardStep}
            setWizardStep={setWizardStep}
            setFrameSpacingBox={setFrameSpacingBox}
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
                    {wizardStep != "frameSpacing" &&
                      imageRef.current !== null &&
                      frames.map((frame, i) => {
                        const elementBox = toElementSpace(
                          frame.x,
                          frame.y,
                          frame.width,
                          frame.height
                        );
                        return (
                          <Rnd
                            key={i}
                            bounds="parent"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "solid 1px blue",
                              background: frame.locked
                                ? "rgba(255, 255, 255, 0.85)"
                                : "none",
                              borderColor: gridOptions.frameColor,
                              borderStyle: "solid",
                              borderWidth: `${gridOptions.frameThickness}px`,
                            }}
                            size={{
                              width: elementBox.width!,
                              height: elementBox.height!,
                            }}
                            lockAspectRatio={gridOptions.lockAspectRatio}
                            position={{ x: elementBox.x!, y: elementBox.y! }}
                            disableDragging={frame.locked}
                            onDrag={(e, dragData: DraggableData) => {
                              // Reset the frames. The only frame that
                              // is being changed is the one that is
                              // dragged. For the dragged frame, we need
                              // to remap the coordinate of the drag from
                              // element space to index space.
                              setFrames((prevFrames) => {
                                return prevFrames.map((f) => {
                                  if (
                                    f.row != frame.row ||
                                    f.col != frame.col
                                  ) {
                                    return f;
                                  }
                                  const newCoords = toIndexSpace(
                                    dragData.x,
                                    dragData.y,
                                    // Placeholders for width and height
                                    -1,
                                    -1
                                  );
                                  return {
                                    ...f,
                                    x: newCoords.x!,
                                    y: newCoords.y!,
                                  };
                                });
                              });
                            }}
                            onResizeStop={(
                              e,
                              dir,
                              ref,
                              delta: ResizableDelta,
                              pos: Position
                            ) => {
                              const width = parseInt(ref.style.width);
                              const height = parseInt(ref.style.height);

                              let deltaW: number,
                                deltaH: number,
                                deltaX: number,
                                deltaY: number;

                              // Need to figure out the delta in position and size
                              const r = toIndexSpace(
                                pos.x,
                                pos.y,
                                width,
                                height
                              );
                              // r.* are all defined because pos, width, and height are
                              deltaW = r.width! - frame.width;
                              deltaH = r.height! - frame.height;
                              deltaX = r.x! - frame.x;
                              deltaY = r.y! - frame.y;

                              setFrames((prevFrames) => {
                                return prevFrames.map((f) => {
                                  return {
                                    ...f,
                                    x: f.x + deltaX,
                                    y: f.y + deltaY,
                                    width: f.width + deltaW,
                                    height: f.height + deltaH,
                                  };
                                });
                              });
                              setGridOptions({
                                ...gridOptions,
                                frameWidth: width,
                                frameHeight: height,
                              });
                            }}
                            enableResizing={
                              !frame.locked &&
                              (wizardStep == "firstFrame" ||
                                wizardStep == "free")
                            }
                          >
                            {frame.locked && <IconLock />}
                          </Rnd>
                        );
                      })}
                    {wizardStep == "frameSpacing" &&
                      frameSpacingBox !== undefined && (
                        <Rnd
                          key={frames.length}
                          size={{
                            width: frameSpacingElementSpace.width,
                            height: frameSpacingElementSpace.height,
                          }}
                          position={{
                            x: frameSpacingElementSpace.x,
                            y: frameSpacingElementSpace.y,
                          }}
                          disableDragging={true}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "solid 1px blue",
                            background: "none",
                            borderColor: gridOptions.frameColor,
                            borderStyle: "solid",
                            borderWidth: `${gridOptions.frameThickness}px`,
                          }}
                          enableResizing={{
                            bottomRight: true,
                            right: true,
                            bottom: true,
                          }}
                          onResize={(
                            e,
                            dir,
                            ref,
                            delta: ResizableDelta,
                            pos: Position
                          ) => {
                            const indexBox = toIndexSpace(-1, -1, parseFloat(ref.style.width), parseFloat(ref.style.height))
                            setFrameSpacingBox({
                              ...frameSpacingBox,
                              width: indexBox.width,
                              height: indexBox.height,
                            });
                          }}
                        />
                      )}
                    <Image
                      ref={imageRef}
                      style={{ border: "1px solid #ccc" }}
                      radius="sm"
                      alt="Main image to divide into animation frames"
                      w={500}
                      h="auto"
                      src={imageUrl}
                      onLoad={(e) => {
                        openGridModal();
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
