"use client";
import { modals } from "@mantine/modals";
import { useEffect, useMemo, useRef, useState } from "react";

import FrameDetector from "@/app/components/FrameDetector";
import FrameSelector from "@/app/components/FrameSelector";
import GridDimsSelector from "@/app/components/GridDimsSelector";
import SheetsUpload from "@/app/components/SheetUpload";
import { getInitialFirstFrame } from "@/app/utils";

import type { Frame, Grid, WizardStep } from "@/app/types";

export default function Home() {
  const [wizardStep, setWizardStep] = useState<WizardStep>("sheetsUpload");

  // Wizard Step States
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [gridDims, setGridDims] = useState<Grid>({ nRows: 0, nCols: 0 });
  const [firstFrame, setFirstFrame] = useState<Frame | null>(null);
  const [spacingFrame, setSpacingFrame] = useState<Frame | null>(null);

  const workerRef = useRef<Worker>()
  useEffect(() => {
    workerRef.current = new Worker(new URL("@/app/crop-frames.ts", import.meta.url));
    return () => workerRef.current!.terminate();
  }, []);

  return (
    <>
      {wizardStep == "sheetsUpload" && (
        <SheetsUpload
          setImageUrls={setImageUrls}
          setWizardStep={setWizardStep}
        />
      )}
      {wizardStep == "gridDims" && (
        <GridDimsSelector
          imageUrls={imageUrls}
          gridDims={gridDims}
          setGridDims={setGridDims}
          setWizardStep={setWizardStep}
          setImageUrls={setImageUrls}
        />
      )}
      {wizardStep == "firstFrame" && (
        <FrameSelector
          wizardStep={wizardStep}
          imageUrl={imageUrls[0]}
          frame={firstFrame}
          setFrame={setFirstFrame}
          frameInitializer={getInitialFirstFrame}
          onPrev={() => {
            setFirstFrame(null);
            setWizardStep("gridDims");
          }}
          onNext={() => {
            modals.openConfirmModal({
              title: "Confirm Initial Frame in Top Left Position",
              children: (
                <>
                  Confirm selection of initial frame in <b>top left</b>{" "}
                  position.
                </>
              ),
              labels: { confirm: "Confirm", cancel: "Cancel" },
              onConfirm: () => {
                setWizardStep("frameSpacing");
              },
            });
          }}
          modalInfo={{
            title: "Select Top Left Frame",
            description:
              "Selecting the top left frame establishes the frame size as well as starting position for find the remaining frames automatically.",
            imageUrl: "first-frame.svg",
          }}
        />
      )}
      {wizardStep == "frameSpacing" && (
        <FrameSelector
          wizardStep={wizardStep}
          imageUrl={imageUrls[0]}
          frame={spacingFrame}
          setFrame={setSpacingFrame}
          frameInitializer={(size) => {
            if (!firstFrame)
              throw new Error(
                "cannot initialize spacing frame with null first frame"
              );
            return {
              ...firstFrame,
              width: 2 * firstFrame.width,
              height: 2 * firstFrame.height,
            };
          }}
          onPrev={() => {
            setSpacingFrame(null);
            setWizardStep("firstFrame");
          }}
          onNext={() => {
            modals.openConfirmModal({
              title: "Confirm 2x2 Selection",
              children: (
                <>
                  Confirm selection of top-left 2x2 frames. There should be{" "}
                  <b>four frames</b> selected.
                </>
              ),
              labels: { confirm: "Confirm", cancel: "Cancel" },
              onConfirm: () => {
                setWizardStep("compute");
              },
            });
          }}
          modalInfo={{
            title: "Select Top Left 2x2",
            description:
              "Select the top left 2x2. This establishes an estimate of the spacing between frames.",
            imageUrl: "spacing-frame.svg",
          }}
        />
      )}
      {(wizardStep == "compute" || wizardStep == "free") &&
        firstFrame &&
        spacingFrame && (
          <FrameDetector
            wizardStep={wizardStep}
            setWizardStep={setWizardStep}
            worker={workerRef.current!}
            imageUrls={imageUrls}
            gridDims={gridDims}
            firstFrame={firstFrame}
            spacingFrame={spacingFrame}
          />
        )}
    </>
  );
}
