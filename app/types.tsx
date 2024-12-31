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
  // Is the frame active?
  active: boolean;
  // Is the frame's movement locked?
  locked: boolean;
  // The sheet to which the frame belongs
  sheet: number;
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

export type WizardStep = "sheetsUpload" | "gridDimensions" | "firstFrame" | "frameSpacing" | "frameDetection";

export type SimpleModalInfo = {
  title: string;
  description: string;
  imageUrl?: string;
}

export type WorkerMessage = {
  type: "newFrame" | "sheetEnd" | "error";
  // defined if message type is newFrame
  frame?: Frame;
  error?: string;
}