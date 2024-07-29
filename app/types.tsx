export type SpatialPosition = {
  x: number;
  y: number;
};

export type GridPosition = {
  row: number;
  col: number;
};

export type Size = {
  width: number;
  height: number;
};

export type Box = SpatialPosition & GridPosition & Size;

export type Frame = Box & {
  // Cropped image data inside the respective box
  data: ImageData | null;
  // 
  active: boolean;
};

export enum SelectionMode {
  FREE = "Free",
  ELASTIC = "Elastic",
}

export enum ScanOrder {
  COLS_FIRST = "Columns First",
  ROWS_FIRST = "Rows First",
}

export type GridOptions = {
  frameWidth: number;
  frameHeight: number;
  numRows: number;
  numCols: number;
  locked: boolean;
  color: string;
  startOffset: number;
  endOffset: number;
  selectionMode: SelectionMode;
  scanOrder: ScanOrder;
};
