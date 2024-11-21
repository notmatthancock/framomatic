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

import type { Frame } from "@/app/types";

export default function FramePlayer({
  frames,
  imageCanvasRef,
  activeSheet,
  setActiveSheet
}: {
  frames: Frame[];
  imageCanvasRef: MutableRefObject<HTMLCanvasElement | null>;
  activeSheet: number;
  setActiveSheet: Dispatch<SetStateAction<number>>;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [fps, setFps] = useState<number | string>(5);
  const [downloadPrefix, setDownloadPrefix] = useState("frame");
  const animationId = useRef<number | null>(null);
  const downloadRef = useRef<HTMLAnchorElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const frameDelay = (1 / parseFloat(fps as string)) * 1000;

  useEffect(() => {
    if (frames.length == 0 || !canvasRef.current) return;
    const canvas = canvasRef.current!;
    canvas.width = frames[0].width;
    canvas.height = frames[0].height;
    drawCurrentFrame(frameIndex)
  }, [frames]);

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
      drawContext.putImageData(
        imageContext.getImageData(frame.x, frame.y, frame.width, frame.height),
        0,
        0
      );
    },
    [frames, imageCanvasRef]
  );

  const animate = () => {
    // drawCurrentFrame(frameIndex)
    setFrameIndex((i) => (i + 1) % frames.length);
    animationId.current = window.setTimeout(animate, frameDelay);
  };

  useEffect(() => {
    drawCurrentFrame(frameIndex);
  }, [activeSheet]);

  return (
    <>
      {frames.length > 0 && (
        <Stack>
          <canvas
            style={{
              border: "1px solid #ccc",
              maxWidth: "500px",
              maxHeight: "500px",
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
              onChange={index => {
                let prevIndex = index - 1
                if (prevIndex < 0) prevIndex = frames.length - 1
                setFrameIndex(index)
                if (frames[index].sheet == frames[prevIndex].sheet) {
                  drawCurrentFrame(index)
                } else {
                  setActiveSheet(frames[index].sheet)
                }
              } }
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
                  const canvas = canvasRef.current!;
                  const drawContext = canvas.getContext("2d");
                  const imageCanvas = imageCanvasRef.current!;
                  const imageContext = imageCanvas.getContext("2d");

                  if (drawContext === null || imageContext === null) return;

                  if (!drawContext) return;

                  const zip = new JSZip();

                  for (let i = 0; i < frames.length; i++) {
                    const filename = `${downloadPrefix}${i
                      .toString()
                      .padStart(4, "0")}.png`;

                    const frame = frames[i];

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
                    zip.file(filename, blob);
                  }

                  const zipFile = await zip.generateAsync({ type: "blob" });
                  downloadRef.current!.download = "animation-frames.zip";
                  downloadRef.current!.href = URL.createObjectURL(zipFile);
                  downloadRef.current!.click();
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
