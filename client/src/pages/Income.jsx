import { Box, Heading, Text } from "@chakra-ui/react";
import AppShell from "../components/layout/AppShell.jsx";

export default function Income() {
  return (
    <AppShell>
      <Box borderWidth="1px" borderRadius="lg" p={6} bg="white">
        <Heading size="md" mb={2}>Income</Heading>
        <Text color="gray.600">
          Placeholder. This will track dividends and crypto staking rewards.
        </Text>
      </Box>
    </AppShell>
  );
}
