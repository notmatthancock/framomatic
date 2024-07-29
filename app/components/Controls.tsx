import {
  Card,
  Checkbox,
  Group,
  LoadingOverlay,
  NumberInput,
  Select,
  Stack,
  Title,
} from "@mantine/core";
import { Dispatch, SetStateAction } from "react";
import { enumValues } from "@/app/utils";
import { Box, GridOptions, ScanOrder, SelectionMode } from "@/app/types";

export default function Controls({
  gridOptions,
  setGridOptions,
  loading,
}: {
  gridOptions: GridOptions;
  setGridOptions: Dispatch<SetStateAction<GridOptions>>;
  loading: boolean;
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
            setGridOptions({
              ...gridOptions,
              frameWidth: parseFloat(value as string),
            });
          }}
          stepHoldDelay={100}
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
            });
          }}
          stepHoldDelay={100}
          stepHoldInterval={1}
          w={100}
          fixedDecimalScale={true}
          decimalScale={2}
        />
      </Group>

      <Stack>
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
        <Select
          label="Scan Order"
          allowDeselect={false}
          data={enumValues(ScanOrder)}
          value={gridOptions.scanOrder}
          onChange={(value) =>
            setGridOptions({
              ...gridOptions,
              scanOrder: value as ScanOrder,
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
