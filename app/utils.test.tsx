import { expect, test } from "@jest/globals";
import { overlaps, rescaleBox } from "./utils";

const testBox = { row: -1, col: -1 };

test("box at origin and square", () => {
  const result = rescaleBox(
    { ...testBox, x: 0, y: 0, width: 50, height: 50 },
    { width: 100, height: 100 },
    { width: 200, height: 200 }
  );
  expect(result).toEqual({
    ...testBox,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
});

test("box off origin and square", () => {
  const result = rescaleBox(
    { ...testBox, x: 25, y: 25, width: 50, height: 50 },
    { width: 100, height: 100 },
    { width: 200, height: 200 }
  );
  expect(result).toEqual({
    ...testBox,
    x: 50,
    y: 50,
    width: 100,
    height: 100,
  });
});

test("box off origin different x and y and square", () => {
  const result = rescaleBox(
    { ...testBox, x: 10, y: 25, width: 50, height: 50 },
    { width: 100, height: 100 },
    { width: 200, height: 200 }
  );
  expect(result).toEqual({
    ...testBox,
    x: 20,
    y: 50,
    width: 100,
    height: 100,
  });
});

test("box at origin and rectangular long width", () => {
  const result = rescaleBox(
    { ...testBox, x: 0, y: 0, width: 50, height: 25 },
    { width: 100, height: 100 },
    { width: 200, height: 200 }
  );
  expect(result).toEqual({
    ...testBox,
    x: 0,
    y: 0,
    width: 100,
    height: 50,
  });
});

test("box at origin and rectangular long height", () => {
  const result = rescaleBox(
    { ...testBox, x: 0, y: 0, width: 25, height: 50 },
    { width: 100, height: 100 },
    { width: 200, height: 200 }
  );
  expect(result).toEqual({
    ...testBox,
    x: 0,
    y: 0,
    width: 50,
    height: 100,
  });
});

test("non overlapping boxes 1", () => {
  const b1 = { ...testBox, x: 0, y: 0, width: 2, height: 2 };
  const b2 = { ...testBox, x: 3, y: 0, width: 2, height: 2 };
  expect(overlaps(b1, b2)).toEqual(false);
  expect(overlaps(b2, b1)).toEqual(false);
});

test("non overlapping boxes 2", () => {
  const b1 = { ...testBox, x: 0, y: 0, width: 2, height: 2 };
  const b2 = { ...testBox, x: 0, y: 3, width: 2, height: 2 };
  expect(overlaps(b1, b2)).toEqual(false);
  expect(overlaps(b2, b1)).toEqual(false);
});

test("non overlapping boxes 3", () => {
  const b1 = { ...testBox, x: 0, y: 0, width: 2, height: 2 };
  const b2 = { ...testBox, x: 3, y: 3, width: 2, height: 2 };
  expect(overlaps(b1, b2)).toEqual(false);
  expect(overlaps(b2, b1)).toEqual(false);
});

test("overlapping boxes 1", () => {
  const b1 = { ...testBox, x: 0, y: 0, width: 2, height: 2 };
  const b2 = { ...testBox, x: 1, y: 0, width: 2, height: 2 };
  expect(overlaps(b1, b2)).toEqual(true);
  expect(overlaps(b2, b1)).toEqual(true);
});

test("overlapping boxes 2", () => {
  const b1 = { ...testBox, x: 0, y: 0, width: 2, height: 2 };
  const b2 = { ...testBox, x: 0, y: 1, width: 2, height: 2 };
  expect(overlaps(b1, b2)).toEqual(true);
  expect(overlaps(b2, b1)).toEqual(true);
});

test("overlapping boxes 3", () => {
  const b1 = { ...testBox, x: 0, y: 0, width: 2, height: 2 };
  const b2 = { ...testBox, x: 1, y: 1, width: 2, height: 2 };
  expect(overlaps(b1, b2)).toEqual(true);
  expect(overlaps(b2, b1)).toEqual(true);
});
