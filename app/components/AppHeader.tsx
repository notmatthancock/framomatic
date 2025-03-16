"use client";

import { Anchor, Group, Image, List, Modal, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

export default function AppShellHeader({ appVersion }: { appVersion: string }) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Group h="100%" px="md">
      <Modal opened={opened} onClose={close} size="lg" m="xl">
        <Image src="logo.png" alt="Framomatic logo" w={200} />
        <Anchor
          href={`https://github.com/notmatthancock/framomatic/tree/${appVersion}`}
        >
          Framomatic version {appVersion}
        </Anchor>

        <Text m="lg">
          <List>
            <List.Item>
              This application automates the tedious process of creating
              animation frames from scanned{" "}
              <a href="https://en.wikipedia.org/wiki/Contact_print">
                contact sheets
              </a>
              .
            </List.Item>
            <List.Item>
              Instead of manually cropping each frame using in an image editor,
              this tool helps you extract them quickly.
            </List.Item>
          </List>
        </Text>

        <Title order={5}>Limitations</Title>
        <Text m="lg">
          <List>
            <List.Item>
              This is a free, unpolished application. It may not be perfect.
            </List.Item>
            <List.Item>
              Browser memory limitations may cause issues with large images or
              many sheets.
            </List.Item>
          </List>
        </Text>

        <Title order={5}>Donations</Title>

        <Text m="lg">
          I built this application in my free time. If you found it useful,
          consider donating:
        </Text>
        <Anchor
          href="https://www.buymeacoffee.com/notmatthancock"
          target="_blank"
        >
          <Image
            src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
            alt="Buy Me A Coffee"
            w={125}
          />
        </Anchor>
      </Modal>

      <Anchor onClick={open}>
        <Image src="logo.png" alt="Framomatic logo" h={20} />
      </Anchor>
    </Group>
  );
}
