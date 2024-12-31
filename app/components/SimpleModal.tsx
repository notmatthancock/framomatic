import { Button, Center, Flex, Image, Text } from "@mantine/core";
import { modals } from "@mantine/modals";

import type { SimpleModalInfo } from "@/app/types";

export default function openSimpleModal(modalInfo: SimpleModalInfo) {
  modals.open({
    withCloseButton: false,
    title: modalInfo.title,
    children: (
      <>
        {modalInfo.imageUrl && (
          <Center>
            <Image
              src={modalInfo.imageUrl}
              alt={modalInfo.title}
              w={200}
              m="md"
            />
          </Center>
        )}
        <Text>{modalInfo.description}</Text>
        <Flex align="center" justify="flex-end" direction="row">
          <Button onClick={() => modals.closeAll()}>OK</Button>
        </Flex>
      </>
    ),
  });
}
