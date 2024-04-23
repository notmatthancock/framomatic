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
import { useCallback, useEffect, useRef, useState } from "react";
import {
  IconDeviceFloppy,
  IconPlayerPause,
  IconPlayerPlay,
} from "@tabler/icons-react";

import type { Frame } from "@/app/types";

export default function FramePlayer({ frames }: { frames: Frame[] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [fps, setFps] = useState<number | string>(5);
  const [downloadPrefix, setDownloadPrefix] = useState("frame");
  const animationId = useRef<number | null>(null);
  const downloadRef = useRef<HTMLAnchorElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const frameDelay = (1 / parseFloat(fps as string)) * 1000;

  useEffect(() => {
    if (frames.length == 0 || !frames[0].data || !canvasRef.current) return;
    const canvas = canvasRef.current!;
    canvas.width = frames[0].data.width;
    canvas.height = frames[0].data.height;
    const context = canvas.getContext("2d");
    const frame = frames[0];
    if (context && frame.data) context.putImageData(frame.data, 0, 0);
  }, [frames]);

  const drawCurrentFrame = useCallback(
    (index: number) => {
      const canvas = canvasRef.current!;
      const context = canvas.getContext("2d");
      const frame = frames[index];
      if (context && frame.data) {
        context.putImageData(frame.data, 0, 0);
      }
    },
    [frames]
  );

  const animate = () => {
    console.log("hi");
    // drawCurrentFrame(frameIndex)
    setFrameIndex((i) => (i + 1) % frames.length);
    console.log(frameIndex);
    animationId.current = window.setTimeout(animate, frameDelay);
  };
  useEffect(() => {
    drawCurrentFrame(frameIndex);
  }, [frameIndex]);

  return (
    <>
      {frames.length > 0 && (
        <Stack>
          <canvas
            style={{ border: "1px solid #ccc", width: "500px" }}
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
                  const context = canvas.getContext("2d");
                  if (!context) return;

                  const zip = new JSZip();

                  for (let i = 0; i < frames.length; i++) {
                    const filename = `${downloadPrefix}${i
                      .toString()
                      .padStart(4, "0")}.png`;

                    const frame = frames[i];
                    if (!frame.data) {
                      // TODO use mantine modal
                      alert("TODO");
                      return;
                    }

                    // Draw current frame to canvas, convert to blob
                    context.putImageData(frame.data, 0, 0);
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
