import JSZip from "jszip";
import {
  ActionIcon,
  Anchor,
  Button,
  Group,
  NumberInput,
  Slider,
  Stack,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  Dispatch,
  RefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  IconDeviceFloppy,
  IconPlayerPause,
  IconPlayerPlay,
} from "@tabler/icons-react";

import type { Frame } from "@/app/types";

export default function FramePlayer({
  frames,
  imageData,
  activeSheet,
  setActiveSheet,
}: {
  frames: Frame[];
  imageData: RefObject<ImageData[]>;
  activeSheet: number;
  setActiveSheet: Dispatch<SetStateAction<number>>;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  // current frame being displayed in the frame player
  const [frameIndex, setFrameIndex] = useState(
    frames.findIndex((f) => f.sheet == activeSheet)
  );
  // frames per second for UI-facing animation
  const [fps, setFps] = useState<number | string>(5);
  // prefix of the individual frames
  const [downloadPrefix, setDownloadPrefix] = useState("frame");
  const [isZipping, setIsZipping] = useState(false);
  const animationId = useRef<number | null>(null);
  // download ref is a ref to a hyperlink element so we can
  // simulate clicking the button to trigger download of zipped frames
  const downloadRef = useRef<HTMLAnchorElement>(null);
  // canvas ref is the UI-facing canvas where animation frames are drawn
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // an offscreen canvas to hold and extract the image data for the active sheet
  const offscreenCanvas = useRef<OffscreenCanvas | null>(
    imageData.current
      ? new OffscreenCanvas(
          imageData.current[activeSheet].width,
          imageData.current[activeSheet].height
        )
      : null
  );

  if (offscreenCanvas.current) {
    const context = offscreenCanvas.current.getContext("2d")!;
    context.putImageData(imageData.current![activeSheet], 0, 0);
  }

  const drawCurrentFrame = useCallback(
    (index: number) => {
      if (!canvasRef.current || !offscreenCanvas.current) return;

      const drawCanvas = canvasRef.current;
      const drawContext = drawCanvas.getContext("2d");

      if (!drawContext) return;

      const frame = frames[index];
      const frameData = offscreenCanvas.current
        .getContext("2d")!
        .getImageData(frame.x, frame.y, frame.width, frame.height);
      drawContext.putImageData(frameData, 0, 0);
    },
    [canvasRef, frames]
  );

  const frameDelay = (1 / parseFloat(fps as string)) * 1000;
  const animate = () => {
    // drawCurrentFrame(frameIndex)
    setFrameIndex((i) => (i + 1) % frames.length);
    animationId.current = window.setTimeout(animate, frameDelay);
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    // Set width/height of frame player canvas
    canvasRef.current.width = frames[frameIndex].width;
    canvasRef.current.height = frames[frameIndex].height;
    setActiveSheet(frames[frameIndex].sheet);
    drawCurrentFrame(frameIndex);
  }, [drawCurrentFrame, frameIndex, frames, setActiveSheet]);

  const zipFrames = async () => {
    setIsZipping(true);
    const jsZip = new JSZip();
    const padLength = Math.ceil(Math.log10(frames.length)) + 1;

    // sheet canvas is the main source to pull image data for each frame
    let currentSheet = 0;
    let sheetCanvas = new OffscreenCanvas(
      imageData.current![0].width,
      imageData.current![0].height
    );
    sheetCanvas.getContext("2d")!.putImageData(imageData.current![0], 0, 0);
    const frameCanvas = new OffscreenCanvas(frames[0].width, frames[0].height);

    for (let index = 0; index < frames.length; index++) {
      let frame = frames[index];
      // switch out the sheet canvas if the sheet has changed
      if (frame.sheet != currentSheet) {
        currentSheet = frame.sheet;
        sheetCanvas = new OffscreenCanvas(
          imageData.current![currentSheet].width,
          imageData.current![currentSheet].height
        );
        sheetCanvas
          .getContext("2d")!
          .putImageData(imageData.current![currentSheet], 0, 0);
      }

      let frameData = sheetCanvas
        .getContext("2d")!
        .getImageData(frame.x, frame.y, frame.width, frame.height);
      frameCanvas.getContext("2d")!.putImageData(frameData, 0, 0);

      const paddedIndex = index.toString().padStart(padLength, "0");
      const filename = `${downloadPrefix}${paddedIndex}.png`;
      const dataBlob = frameCanvas.convertToBlob({ type: "image/png" });
      jsZip.file(filename, dataBlob);
    }

    const zipped = await jsZip.generateAsync({ type: "blob" });
    downloadRef.current!.download = "animation-frames.zip";
    downloadRef.current!.href = URL.createObjectURL(zipped);
    downloadRef.current!.click();
    setIsZipping(false);
  };

  useEffect(() => {
    if (!offscreenCanvas.current) {
      offscreenCanvas.current = new OffscreenCanvas(
        imageData.current![activeSheet].width,
        imageData.current![activeSheet].height
      );
      const context = offscreenCanvas.current.getContext("2d")!;
      context.putImageData(imageData.current![activeSheet], 0, 0);
    }
    if (frames[frameIndex].sheet == activeSheet) return;
    // This handles if the user flips ahead between sheets instead
    // of scrubbing between frames. If so, then we set the frameIndex
    // to the first for the selected (active) sheet.
    setFrameIndex(frames.findIndex((f) => f.sheet == activeSheet));
  }, [activeSheet]);

  return (
    <>
      {frames.length > 0 && (
        <Stack>
          <canvas
            style={{
              border: "1px solid #ccc",
              maxWidth: "300px",
            }}
            ref={canvasRef}
          />
          <Group>
            <ActionIcon
              onClick={() => {
                if (isPlaying) {
                  clearTimeout(animationId.current!);
                } else {
                  animationId.current = window.setTimeout(animate, frameDelay);
                }
                setIsPlaying(!isPlaying);
              }}
            >
              {isPlaying ? <IconPlayerPause /> : <IconPlayerPlay />}
            </ActionIcon>
            <Slider
              w="60%"
              label={(index) => `frame: ${index}`}
              min={0}
              max={frames.length - 1}
              step={1}
              value={frameIndex}
              onChange={setFrameIndex}
            />
            <Tooltip label="Frames per second">
              <NumberInput
                label="FPS"
                w={100}
                value={fps}
                onChange={(value) => setFps(parseFloat(value as string))}
              />
            </Tooltip>
          </Group>
          <Anchor ref={downloadRef} style={{ display: "none" }} />
          <Group align="flex-end">
            <Tooltip label="Animation frame filenames will have format 'prefixNNN.png' where NNN is a number">
              <TextInput
                label="Export prefix"
                value={downloadPrefix}
                onChange={(event) =>
                  setDownloadPrefix(event.currentTarget.value)
                }
              />
            </Tooltip>
            <Tooltip label="Download a zip file containing all animation frames as PNG images">
              <Button
                leftSection={<IconDeviceFloppy />}
                onClick={zipFrames}
                loading={isZipping}
              >
                Export Frames
              </Button>
            </Tooltip>
          </Group>
        </Stack>
      )}
    </>
  );
}
