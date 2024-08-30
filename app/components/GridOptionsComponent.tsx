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
import { Dispatch, SetStateAction, useState } from "react";

import {
  enumValues,
  framesInBounds,
  framesOverlap,
  getLockAspectRatio,
} from "@/app/utils";
import {
  Frame,
  GridOptions,
  GridPosition,
  SelectionMode,
  Size,
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

const extendRows = (
  frames: Frame[],
  prevNumRows: number,
  currNumRows: number
): Frame[] => {
  const numNewRows = currNumRows - prevNumRows;
  var newFrames: Frame[] = frames.map((f) => {
    return { ...f, data: null };
  });

  // If the previous number of rows was singular, then we don't
  // use the vertical spacing between frames to guess the offset
  // for the next row. We just use a tenth of the frame height.
  if (prevNumRows == 1) {
    const offset = Math.max(1, Math.floor(frames[0].height * 0.1));
    for (var newRowCount = 1; newRowCount <= numNewRows; newRowCount++) {
      newFrames = [
        ...newFrames,
        ...frames.map((f) => {
          return {
            ...f,
            data: null,
            row: f.row + newRowCount,
            y: f.y + (offset + f.height) * newRowCount,
          };
        }),
      ];
    }
  } else {
    // The strategy below is to iteratively take the last and second to
    // last rows and compute the vertical spacing between each frame.
    // This offset is potentially distinct for each column and is
    // used to place each item in the new row.
    var secondToLastRow: Frame[] = frames
      .filter(
        (f) => f.row == prevNumRows - 2 // minus 2 because Frame.row starts at 0
      )
      .sort((a, b) => a.col - b.col);
    var lastRow: Frame[] = frames
      .filter((f) => f.row == prevNumRows - 1)
      .sort((a, b) => a.col - b.col);
    for (var newRowCount = 1; newRowCount <= numNewRows; newRowCount++) {
      var newRow: Frame[] = [];
      for (var i = 0; i < lastRow.length; i++) {
        var offset =
          lastRow[i].y - (secondToLastRow[i].y + secondToLastRow[i].height);
        newRow.push({
          ...lastRow[i],
          row: prevNumRows - 1 + newRowCount,
          y: lastRow[i].y + lastRow[i].height + offset,
        });
      }
      secondToLastRow = lastRow;
      lastRow = newRow;
      newFrames = newFrames.concat(newRow);
    }
  }

  return newFrames;
};

const extendCols = (
  frames: Frame[],
  prevNumCols: number,
  currNumCols: number
): Frame[] => {
  const numNewCols = currNumCols - prevNumCols;
  var newFrames: Frame[] = frames.map((f) => {
    return { ...f, data: null };
  });

  // If the previous number of cols was singular, then we don't
  // use the horizontal spacing between frames to guess the offset
  // for the next row. We just use a tenth of the frame width.
  if (prevNumCols == 1) {
    const offset = Math.max(1, Math.floor(frames[0].width * 0.1));
    for (var newColCount = 1; newColCount <= numNewCols; newColCount++) {
      newFrames = [
        ...newFrames,
        ...frames.map((f) => {
          return {
            ...f,
            data: null,
            col: f.col + newColCount,
            x: f.x + (offset + f.width) * newColCount,
          };
        }),
      ];
    }
  } else {
    // The strategy used below is analogous to the approach in `extendRows`
    // See comment there for details.
    var secondToLastCol: Frame[] = frames
      .filter(
        (f) => f.col == prevNumCols - 2 // minus 2 because Frame.col starts at 0
      )
      .sort((a, b) => a.row - b.row);
    var lastCol: Frame[] = frames
      .filter((f) => f.col == prevNumCols - 1)
      .sort((a, b) => a.row - b.row);
    for (var newColCount = 1; newColCount <= numNewCols; newColCount++) {
      var newCol: Frame[] = [];
      for (var i = 0; i < lastCol.length; i++) {
        var offset =
          lastCol[i].x - (secondToLastCol[i].x + secondToLastCol[i].width);
        newCol.push({
          ...lastCol[i],
          col: prevNumCols - 1 + newColCount,
          x: lastCol[i].x + lastCol[i].width + offset,
        });
      }
      secondToLastCol = lastCol;
      lastCol = newCol;
      newFrames = newFrames.concat(newCol);
    }
  }

  return newFrames;
};

export default function GridOptionsComponent({
  gridOptions,
  setGridOptions,
  loading,
  frames,
  setFrames,
  imageSize,
}: {
  gridOptions: GridOptions;
  setGridOptions: Dispatch<SetStateAction<GridOptions>>;
  loading: boolean;
  frames: Frame[];
  setFrames: Dispatch<SetStateAction<Frame[]>>;
  imageSize: Size;
}) {
  const [widthError, setWidthError] = useState<boolean | string>(false);
  const [heightError, setHeightError] = useState<boolean | string>(false);
  const [rowsError, setRowsError] = useState<boolean | string>(false);
  const [colsError, setColsError] = useState<boolean | string>(false);

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
          error={rowsError}
          onChange={(nRows) => {
            const newNumRows = parseInt(nRows.toString());
            if (newNumRows == gridOptions.numRows) return;

            let newFrames: Frame[];
            if (newNumRows > gridOptions.numRows) {
              newFrames = extendRows(frames, gridOptions.numRows, newNumRows);
              if (!framesInBounds(newFrames, imageSize)) {
                setRowsError("frames exceed image bounds");
                return;
              }
            } else {
              newFrames = frames.filter((f) => f.row < newNumRows);
            }

            setRowsError(false);

            setGridOptions({
              ...gridOptions,
              numRows: newNumRows,
            });
            setFrames(newFrames);
          }}
        />
        <NumberInput
          label="Columns"
          value={gridOptions.numCols}
          min={1}
          w={100}
          error={colsError}
          onChange={(nCols) => {
            const newNumCols = parseInt(nCols.toString());
            if (newNumCols == gridOptions.numCols) return;

            let newFrames: Frame[];
            if (newNumCols > gridOptions.numCols) {
              newFrames = extendCols(frames, gridOptions.numCols, newNumCols);
              if (!framesInBounds(newFrames, imageSize)) {
                setColsError("frames exceed image bounds");
                return;
              }
            } else {
              newFrames = frames.filter((f) => f.col < newNumCols);
            }

            setColsError(false);
            setGridOptions({
              ...gridOptions,
              numCols: newNumCols,
            });
            setFrames(newFrames);
          }}
        />
      </Group>

      <Group>
        <NumberInput
          label="Width"
          value={gridOptions.frameWidth}
          min={1}
          onChange={(value) => {
            const newWidth = parseFloat(value as string);
            const newFrames: Frame[] = frames.map((f) => {
              return { ...f, data: null, width: newWidth };
            });
            if (!framesOverlap(newFrames)) {
              setWidthError("frame overlap");
              return;
            }
            if (!framesInBounds(newFrames, imageSize)) {
              setWidthError("frames exceed image bounds");
              return;
            }
            setWidthError(false);
            setGridOptions({
              ...gridOptions,
              frameWidth: newWidth,
              lockAspectRatio: getLockAspectRatio(gridOptions),
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
            const newFrames: Frame[] = frames.map((f) => {
              return { ...f, data: null, height: newHeight };
            });
            if (!framesOverlap(newFrames)) {
              setHeightError("frame overlap");
              return;
            }
            if (!framesInBounds(newFrames, imageSize)) {
              setHeightError("frames exceed image bounds");
              return;
            }
            setHeightError(false);
            setGridOptions({
              ...gridOptions,
              frameHeight: parseInt(value as string),
              lockAspectRatio: getLockAspectRatio(gridOptions),
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
