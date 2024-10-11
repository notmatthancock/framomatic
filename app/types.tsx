export type SpatialPosition = {
  x: number;
  y: number;
};

export type Grid = {
  nRows: number;
  nCols: number;
}

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

export type GridOptions = {
  frameWidth: number;
  frameHeight: number;
  lockAspectRatio: boolean | number;
  frameColor: string;
  frameThickness: number;
  // debug props
  x: number;
  y: number;
};


export type WizardStep = null | "gridDims" | "firstFrame" | "frameSpacing" | "compute" | "free";