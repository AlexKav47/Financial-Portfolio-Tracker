import { Heading, Skeleton, Text } from "@chakra-ui/react";
import Card from "../ui/Card.jsx";

export default function KpiCard({ title, value, subtext, isLoading }) {

  return (
    <Card p={5}>
      <Text fontSize="sm" color="fg.muted" mb={1}>
        {title}
      </Text>

      {isLoading ? (
        <Skeleton height="28px" borderRadius="md" />
      ) : (
        <Heading size="md">{value}</Heading>
      )}

      {subtext && (
        <Text fontSize="xs" color="fg.muted" mt={2}>
          {subtext}
        </Text>
      )}
    </Card>
  );
}