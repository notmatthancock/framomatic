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
  MutableRefObject,
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

import SheetNavigation from "@/app/components/SheetNavigation";
import type { Frame } from "@/app/types";

export default function FramePlayer({
  frames,
  imageCanvasRef,
  activeSheet,
  setActiveSheet,
}: {
  frames: Frame[];
  imageCanvasRef: MutableRefObject<HTMLCanvasElement | null>;
  activeSheet: number;
  setActiveSheet: Dispatch<SetStateAction<number>>;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frameIndex, setFrameIndex] = useState(
    frames.findIndex((f) => f.sheet == activeSheet)
  );
  const [fps, setFps] = useState<number | string>(5);
  const [downloadPrefix, setDownloadPrefix] = useState("frame");
  const [isZipping, setIsZipping] = useState(false);
  const zipFile = useRef<JSZip>();
  const animationId = useRef<number | null>(null);
  const downloadRef = useRef<HTMLAnchorElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const numSheets = new Set(frames.map((f) => f.sheet)).size;

  const drawCurrentFrame = useCallback(
    (index: number) => {
      if (
        canvasRef.current === null ||
        imageCanvasRef === null ||
        imageCanvasRef.current == null
      ) {
        return;
      }

      const drawCanvas = canvasRef.current;
      const drawContext = drawCanvas.getContext("2d");
      const imageCanvas = imageCanvasRef.current;
      const imageContext = imageCanvas.getContext("2d");

      if (drawContext === null || imageContext === null) return;

      const frame = frames[index];
      const imageData = imageContext.getImageData(
        frame.x,
        frame.y,
        frame.width,
        frame.height
      );
      drawContext.putImageData(imageData, 0, 0);
    },
    [canvasRef, frames, imageCanvasRef]
  );

  const frameDelay = (1 / parseFloat(fps as string)) * 1000;
  const animate = () => {
    // drawCurrentFrame(frameIndex)
    setFrameIndex((i) => (i + 1) % frames.length);
    animationId.current = window.setTimeout(animate, frameDelay);
  };

  useEffect(() => {
    // Set width/height of frame player canvas
    canvasRef.current!.width = frames[frameIndex].width;
    canvasRef.current!.height = frames[frameIndex].height;
    setActiveSheet(frames[frameIndex].sheet);
    drawCurrentFrame(frameIndex);
  }, [drawCurrentFrame, frameIndex, frames, setActiveSheet]);

  const zipFramesForActiveSheet = async () => {
    if (!zipFile.current) throw new Error("error occurred zipping frames");

    const canvas = canvasRef.current!;
    const drawContext = canvas.getContext("2d");
    const imageCanvas = imageCanvasRef.current!;
    const imageContext = imageCanvas.getContext("2d");

    if (!drawContext || !imageContext)
      throw new Error("error occurred zipping frames");

    frames
      .filter((f) => f.sheet == activeSheet)
      .map(async (frame, i) => {
        const filename = `${downloadPrefix}${i
          .toString()
          .padStart(4, "0")}.png`;

        // Draw current frame to canvas, convert to blob
        drawContext.putImageData(
          imageContext.getImageData(
            frame.x,
            frame.y,
            frame.width,
            frame.height
          ),
          0,
          0
        );
        const dataURL = canvasRef.current!.toDataURL("image/png");
        const blob = await (await fetch(dataURL)).blob();

        // Add the current canvas image data to the zip file
        zipFile.current!.file(filename, blob);
      });

    if (activeSheet == numSheets - 1) {
      // finalize the zip file and download it
      const zipped = await zipFile.current!.generateAsync({ type: "blob" });
      downloadRef.current!.download = "animation-frames.zip";
      downloadRef.current!.href = URL.createObjectURL(zipped);
      downloadRef.current!.click();
      zipFile.current = undefined
      setIsZipping(false)
      setActiveSheet(0)
    } else {
      // zip the next sheet
      setActiveSheet(activeSheet + 1);
    }
  };

  useEffect(() => {
    if (!isZipping) {
      if (frames[frameIndex].sheet == activeSheet) return;
      // This handles if the user flips ahead between sheets instead
      // of scrubbing between frames. If so, then we set the frameIndex
      // to the first for the selected (active) sheet.
      setFrameIndex(frames.findIndex((f) => f.sheet == activeSheet));
    } else {
      zipFramesForActiveSheet();
    }
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
          <SheetNavigation
            activeSheet={activeSheet}
            setActiveSheet={setActiveSheet}
            numSheets={numSheets}
          />
          <Anchor ref={downloadRef} style={{ display: "none" }} />
          <Group align="flex-end">
            <Tooltip label="Animation frame filenames will have format 'prefixNNNN.png' where NNNN is a number">
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
                onClick={async () => {
                  zipFile.current = new JSZip();
                  setIsZipping(true);
                  setActiveSheet(0);
                }}
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
