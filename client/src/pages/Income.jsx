import { Heading, Text, Stack } from "@chakra-ui/react";
import AppShell from "../components/layout/AppShell.jsx";
import Card from "../components/ui/Card.jsx";

export default function Income() {
  return (
    <AppShell>
      <Card>
        <Stack gap={2}>
          <Heading size="md">Income</Heading>
          <Text color="fg.muted">
            Placeholder. This will track dividends and crypto staking rewards.
          </Text>
        </Stack>
      </Card>
    </AppShell>
  );
}
