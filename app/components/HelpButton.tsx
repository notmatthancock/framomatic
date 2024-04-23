import { ActionIcon, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconInfoCircle } from "@tabler/icons-react";

export default function HelpButton({ title, text }: { title: string; text: string }) {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <Modal opened={opened} onClose={close}>
        {text}
      </Modal>
      <ActionIcon onClick={open} variant="default" size="sm">
        <IconInfoCircle />
      </ActionIcon>
    </>
  );
}
