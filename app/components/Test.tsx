import { Button, Slider } from "@mantine/core";
import { useEffect, useRef, useState } from "react";

export const Test = () => {
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(0);
  const requestRef = useRef<number>();

  const animate = (time: number) => {
    setCount((prevCount) => (prevCount + 1) % 100);
    requestRef.current = requestAnimationFrame(animate);
  };

  // useEffect(() => {
  //   requestRef.current = requestAnimationFrame(animate);
  //   return () => cancelAnimationFrame(requestRef.current!);
  // }, []); // Make sure the effect runs only once

  return (
    <div style={{ margin: "50px" }}>
      <Slider value={count} onChange={setCount}></Slider>
      <div style={{ margin: "50px" }}>{Math.round(count)}</div>
      <Button
        onClick={() => {
          if (running) {
            cancelAnimationFrame(requestRef.current!);
          } else {
            requestRef.current = requestAnimationFrame(animate);
          }
          setRunning(!running);
        }}
      >
        {running ? "Stop" : "Start"}
      </Button>
    </div>
  );
};
