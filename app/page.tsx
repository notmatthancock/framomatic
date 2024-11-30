"use client";
import { modals } from "@mantine/modals";
import { useState } from "react";

import GridDimsSelector from "@/app/components/GridDimsSelector";
import SheetsUpload from "@/app/components/SheetsUpload";
import FrameSelector from "@/app/components/FrameSelector";
import { getInitialFirstFrame } from "@/app/utils";

import type { Frame, Grid, WizardStep } from "@/app/types";

export default function Home() {
  const [wizardStep, setWizardStep] = useState<WizardStep>("sheetsUpload");

  // Wizard Step States
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [gridDims, setGridDims] = useState<Grid>({ nRows: 0, nCols: 0 });
  const [firstFrame, setFirstFrame] = useState<Frame | null>(null);
  const [spacingFrame, setSpacingFrame] = useState<Frame | null>(null);

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
                <>Confirm to selection of initial frame in <b>top left</b> position.</>
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
          onNext={() => {}}
          modalInfo={{
            title: "Select Top Left 2x2",
            description:
              "Select the top left 2x2. This establishes an estimate of the spacing between frames.",
            imageUrl: "spacing-frame.svg",
          }}
        />
      )}
    </>
  );
}
