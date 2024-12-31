import {
  Button,
  Card,
  Divider,
  Flex,
  Group,
  Stack,
  Title,
  Tooltip,
} from "@mantine/core";

import HelpButton from "@/app/components/HelpButton";
import {
  nextWizardStep,
  prevWizardStep,
  toTitle,
} from "@/app/utils";
import type { SimpleModalInfo, WizardStep } from "@/app/types";
import openSimpleModal from "./SimpleModal";

export default function WizardNavigation({
  children,
  wizardStep,
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
  helpModal = undefined,
}: {
  children?: React.ReactNode;
  wizardStep: WizardStep;
  onPrev?: () => void;
  onNext?: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  helpModal?: SimpleModalInfo;
}) {
  const prevButton = (
    <Button
      disabled={!onPrev || prevDisabled}
      onClick={() => {
        if (onPrev) onPrev();
      }}
    >
      Prev
    </Button>
  );
  const nextButton = (
    <Button
      disabled={!onNext || nextDisabled}
      onClick={() => {
        if (onNext) onNext();
      }}
    >
      Next
    </Button>
  );

  return (
    <Card withBorder mb="md">
      <Stack>
        <Group align="center" justify="space-between" mb="sm">
          <Title order={4}>Step: {toTitle(wizardStep)}</Title>
          {helpModal && (
            <HelpButton
              openModal={() => {
                openSimpleModal(helpModal);
              }}
            />
          )}
        </Group>
        {children}
        <Divider mt="sm" />
        <Flex direction="row" justify="space-between" align="center">
          {prevDisabled || prevWizardStep(wizardStep) == null ? (
            prevButton
          ) : (
            <Tooltip
              label={`Go to previous step: "${toTitle(
                prevWizardStep(wizardStep) as string
              )}"`}
            >
              {prevButton}
            </Tooltip>
          )}
          {nextDisabled || nextWizardStep(wizardStep) == null ? (
            nextButton
          ) : (
            <Tooltip
              label={`Go to next step: "${toTitle(
                nextWizardStep(wizardStep) as string
              )}"`}
            >
              {nextButton}
            </Tooltip>
          )}
        </Flex>
      </Stack>
    </Card>
  );
}
