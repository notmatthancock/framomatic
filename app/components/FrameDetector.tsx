import {
  Box as MantineBox,
  Button,
  Card,
  Code,
  Flex,
  Group,
  Image,
  Stack,
  Text,
  Progress,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { DraggableData, Rnd } from "react-rnd";

import FramePlayer from "@/app/components/FramePlayer";
import SheetNavigation from "@/app/components/SheetNavigation";
import WizardNavigation from "@/app/components/WizardNavigation";
import { transformCoords } from "@/app/utils";
import type { Frame, Grid, Size, WizardStep, WorkerMessage } from "@/app/types";

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

  const imagesLoadedCounter = useRef(0);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const imageData = useRef<ImageData[]>([]);
  const [activeImageSize, setActiveImageSize] = useState<Size>();

  const detectFrames = useCallback(
    (sheet: number) => {
      worker.postMessage({
        imageData: imageData.current[sheet],
        firstFrame: { ...firstFrame, sheet: sheet },
        frameSpacingBox: spacingFrame,
        gridDimensions: gridDims,
      });
    },
    [firstFrame, gridDims, spacingFrame, worker]
  );

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
      setComputing(false);
    } else {
      const nextSheet = activeSheet + 1;
      setActiveSheet(nextSheet);
      detectFrames(nextSheet);
    }
  }, [activeSheet, detectFrames, imageUrls, setActiveSheet, setComputing]);

  const handleError = useCallback(
    (error?: string) => {
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
    [setComputing]
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

  useLayoutEffect(() => {
    const ref = imageRefs.current[activeSheet];
    if (ref) {
      setActiveImageSize({
        width: ref.getBoundingClientRect().width,
        height: ref.getBoundingClientRect().height,
      });
    }
  }, [activeSheet]);

  // coordinate transform to "element space", the coordinate
  // system of the (probably smaller) html image element
  const toElementSpace = (f: Frame): Frame => {
    if (!activeImageSize)
      throw new Error(
        "Cannot transform coordinates to element space because active image size is null"
      );
    const sourceSize = {
      width: imageData.current[activeSheet].width,
      height: imageData.current[activeSheet].height,
    };
    return transformCoords(f, sourceSize, activeImageSize);
  };

  // Coordinate transform to "index space", the coordinate system
  // of the full-res image
  const toIndexSpace = (f: Frame): Frame => {
    if (!activeImageSize)
      throw new Error(
        "Cannot transform coordinates to element space because active image size is null"
      );
    const targetSize = {
      width: imageData.current[activeSheet].width,
      height: imageData.current[activeSheet].height,
    };
    return transformCoords(f, activeImageSize, targetSize);
  };

  // Construct a lookup from frame row/col/sheet to index in
  // the frames list. Since the frames are filtered based on
  // active sheet, we can't do it in the frames loop, and since
  // The lookup is needed on every drag event, we use a map
  // for the lookup for speed.
  const frameLookupKey = (f: Frame): string => {
    return `row: ${f.row} col: ${f.col} sheet: ${f.sheet}`;
  };
  const frameIndexLookup = new Map();
  frames.forEach((frame, index) => {
    frameIndexLookup.set(frameLookupKey(frame), index);
  });

  return (
    <Group align="start">
      <WizardNavigation
        wizardStep={wizardStep}
        onPrev={() => {
          setFrames([]);
          setWizardStep("frameSpacing");
        }}
      >
        <Stack>
          {computing && (
            <Progress
              value={
                (frames.length /
                  (gridDims.nRows * gridDims.nCols * imageUrls.length)) *
                100
              }
              striped
              animated
            />
          )}
          <SheetNavigation
            activeSheet={activeSheet}
            setActiveSheet={setActiveSheet}
            numSheets={imageUrls.length}
          />
        </Stack>
      </WizardNavigation>
      <Card withBorder>
        <MantineBox
          w="fit-content"
          m="auto"
          pos="relative"
          mah="calc(100% - 80px - (1rem * 2))"
        >
          {imageUrls.map((url, index) => (
            <Image
              w={500}
              key={index}
              src={url}
              // ref={(el) => {
              //   imageRefs.current[index] = el;
              // }}
              alt={`Contact Sheet ${index}`}
              style={{
                display: index == activeSheet ? "block" : "none",
              }}
              onLoad={async (event) => {
                const imageElement = event.currentTarget;
                imageRefs.current[index] = imageElement;
                const bitmap = await createImageBitmap(imageElement);
                const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
                const context = canvas.getContext("2d")!;
                context.drawImage(bitmap, 0, 0);
                imageData.current[index] = context.getImageData(
                  0,
                  0,
                  bitmap.width,
                  bitmap.height
                );
                imagesLoadedCounter.current++;
                if (index == activeSheet) {
                  const rect = imageElement.getBoundingClientRect();
                  setActiveImageSize({
                    width: rect.width,
                    height: rect.height,
                  });
                }
                if (imagesLoadedCounter.current == imageUrls.length) {
                  detectFrames(0);
                }
              }}
            />
          ))}
          {frames
            .filter((f) => f.sheet == activeSheet)
            .map((frame, i) => {
              const elementFrame = toElementSpace(frame);
              return (
                <Rnd
                  enableResizing={false}
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
                  onDrag={(e, dragData: DraggableData) => {
                    if (!activeImageSize) return;
                    // we need to remap the coordinate of the drag from
                    // element space to index space.
                    const newXY = toIndexSpace({
                      ...frame,
                      x: dragData.x,
                      y: dragData.y,
                    });
                    const newFrame = { ...frame, x: newXY.x, y: newXY.y };
                    setFrames((oldFrames) => {
                      let newFrames = [...oldFrames];
                      const index = frameIndexLookup.get(frameLookupKey(newFrame))
                      if (index === undefined) {
                        throw new Error(`Could not find frame index for frame ${newFrame}`)
                      }
                      newFrames[index] = newFrame;
                      return newFrames;
                    });
                  }}
                />
              );
            })}
        </MantineBox>
      </Card>
      {!computing && (
        <FramePlayer
          frames={frames}
          imageData={imageData}
          activeSheet={activeSheet}
          setActiveSheet={setActiveSheet}
        />
      )}
    </Group>
  );
}
