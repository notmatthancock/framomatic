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
  // Is the frame active?
  active: boolean;
  // Is the frame's movement locked?
  locked: boolean;
};

export enum SelectionMode {
  EQUAL = "Equal",
  ELASTIC = "Elastic",
  FREE = "Free",
}

export type GridOptions = {
  frameWidth: number;
  frameHeight: number;
  numRows: number;
  numCols: number;
  lockAspectRatio: boolean | number;
  locked: boolean;
  frameColor: string;
  frameThickness: number;
  startOffset: number;
  endOffset: number;
  selectionMode: SelectionMode;
};
