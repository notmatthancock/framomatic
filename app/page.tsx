"use client";

import ImageLoader from "@/app/components/ImageLoader";
import {
  Center,
  Checkbox,
  Group,
  Image,
  NumberInput,
  Stack,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { Rnd } from "react-rnd";

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string>();
  const [box, setBox] = useState<Box>({ x: 5, y: 5, width: 100, height: 100 });
  const [lockAspectRatio, setLockAspectRatio] = useState(false);

  useEffect(() => console.log(box), [box]);

  return (
    <>
      <Center w={500}>
        {imageUrl ? (
          <Stack>

            <Group>
              <NumberInput
                label="X"
                value={box.x}
                min={1}
                onChange={(value) => {
                  setBox({ ...box, x: parseInt(value) });
                }}
                w={100}
              />

              <NumberInput
                label="Y"
                value={box.y}
                min={1}
                onChange={(value) => {
                  setBox({ ...box, y: parseInt(value) });
                }}
                w={100}
              />

              <NumberInput
                label="Width"
                value={box.width}
                min={1}
                onChange={(value) => {
                  setBox({ ...box, width: parseInt(value) });
                }}
                w={100}
              />

              <NumberInput
                label="Height"
                value={box.height}
                min={1}
                onChange={(value) => {
                  setBox({ ...box, height: parseInt(value) });
                }}
                w={100}
              />

              <Checkbox
                label="Lock Aspect"
                checked={lockAspectRatio}
                onChange={(event) =>
                  setLockAspectRatio(event.currentTarget.checked)
                }
              />
            </Group>

            <Stack>
              <Rnd
                bounds="parent"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "solid 1px red",
                  background: "none",
                }}
                default={box}
                onDragStop={(e, b) => {
                  setBox({ ...box, x: b.x, y: b.y });
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  setBox({
                    ...box,
                    width: parseInt(ref.style.width),
                    height: parseInt(ref.style.height),
                  });
                }}
              />
              <Image
                style={{ border: "1px solid #ccc" }}
                w={500}
                src={imageUrl}
              />
            </Stack>
          </Stack>
        ) : (
          <ImageLoader setImageUrl={setImageUrl} />
        )}
      </Center>
    </>
  );
}
