import { Group, NumberInput, Stack, Switch } from "@mantine/core";
import { Dispatch, SetStateAction, useState } from "react";

import { frameInBounds } from "@/app/utils";
import { Frame, Size } from "@/app/types";

export default function FirstFrameProps({
  frame,
  setFrame,
  lockAspectRatio,
  setLockAspectRatio,
  imageSize,
}: {
  frame: Frame;
  setFrame: Dispatch<SetStateAction<Frame | null>>;
  lockAspectRatio: number | false;
  setLockAspectRatio: Dispatch<SetStateAction<number | false>>;
  imageSize: Size;
}) {
  const [xError, setXError] = useState<boolean | string>(false);
  const [yError, setYError] = useState<boolean | string>(false);
  const [widthError, setWidthError] = useState<boolean | string>(false);
  const [heightError, setHeightError] = useState<boolean | string>(false);

  return (
    <>
      <Group>
        <NumberInput
          label="X"
          value={frame.x}
          min={1}
          onChange={(value) => {
            const newX = parseFloat(value as string);
            const newFrame = { ...frame, x: newX };
            if (!frameInBounds(frame, imageSize)) {
              setXError("frame x position is out of image bounds");
            } else {
              setXError(false);
              setFrame(newFrame);
            }
          }}
          stepHoldDelay={200}
          stepHoldInterval={1}
          w={100}
          error={xError}
          fixedDecimalScale={true}
          decimalScale={2}
        />

        <NumberInput
          label="Y"
          value={frame.y}
          min={1}
          onChange={(value) => {
            const newY = parseFloat(value as string);
            const newFrame = { ...frame, y: newY };
            if (!frameInBounds(frame, imageSize)) {
              setXError("frame y position is out of image bounds");
            } else {
              setYError(false);
              setFrame(newFrame);
            }
          }}
          stepHoldDelay={100}
          stepHoldInterval={1}
          w={100}
          error={yError}
          fixedDecimalScale={true}
          decimalScale={2}
        />
      </Group>

      <Group>
        <NumberInput
          label="Width"
          value={frame.width}
          min={1}
          onChange={(value) => {
            const newWidth = parseFloat(value as string);
            const newHeight = lockAspectRatio
              ? newWidth / (lockAspectRatio as number)
              : frame.height;

            const newFrame: Frame = {
              ...frame,
              width: newWidth,
              height: newHeight,
            };
            if (!frameInBounds(newFrame, imageSize)) {
              setWidthError("frame exceeds image bounds");
            } else {
              setWidthError(false);
              setFrame(newFrame);
            }
          }}
          stepHoldDelay={200}
          stepHoldInterval={1}
          w={100}
          error={widthError}
          fixedDecimalScale={true}
          decimalScale={2}
        />

        <NumberInput
          label="Height"
          value={frame.height}
          min={1}
          onChange={(value) => {
            const newHeight = parseFloat(value as string);
            const newWidth = lockAspectRatio
              ? newHeight * (lockAspectRatio as number)
              : frame.width;

            const newFrame: Frame = {
              ...frame,
              width: newWidth,
              height: newHeight,
            };
            if (!frameInBounds(newFrame, imageSize)) {
              setHeightError("frame height exceed image bounds");
            } else {
              setHeightError(false);
              setFrame(newFrame);
            }
          }}
          stepHoldDelay={100}
          stepHoldInterval={1}
          w={100}
          error={heightError}
          fixedDecimalScale={true}
          decimalScale={2}
        />
      </Group>

      <Stack mt="sm" mb="md">
        <Switch
          label="Lock Aspect Ratio?"
          checked={lockAspectRatio !== false}
          onChange={(event) =>
            setLockAspectRatio(
              event.currentTarget.checked ? frame.width / frame.height : false
            )
          }
        />
      </Stack>
    </>
  );
}
