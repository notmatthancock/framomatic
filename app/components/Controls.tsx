import {
  Card,
  Checkbox,
  ColorInput,
  Group,
  LoadingOverlay,
  NumberInput,
  Title,
} from "@mantine/core";
import { Dispatch, SetStateAction } from "react";
import type { Box, GridParams } from "@/app/types";

export default function Controls({
  autoBoxColor,
  autoBoxesLocked,
  gridParams,
  setGridParams,
  setAutoBoxColor,
  setAutoBoxesLocked,
  setUserBox,
  setUserBoxColor,
  userBox,
  userBoxColor,
  loading,
}: {
  autoBoxColor: string;
  autoBoxesLocked: boolean;
  gridParams: GridParams;
  setGridParams: Dispatch<SetStateAction<GridParams>>;
  setAutoBoxColor: Dispatch<SetStateAction<string>>;
  setAutoBoxesLocked: Dispatch<SetStateAction<boolean>>;
  setUserBox: Dispatch<SetStateAction<Box>>;
  setUserBoxColor: Dispatch<SetStateAction<string>>;
  userBox: Box;
  userBoxColor: string;
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
          value={gridParams.numRows}
          min={1}
          w={100}
          onChange={(nRows) =>
            setGridParams({
              ...gridParams,
              numRows: parseInt(nRows.toString()),
            })
          }
        />
        <NumberInput
          label="Columns"
          value={gridParams.numCols}
          min={1}
          w={100}
          onChange={(nCols) =>
            setGridParams({
              ...gridParams,
              numCols: parseInt(nCols.toString()),
            })
          }
        />
      </Group>
      <Group>
        <NumberInput
          label="Spacing X"
          value={gridParams.xSpacing}
          min={0}
          w={100}
          fixedDecimalScale={true}
          decimalScale={2}
          onChange={(dx) =>
            setGridParams({
              ...gridParams,
              xSpacing: parseFloat(dx as string),
            })
          }
        />
        <NumberInput
          label="Spacing Y"
          value={gridParams.ySpacing}
          min={0}
          w={100}
          fixedDecimalScale={true}
          decimalScale={2}
          onChange={(dy) =>
            setGridParams({
              ...gridParams,
              ySpacing: parseFloat(dy as string),
            })
          }
        />
      </Group>

      {/* userBox props */}
      <Group>
        <NumberInput
          label="X"
          value={userBox.x}
          min={1}
          onChange={(value) => {
            setUserBox({
              ...userBox,
              x: parseFloat(value as string),
            });
          }}
          stepHoldDelay={100}
          stepHoldInterval={1}
          w={100}
          fixedDecimalScale={true}
          decimalScale={2}
        />

        <NumberInput
          label="Y"
          value={userBox.y}
          min={1}
          onChange={(value) => {
            setUserBox({
              ...userBox,
              y: parseFloat(value as string),
            });
          }}
          stepHoldDelay={100}
          stepHoldInterval={1}
          w={100}
          fixedDecimalScale={true}
          decimalScale={2}
        />
      </Group>

      <Group>
        <NumberInput
          label="Width"
          value={userBox.width}
          min={1}
          onChange={(value) => {
            setUserBox({
              ...userBox,
              width: parseFloat(value as string),
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
          value={userBox.height}
          min={1}
          onChange={(value) => {
            setUserBox({
              ...userBox,
              height: parseInt(value as string),
            });
          }}
          stepHoldDelay={100}
          stepHoldInterval={1}
          w={100}
          fixedDecimalScale={true}
          decimalScale={2}
        />
      </Group>

      <Group>
        <Checkbox
          mt="md"
          label="Lock auto boxes?"
          checked={autoBoxesLocked}
          onChange={(event) => setAutoBoxesLocked(event.currentTarget.checked)}
        />
      </Group>

      <Group my="md">
        <ColorInput
          label="User box color"
          value={userBoxColor}
          onChange={setUserBoxColor}
        />
      </Group>
      <Group>
        <ColorInput
          label="Auto box color"
          value={autoBoxColor}
          onChange={setAutoBoxColor}
        />
      </Group>
    </Card>
  );
}
