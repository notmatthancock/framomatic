import {
  Card,
  Checkbox,
  ColorInput,
  Group,
  LoadingOverlay,
  NumberInput,
  Select,
  Stack,
  Switch,
  Title,
} from "@mantine/core";
import { Dispatch, SetStateAction } from "react";
import { enumValues, overlaps } from "@/app/utils";
import { Frame, GridOptions, SelectionMode } from "@/app/types";

const getLockAspectRatio = (gridOptions: GridOptions): boolean | number => {
  if (gridOptions.lockAspectRatio === false) {
    return false;
  } else {
    return gridOptions.frameWidth / gridOptions.frameHeight;
  }
};

const validateNewWidth = (frames: Frame[], newWidth: number): boolean => {
  // Brute force every pair of boxes and check for overlap
  for (var i = 0; i < frames.length; i++) {
    var f1 = { ...frames[i], width: newWidth };
    for (var j = i + 1; j < frames.length; j++) {
      var f2 = { ...frames[j], width: newWidth };
      if (overlaps(f1, f2)) {
        return false;
      }
    }
  }
  return true;
};

export default function GridOptionsComponent({
  gridOptions,
  setGridOptions,
  loading,
  frames,
}: {
  gridOptions: GridOptions;
  setGridOptions: Dispatch<SetStateAction<GridOptions>>;
  loading: boolean;
  frames: Frame[];
}) {
  return (
    <Card withBorder radius="sm">
      <LoadingOverlay visible={loading} />
      <Title order={4}>Controls</Title>

      {/* Grid props */}
      <Group>
        <NumberInput
          label="Rows"
          value={gridOptions.numRows}
          min={1}
          w={100}
          onChange={(nRows) =>
            setGridOptions({
              ...gridOptions,
              numRows: parseInt(nRows.toString()),
            })
          }
        />
        <NumberInput
          label="Columns"
          value={gridOptions.numCols}
          min={1}
          w={100}
          onChange={(nCols) =>
            setGridOptions({
              ...gridOptions,
              numCols: parseInt(nCols.toString()),
            })
          }
        />
      </Group>

      <Group>
        <NumberInput
          label="Width"
          value={gridOptions.frameWidth}
          min={1}
          onChange={(value) => {
            const newWidth = parseFloat(value as string);
            if (!validateNewWidth(frames, newWidth)) {
              return;
            }
            setGridOptions({
              ...gridOptions,
              frameWidth: newWidth,
              lockAspectRatio: getLockAspectRatio(gridOptions),
            });
          }}
          stepHoldDelay={200}
          stepHoldInterval={1}
          w={100}
          fixedDecimalScale={true}
          decimalScale={2}
        />

        <NumberInput
          label="Height"
          value={gridOptions.frameHeight}
          min={1}
          onChange={(value) => {
            setGridOptions({
              ...gridOptions,
              frameHeight: parseInt(value as string),
              lockAspectRatio: getLockAspectRatio(gridOptions),
            });
          }}
          stepHoldDelay={100}
          stepHoldInterval={1}
          w={100}
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
          label="Box Color"
          value={gridOptions.color}
          onChange={(value) => setGridOptions({ ...gridOptions, color: value })}
        />

        <Select
          label="Selection Mode"
          allowDeselect={false}
          data={enumValues(SelectionMode)}
          value={gridOptions.selectionMode}
          onChange={(value) =>
            setGridOptions({
              ...gridOptions,
              selectionMode: value as SelectionMode,
            })
          }
        />
      </Stack>

      <Group>
        <Checkbox
          mt="md"
          label="Lock boxes?"
          checked={gridOptions.locked}
          onChange={(event) =>
            setGridOptions({
              ...gridOptions,
              locked: event.currentTarget.checked,
            })
          }
        />
      </Group>
    </Card>
  );
}
