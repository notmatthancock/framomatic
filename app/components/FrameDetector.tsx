import {
  Box as MantineBox,
  Button,
  Code,
  Flex,
  Group,
  Image,
  Text,
} from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Rnd } from "react-rnd";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import FramePlayer from "@/app/components/FramePlayer";
import { transformCoords } from "@/app/utils";
import type { Frame, Grid, Size, WizardStep, WorkerMessage } from "@/app/types";
import { modals } from "@mantine/modals";

export default function FrameDetector({
  wizardStep,
  setWizardStep,
  worker,
  imageUrls,
  gridDims,
  firstFrame,
  spacingFrame,
}: {
  wizardStep: WizardStep;
  setWizardStep: Dispatch<SetStateAction<WizardStep>>;
  worker: Worker;
  imageUrls: string[];
  gridDims: Grid;
  firstFrame: Frame;
  spacingFrame: Frame;
}) {
  const [activeSheet, setActiveSheet] = useState(0);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [computing, setComputing] = useState(true);
  const {
    ref: imageRef,
    width: imageElementWidth,
    height: imageElementHeight,
  } = useElementSize();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleNewFrame = useCallback(
    (frame?: Frame) => {
      if (!frame) throw new Error("frame missing from worker message");
      setFrames((prevFrames) => [...prevFrames, frame]);
    },
    [setFrames]
  );

  const handleSheetEnd = useCallback(() => {
    if (activeSheet == imageUrls.length - 1) {
      // totally done
      setActiveSheet(0);
      setWizardStep("free");
      setComputing(false);
    } else {
      // NOTE: this is a bit rube-goldberg-ish -- incrementing
      // the active sheet causes the image element to run onLoad
      // which causes `detectFrames` to run for the new sheet.
      setActiveSheet(activeSheet + 1);
    }
  }, [activeSheet, imageUrls, setActiveSheet, setComputing, setWizardStep]);

  const handleError = useCallback(
    (error?: string) => {
      setWizardStep("free");
      setComputing(false);
      modals.open({
        withCloseButton: false,
        title: "Frame Detection Error",
        children: (
          <>
            <Text>An unexpected error occurred when detecting frames</Text>
            {error && <Code block={true}>{error}</Code>}
            <Flex align="center" justify="flex-end" direction="row">
              <Button onClick={() => modals.closeAll()}>OK</Button>
            </Flex>
          </>
        ),
      });
    },
    [setComputing, setWizardStep]
  );

  const handleWorkerMessage = useCallback(
    (event: MessageEvent) => {
      const msg: WorkerMessage = event.data;

      switch (msg.type) {
        case "newFrame":
          handleNewFrame(msg.frame);
          break;
        case "sheetEnd":
          handleSheetEnd();
          break;
        case "error":
          handleError(msg.error);
          break;
      }
    },
    [handleNewFrame, handleSheetEnd, handleError]
  );

  useEffect(() => {
    worker.onmessage = handleWorkerMessage;
  }, [handleWorkerMessage, worker]);

  const detectFrames = (imageData: ImageData) => {
    worker.postMessage({
      sheet: activeSheet,
      imageData: imageData,
      firstFrame: { ...firstFrame, sheet: activeSheet },
      frameSpacingBox: spacingFrame,
      gridDimensions: gridDims,
    });
  };

  const imageNaturalSize = useMemo<Size | null>(() => {
    return imageRef.current
      ? {
          width: imageRef.current!.naturalWidth,
          height: imageRef.current!.naturalHeight,
        }
      : null;
  }, [imageRef, imageRef.current]);

  // Coordinate transform to "index space", the coordinate system
  // of the full-res image
  const toIndexSpace = (f: Frame): Frame => {
    if (imageNaturalSize === null)
      throw new Error(
        "Cannot transform coordinates to index space because iamge size is null"
      );
    const sourceSize = { width: imageElementWidth, height: imageElementHeight };
    return transformCoords(f, sourceSize, imageNaturalSize);
  };

  // coordinate transform to "element space", the coordinate
  // system of the (probably smaller) html image element
  const toElementSpace = (f: Frame): Frame => {
    if (imageNaturalSize === null)
      throw new Error(
        "Cannot transform coordinates to element space because image size is null"
      );
    const targetSize = { width: imageElementWidth, height: imageElementHeight };
    return transformCoords(f, imageNaturalSize, targetSize);
  };

  return (
    <Group>
      <TransformWrapper
        panning={{ disabled: true }}
        onZoomStop={(ref, event) => {
          // TODO
          console.log(ref.state);
        }}
      >
        <TransformComponent>
          <MantineBox
            w="fit-content"
            m="auto"
            pos="relative"
            mah="calc(100% - 80px - (1rem * 2))"
          >
            {frames
              .filter((f) => f.sheet == activeSheet)
              .map((frame, i) => {
                const elementFrame = toElementSpace(frame);
                return (
                  <Rnd
                    key={i}
                    bounds="parent"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "solid 1px red",
                    }}
                    size={{
                      width: elementFrame.width,
                      height: elementFrame.height,
                    }}
                    position={{ x: elementFrame.x, y: elementFrame.y }}
                    disableDragging={frame.locked}
                  />
                );
              })}
            <Image
              ref={imageRef}
              src={imageUrls[activeSheet]}
              alt="Contact sheet with detected frames"
              w={500}
              onLoad={(e) => {
                if (!canvasRef.current)
                  throw new Error(
                    "cannot extract image data with undefined canvas ref"
                  );

                const img: HTMLImageElement = e.currentTarget;
                const h = img.naturalHeight;
                const w = img.naturalWidth;
                const canvas = canvasRef.current;
                canvas.width = w;
                canvas.height = h;
                const context = canvas.getContext("2d")!;
                context.drawImage(img, 0, 0);
                if (wizardStep == "compute") {
                  const imageData = context.getImageData(0, 0, w, h);
                  detectFrames(imageData);
                }
              }}
            />
          </MantineBox>
        </TransformComponent>
      </TransformWrapper>
      {wizardStep == "free" && (
        <FramePlayer
          frames={frames}
          imageCanvasRef={canvasRef}
          activeSheet={activeSheet}
          setActiveSheet={setActiveSheet}
        />
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </Group>
  );
}
