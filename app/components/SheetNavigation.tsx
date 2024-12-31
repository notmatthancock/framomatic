import { Button, Group, LoadingOverlay, Text } from "@mantine/core";
import { Dispatch, SetStateAction } from "react";
import { IconArrowLeftBar, IconArrowRightBar } from "@tabler/icons-react";

export default function SheetNavigation({
  activeSheet,
  setActiveSheet,
  numSheets,
  disabled,
}: {
  activeSheet: number;
  setActiveSheet: Dispatch<SetStateAction<number>>;
  numSheets: number;
  disabled?: boolean;
}) {
  return (
    <Group>
      <Button
        disabled={disabled || activeSheet == 0}
        onClick={() => setActiveSheet((a) => a - 1)}
      >
        <IconArrowLeftBar />
      </Button>
      <Text>Sheet {activeSheet + 1}</Text>
      <Button
        disabled={disabled || activeSheet == numSheets - 1}
        onClick={() => setActiveSheet((a) => a + 1)}
      >
        <IconArrowRightBar />
      </Button>
    </Group>
  );
}
