export type Position = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type Box = Position & Size;

export type Frame = Box & { data: ImageData | null };

export type GridParams = {
  xSpacing: number;
  ySpacing: number;
  numRows: number;
  numCols: number;
};
