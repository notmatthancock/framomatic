"use client";

import { Anchor, Group, Image, Modal, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

export default function AppShellHeader({ appVersion }: { appVersion: string }) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Group h="100%" px="md">
      <Modal opened={opened} onClose={close}>
        <Image src="logo.png" alt="Framomatic logo" w={200} />
        <Anchor
          href={`https://github.com/notmatthancock/framomatic/tree/${appVersion}`}
        >
          Framomatic version {appVersion}
        </Anchor>

        <Text mt="lg" mb="lg">
          I built this application to automate the cropping process for creating
          animation frames from multiple scanned &quot;contact sheets&quot;.
        </Text>
        <Text mt="lg" mb="lg">
          Typically this process involves opening a scanned sheet in your
          favorite image editing tool and then manually cropping and exporting
          each frame, exporting the individual images. This process is extremely
          tedious and error prone -- hence this application!
        </Text>

        <Title order={5}>Caveats</Title>
        <Text mt="lg" mb="lg">
          This application is free. So it&apos;s not super polished, and
          it&apos;s definitely not perfect. Be aware that there are some memory
          limitations working within the web browser. If you have many sheets or
          if you have extremely large images, it is likely that you may
          experience issues.
        </Text>

        <Title order={5}>Donating</Title>

        <Text mt="lg" mb="lg">
          I built this application in my free time. If you found it useful and
          would like to donate, use this link:
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
