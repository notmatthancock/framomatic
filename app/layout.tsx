import "@mantine/core/styles.css";
import '@mantine/carousel/styles.css';
import "@mantine/dropzone/styles.css";

import {
  AppShell,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
  Center,
  ColorSchemeScript,
  Group,
  Image,
  MantineProvider,
  Text,
} from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import type { Metadata } from "next";
import { theme } from "../theme";

export const metadata: Metadata = {
  title: "Framomatic",
  description: "Contact sheet to animation frames automation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <ModalsProvider>
            <AppShell
              header={{ height: 60 }}
              footer={{ height: 40 }}
              padding="md"
            >
              <AppShellHeader>
                <Group h="100%" px="md">
                  <Image src="logo.png" alt="Framomatic logo" h={30} />
                </Group>
              </AppShellHeader>
              <AppShellMain>{children}</AppShellMain>
              <AppShellFooter>
                <Center>
                  <Text size="sm" c="dimmed">
                    TODO add a footer with some info or whatever
                  </Text>
                </Center>
              </AppShellFooter>
            </AppShell>
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
