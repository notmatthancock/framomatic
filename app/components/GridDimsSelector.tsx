import { Dispatch, SetStateAction, useState } from "react";
import {
  Button,
  Card,
  Flex,
  Group,
  Image,
  NumberInput,
  Stack,
} from "@mantine/core";
import { modals } from "@mantine/modals";

import SheetNavigation from "@/app/components/SheetNavigation"
import { Grid, WizardStep } from "@/app/types";

function GridDimsSelectorInputs({
  gridDims,
  setGridDims,
}: {
  gridDims: Grid;
  setGridDims: Dispatch<SetStateAction<Grid>>;
}) {
  return (
    <>
      <Group>
        <NumberInput
          label="Num. Rows"
          value={gridDims.nRows}
          onChange={(value) => {
            setGridDims({
              ...gridDims,
              nRows: parseInt(value as string),
            });
          }}
          min={1}
          error={
            gridDims.nRows < 1 ? "Num. Rows must be greater than 0" : false
          }
          placeholder="Enter the number of rows in the frame grid"
          w={100}
        />
        <NumberInput
          label="Num. Cols"
          value={gridDims.nCols}
          onChange={(value) => {
            setGridDims({
              ...gridDims,
              nCols: parseInt(value as string),
            });
          }}
          min={1}
          error={
            gridDims.nCols < 1 ? "Num. Cols must be greater than 0" : false
          }
          placeholder="Enter the number of rows in the frame grid"
          w={100}
        />
      </Group>
    </>
  );
}

export default function GridDimsSelector({
  imageUrls,
  gridDims,
  setGridDims,
  setWizardStep,
  setImageUrls,
}: {
  imageUrls: string[];
  gridDims: Grid;
  setGridDims: Dispatch<SetStateAction<Grid>>;
  setWizardStep: Dispatch<SetStateAction<WizardStep>>;
  setImageUrls: Dispatch<SetStateAction<string[]>>;
}) {
  const [activeSheet, setActiveSheet] = useState(0);

  return (
    <Group align="start">
      <Card withBorder mr="md">
        <Stack>
          <SheetNavigation
            activeSheet={activeSheet}
            setActiveSheet={setActiveSheet}
            numSheets={imageUrls.length}
          />
          <GridDimsSelectorInputs
            gridDims={gridDims}
            setGridDims={setGridDims}
          />

          <Flex direction="row" justify="space-between" align="center">
            <Button onClick={() => {
              setImageUrls([])
              setWizardStep("sheetsUpload")
            }}>Prev</Button>
            <Button
              disabled={gridDims.nRows == 0 || gridDims.nCols == 0}
              onClick={() => {
                modals.openConfirmModal({
                  title: "Confirm Grid Dimensions",
                  children: (
                    <>
                      You selected {gridDims.nRows} rows x {gridDims.nCols}{" "}
                      columns. Confirm to continue.
                    </>
                  ),
                  labels: { confirm: "Confirm", cancel: "Cancel" },
                  onConfirm: () => {
                    setWizardStep("firstFrame");
                  },
                });
              }}
            >
              Next
            </Button>
          </Flex>
        </Stack>
      </Card>
      {imageUrls.map((url, index) => {
        return (
          index == activeSheet && (
            <Image src={url} key={url} alt={`Sheet ${index + 1}`} w={500} />
          )
        );
      })}
    </Group>
  );
}
