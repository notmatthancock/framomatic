import {
  Box as MantineBox,
  Button,
  Card,
  Center,
  Flex,
  Group,
  Image,
  Text,
  Stack,
  Title,
} from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DraggableData, Rnd } from "react-rnd";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import type {
  Frame,
  SimpleModalInfo,
  Size,
  WizardStep,
} from "@/app/types";
import FirstFrameProps from "@/app/components/FrameProps";
import HelpButton from "@/app/components/HelpButton";
import { frameInBounds, toTitle, transformCoords } from "@/app/utils";

function openSimpleModal(modalInfo: SimpleModalInfo) {
  modals.open({
    withCloseButton: false,
    title: modalInfo.title,
    children: (
      <>
        {modalInfo.imageUrl !== null && (
          <Center>
            <Image
              src={modalInfo.imageUrl}
              alt={modalInfo.title}
              w={200}
              m="md"
            />
          </Center>
        )}
        <Text>{modalInfo.description}</Text>
        <Flex align="center" justify="flex-end" direction="row">
          <Button onClick={() => modals.closeAll()}>OK</Button>
        </Flex>
      </>
    ),
  });
}

export default function FrameSelector({
  wizardStep,
  imageUrl,
  frame,
  setFrame,
  onPrev,
  onNext,
  frameInitializer,
  modalInfo,
}: {
  wizardStep: WizardStep;
  imageUrl: string;
  frame: Frame | null;
  setFrame: Dispatch<SetStateAction<Frame | null>>;
  onPrev: () => void;
  onNext: () => void;
  frameInitializer: (imageSize: Size) => Frame;
  modalInfo: SimpleModalInfo;
}) {
  const [lockAspectRatio, setLockAspectRatio] = useState<number | false>(false);
  const framePreviewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageDataCanvasRef = useRef<HTMLCanvasElement>(null);
  const {
    ref: imageRef,
    width: imageElementWidth,
    height: imageElementHeight,
  } = useElementSize();

  const imageNaturalSize = useMemo<Size | null>(() => {
    return imageRef.current
      ? {
          width: imageRef.current!.naturalWidth,
          height: imageRef.current!.naturalHeight,
        }
      : null;
  }, [imageRef, imageRef.current]);

  if (frame === null) {
    openSimpleModal(modalInfo);
  }

  const drawCurrentFrame = useCallback(() => {
    if (!frame) return;
    if (!framePreviewCanvasRef?.current || !imageDataCanvasRef?.current) return;

    const drawCanvas = framePreviewCanvasRef.current;
    const drawContext = drawCanvas.getContext("2d");
    const imageCanvas = imageDataCanvasRef.current;
    const imageContext = imageCanvas.getContext("2d");

    if (!(drawContext && imageContext)) return;

    drawContext.putImageData(
      imageContext.getImageData(frame.x, frame.y, frame.width, frame.height),
      0,
      0
    );
  }, [frame, framePreviewCanvasRef, imageDataCanvasRef]);

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

  // elementBox is the current frame in the
  // coordinate space of the html image element
  const elementBox = frame && imageNaturalSize ? toElementSpace(frame) : null;

  // Handle moving x position with keyboard arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(frame && imageNaturalSize)) return;
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          setFrame({ ...frame, y: Math.max(0, frame.y - 1) });
          break;
        case "ArrowDown":
          e.preventDefault();
          setFrame({
            ...frame,
            y: Math.min(imageNaturalSize.height - frame.height, frame.y + 1),
          });
          break;
        case "ArrowRight":
          e.preventDefault();
          setFrame({
            ...frame,
            x: Math.min(imageNaturalSize.width - frame.width, frame.x + 1),
          });
          break;
        case "ArrowLeft":
          e.preventDefault;
          setFrame({ ...frame, x: Math.max(0, frame.x - 1) });
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [frame, imageNaturalSize, setFrame]);

  useEffect(() => {
    if (!(framePreviewCanvasRef.current && frame)) return;
    framePreviewCanvasRef.current!.width = frame.width;
    framePreviewCanvasRef.current!.height = frame.height;
    drawCurrentFrame();
  }, [drawCurrentFrame, frame]);

  return (
    <Group align="start">
      <Card withBorder mr="md">
        <Group align="center" justify="space-between" mb="sm">
          <Title order={4}>{toTitle(wizardStep)}</Title>
          <HelpButton
            openModal={() => {
              openSimpleModal(modalInfo);
            }}
          />
        </Group>
        <Stack>
          {frame && imageNaturalSize && (
            <FirstFrameProps
              frame={frame}
              setFrame={setFrame}
              lockAspectRatio={lockAspectRatio}
              setLockAspectRatio={setLockAspectRatio}
              imageSize={imageNaturalSize}
            />
          )}
          <Flex direction="row" justify="space-between" align="center">
            <Button onClick={onPrev}>Prev</Button>
            <Button onClick={onNext}>Next</Button>
          </Flex>
        </Stack>
      </Card>

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
            {elementBox != null && (
              <Rnd
                bounds="parent"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "solid 1px red",
                  borderStyle: "solid",
                }}
                lockAspectRatio={lockAspectRatio}
                size={{ width: elementBox.width, height: elementBox.height }}
                position={{ x: elementBox.x!, y: elementBox.y! }}
                onDrag={(e, dragData: DraggableData) => {
                  if (!(frame && imageNaturalSize)) return;
                  // we need to remap the coordinate of the drag from
                  // element space to index space.
                  const newXY = toIndexSpace({
                    ...frame,
                    x: dragData.x,
                    y: dragData.y,
                  });
                  const newFrame = { ...frame, x: newXY.x, y: newXY.y };
                  if (!frameInBounds(newFrame, imageNaturalSize)) return;
                  setFrame(newFrame);
                }}
                onResizeStop={(e, dir, ref, delta, pos) => {
                  if (!(frame && imageNaturalSize)) return;
                  const newFrame = toIndexSpace({
                    ...frame,
                    x: pos.x,
                    y: pos.y,
                    width: parseInt(ref.style.width),
                    height: parseInt(ref.style.height),
                  });
                  if (!frameInBounds(newFrame, imageNaturalSize)) return;
                  setFrame(newFrame);
                }}
              ></Rnd>
            )}
            <Image
              radius="sm"
              alt="Main image to divide into animation frames"
              w={500}
              h="auto"
              src={imageUrl}
              ref={imageRef}
              onLoad={(e) => {
                const img: HTMLImageElement = e.currentTarget;
                // Draw image to invisible canvas to extract to image data
                const h = img.naturalHeight;
                const w = img.naturalWidth;
                const canvas = imageDataCanvasRef.current!;
                canvas.width = w;
                canvas.height = h;
                const context = canvas.getContext("2d")!;
                context.drawImage(img, 0, 0);
                // Initialize the frame if not null. The frame is not null
                // if the user is navigating background after having already
                // chosen a frame.
                if (!frame) setFrame(frameInitializer({ width: w, height: h }));
              }}
            />
          </MantineBox>
        </TransformComponent>
      </TransformWrapper>
      <canvas
        ref={framePreviewCanvasRef}
        style={{
          border: "1px solid red",
          width: "300px",
        }}
      />
      <canvas ref={imageDataCanvasRef} style={{ display: "none" }} />
    </Group>
  );
}
