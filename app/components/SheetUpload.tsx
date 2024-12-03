import { Group, Text, rem, useMantineTheme } from "@mantine/core";
import { IconUpload, IconPhoto, IconX } from "@tabler/icons-react";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { Dispatch, SetStateAction } from "react";
import { WizardStep } from "@/app/types";

export default function SheetUpload({
  setImageUrls,
  setWizardStep,
}: {
  setImageUrls: Dispatch<SetStateAction<string[]>>;
  setWizardStep: Dispatch<SetStateAction<WizardStep>>;
}) {
  const theme = useMantineTheme();

  return (
    <>
      <Dropzone
        onDrop={(files) => {
          setImageUrls(files.map((f) => URL.createObjectURL(f)));
          setWizardStep("gridDims")
        }}
        accept={IMAGE_MIME_TYPE}
      >
        <Group style={{ minHeight: rem(220), pointerEvents: "none" }}>
          <Dropzone.Accept>
            <IconUpload
              size="3.2rem"
              stroke={1.5}
              color={
                theme.colors[theme.primaryColor][
                  theme.colorScheme === "dark" ? 4 : 6
                ]
              }
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX
              size="3.2rem"
              stroke={1.5}
              color={theme.colors.red[theme.colorScheme === "dark" ? 4 : 6]}
            />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconPhoto size="3.2rem" stroke={1.5} />
          </Dropzone.Idle>

          <Group>
            <Text size="xl" inline>
              Drag image here or click to select files
            </Text>
          </Group>
        </Group>
      </Dropzone>
    </>
  );
}
