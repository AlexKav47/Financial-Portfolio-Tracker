import { Box } from "@chakra-ui/react";

export default function Card({ children, ...props }) {
  return (
    <Box
      bg="bg.elevated"
      borderColor="border.default"
      borderWidth="1px"
      borderRadius="card"
      p={6}
      backdropFilter="blur(10px)"
      _hover={{ borderColor: "border.strong" }}
      transition="border-color 0.2s ease"
      {...props}
    >
      {children}
    </Box>
  );
}
