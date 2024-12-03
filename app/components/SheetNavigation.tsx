import { Button, Group, LoadingOverlay, Text } from "@mantine/core";
import { Dispatch, SetStateAction } from "react";
import { IconArrowLeftBar, IconArrowRightBar } from "@tabler/icons-react";

export default function SheetNavigation({
  activeSheet,
  imageUrlsLength,
  setActiveSheet,
}: {
  activeSheet: number;
  imageUrlsLength: number;
  setActiveSheet: Dispatch<SetStateAction<number>>;
}) {
  return (
    <Group>
      <Button
        disabled={activeSheet == 0}
        onClick={() => setActiveSheet((a) => a - 1)}
      >
        <IconArrowLeftBar />
      </Button>
      <Text>Sheet {activeSheet + 1}</Text>
      <Button
        disabled={activeSheet == imageUrlsLength - 1}
        onClick={() => setActiveSheet((a) => a + 1)}
      >
        <IconArrowRightBar />
      </Button>
    </Group>
  );
}
