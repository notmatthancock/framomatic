import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";
import getConfig from "next/config";

import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  ColorSchemeScript,
  MantineProvider,
} from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import type { Metadata } from "next";
import { theme } from "../theme";

import AppHeader from "@/app/components/AppHeader"

export const metadata: Metadata = {
  title: "Framomatic",
  description: "Contact sheet to animation frames automation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { publicRuntimeConfig } = getConfig();

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
              header={{ height: 30 }}
              // footer={{ height: 40 }}
              padding="md"
            >
              <AppShellHeader>
                <AppHeader appVersion={publicRuntimeConfig.appVersion} />
              </AppShellHeader>
              <AppShellMain>{children}</AppShellMain>
            </AppShell>
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
