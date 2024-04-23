import { expect, test } from "@jest/globals";
import { rescaleBox } from "./utils";

test("box at origin and square", () => {
  const result = rescaleBox(
    { x: 0, y: 0, width: 50, height: 50 },
    { width: 100, height: 100 },
    { width: 200, height: 200 }
  );
  expect(result).toEqual({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
});

test("box off origin and square", () => {
  const result = rescaleBox(
    { x: 25, y: 25, width: 50, height: 50 },
    { width: 100, height: 100 },
    { width: 200, height: 200 }
  );
  expect(result).toEqual({
    x: 50,
    y: 50,
    width: 100,
    height: 100,
  });
});

test("box off origin different x and y and square", () => {
  const result = rescaleBox(
    { x: 10, y: 25, width: 50, height: 50 },
    { width: 100, height: 100 },
    { width: 200, height: 200 }
  );
  expect(result).toEqual({
    x: 20,
    y: 50,
    width: 100,
    height: 100,
  });
});

test("box at origin and rectangular long width", () => {
  const result = rescaleBox(
    { x: 0, y: 0, width: 50, height: 25 },
    { width: 100, height: 100 },
    { width: 200, height: 200 }
  );
  expect(result).toEqual({
    x: 0,
    y: 0,
    width: 100,
    height: 50,
  });
});

test("box at origin and rectangular long height", () => {
  const result = rescaleBox(
    { x: 0, y: 0, width: 25, height: 50 },
    { width: 100, height: 100 },
    { width: 200, height: 200 }
  );
  expect(result).toEqual({
    x: 0,
    y: 0,
    width: 50,
    height: 100,
  });
});
