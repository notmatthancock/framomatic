import {
  Button,
  Card,
  Checkbox,
  ColorInput,
  Group,
  LoadingOverlay,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { Dispatch, SetStateAction, useState } from "react";

import {
  enumValues,
  framesInBounds,
  framesOverlap,
  getLockAspectRatio,
} from "@/app/utils";
import {
  Box,
  Frame,
  GridOptions,
  GridPosition,
  Size,
  WizardStep,
} from "@/app/types";

/** used to for sorting frames in raster scan order */
const gridCompareFn = (p1: GridPosition, p2: GridPosition): 0 | -1 | 1 => {
  if (p1.row == p2.row) {
    if (p1.col == p2.col) {
      return 0;
    }
    return p1.col < p2.col ? -1 : 1;
  }
  return p1.row < p2.row ? -1 : 1;
};

export default function GridOptionsComponent({
  gridOptions,
  setGridOptions,
  loading,
  frames,
  setFrames,
  imageSize,
  wizardStep,
  setWizardStep,
  setFrameSpacingBox,
}: {
  gridOptions: GridOptions;
  setGridOptions: Dispatch<SetStateAction<GridOptions>>;
  loading: boolean;
  frames: Frame[];
  setFrames: Dispatch<SetStateAction<Frame[]>>;
  imageSize: Size;
  wizardStep: WizardStep;
  setWizardStep: Dispatch<SetStateAction<WizardStep>>;
  setFrameSpacingBox: Dispatch<SetStateAction<Box | undefined>>;
}) {
  const [widthError, setWidthError] = useState<boolean | string>(false);
  const [heightError, setHeightError] = useState<boolean | string>(false);

  let title = "";
  if (wizardStep == "firstFrame") {
    title = "Select Top Left Frame";
  } else if (wizardStep == "frameSpacing") {
    title = "Select 2x2 Top Left Frames";
  }

  return (
    <Card withBorder radius="sm">
      <LoadingOverlay visible={loading} />
      <Title order={4}>{title}</Title>

      {/* Grid props */}
      <Group>
        <NumberInput
          label="Width"
          value={gridOptions.frameWidth}
          min={1}
          onChange={(value) => {
            const newWidth = parseFloat(value as string);

            // possibly update height if aspect ratio is locked
            const lockAspectRatio = getLockAspectRatio(gridOptions);
            const newHeight =
              lockAspectRatio !== false
                ? newWidth / (lockAspectRatio as number)
                : gridOptions.frameHeight;

            // compute new frames
            const newFrames: Frame[] = frames.map((f) => {
              return { ...f, data: null, width: newWidth, height: newHeight };
            });
            if (!framesInBounds(newFrames, imageSize)) {
              setWidthError("frames exceed image bounds");
              return;
            }
            setWidthError(false);

            // update grid options and frames
            setGridOptions({
              ...gridOptions,
              frameWidth: newWidth,
              frameHeight: newHeight,
              lockAspectRatio: lockAspectRatio,
            });
            setFrames(newFrames);
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
          value={gridOptions.frameHeight}
          min={1}
          onChange={(value) => {
            const newHeight = parseFloat(value as string);

            // possibly update height if aspect ratio is locked
            const lockAspectRatio = getLockAspectRatio(gridOptions);
            const newWidth =
              lockAspectRatio !== false
                ? newHeight * (lockAspectRatio as number)
                : gridOptions.frameWidth;

            // compute new frames
            const newFrames: Frame[] = frames.map((f) => {
              return { ...f, data: null, width: newWidth, height: newHeight };
            });
            if (!framesInBounds(newFrames, imageSize)) {
              setHeightError("frames exceed image bounds");
              return;
            }
            setHeightError(false);

            // update grid options and frames
            setGridOptions({
              ...gridOptions,
              frameWidth: newWidth,
              frameHeight: newHeight,
              lockAspectRatio: lockAspectRatio,
            });
            setFrames(newFrames);
          }}
          stepHoldDelay={100}
          stepHoldInterval={1}
          w={100}
          error={heightError}
          fixedDecimalScale={true}
          decimalScale={2}
        />
      </Group>

      {/* debug */}
      <Group>
        <NumberInput
          label="X"
          value={gridOptions.x}
          min={1}
          onChange={(value) => {
            const newX = parseFloat(value as string);

            // compute new frames
            if (wizardStep == "firstFrame") {
              const newFrames: Frame[] = [...frames];
              frames[0].x = newX
              setFrames(newFrames);
            } else {
              setFrameSpacingBox(b => {
                if (b === undefined) return b;
                return {
                  ...b,
                  width: newX - b.x,
                }
              })
            }

            // update grid options and frames
            setGridOptions({
              ...gridOptions,
              x: newX
            });
          }}
          stepHoldDelay={200}
          stepHoldInterval={1}
          w={100}
          error={widthError}
          fixedDecimalScale={true}
          decimalScale={2}
        />

        <NumberInput
          label="Y"
          value={gridOptions.y}
          min={1}
          onChange={(value) => {
            const newY = parseFloat(value as string);

            // compute new frames
            if (wizardStep == "firstFrame") {
              const newFrames: Frame[] = [...frames];
              frames[0].y = newY
              setFrames(newFrames);
            } else {
              setFrameSpacingBox(b => {
                if (b === undefined) return b;
                return {
                  ...b,
                  height: newY - b.y,
                }
              })
            }

            // update grid options and frames
            setGridOptions({
              ...gridOptions,
              y: newY
            });
          }}
          stepHoldDelay={100}
          stepHoldInterval={1}
          w={100}
          error={heightError}
          fixedDecimalScale={true}
          decimalScale={2}
        />
      </Group>

      <Stack mt="lg">
        <Switch
          label="Lock Aspect Ratio?"
          checked={gridOptions.lockAspectRatio !== false}
          onChange={(event) => {
            if (event.currentTarget.checked) {
              setGridOptions({
                ...gridOptions,
                lockAspectRatio:
                  gridOptions.frameWidth / gridOptions.frameHeight,
              });
            } else {
              setGridOptions({ ...gridOptions, lockAspectRatio: false });
            }
          }}
        />

        <ColorInput
          label="Frame Color"
          value={gridOptions.frameColor}
          onChange={(value) =>
            setGridOptions({ ...gridOptions, frameColor: value })
          }
        />

        <NumberInput
          label="Frame Thickness"
          value={gridOptions.frameThickness}
          min={1}
          max={5}
          onChange={(value) => {
            setGridOptions({
              ...gridOptions,
              frameThickness: parseInt(value as string),
            });
          }}
          stepHoldDelay={100}
          stepHoldInterval={1}
          w={200}
        />

        {wizardStep == "firstFrame" && (
          <Button
            onClick={() =>
              modals.openConfirmModal({
                title: "Confirm top left placement",
                children: (
                  <>
                    <Text>
                      The box should be placed over the top left frame.
                    </Text>
                    <Text>
                      For best results, ensure that the borders of the box have
                      a little padding beyond the frame.
                    </Text>
                  </>
                ),
                labels: { cancel: "Cancel", confirm: "Submit" },
                onConfirm: () => {
                  const firstFrame = frames[0];
                  setFrameSpacingBox({
                    x: firstFrame.x,
                    y: firstFrame.y,
                    width: 2 * firstFrame.width,
                    height: 2 * firstFrame.height,
                    row: 0,
                    col: 0,
                  });
                  setWizardStep("frameSpacing");
                },
              })
            }
          >
            Next
          </Button>
        )}
        {wizardStep == "frameSpacing" && (
          <Button
            onClick={() => {
              modals.openConfirmModal({
                title: "Confirm top left placement of 2x2 frames",
                children: (
                  <>
                    <Text>
                      The box should be placed over the top left 2x2 frames.
                    </Text>
                    <Text>
                      This step is used to provide an initial estimate of the
                      spacing between frames. The remaining frames are found
                      automatically.
                    </Text>
                  </>
                ),
                labels: { cancel: "Cancel", confirm: "Submit" },
                onConfirm: () => {
                  setWizardStep("compute")
                },
              });
            }}
          >
            Next
          </Button>
        )}
      </Stack>
    </Card>
  );
}
