import { ActionIcon } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

export default function HelpButton({openModal}: {openModal: () => void;}) {
  return (
    <>
      <ActionIcon onClick={openModal} variant="default" size="sm">
        <IconInfoCircle />
      </ActionIcon>
    </>
  );
}
