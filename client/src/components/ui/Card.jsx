import { Box } from "@chakra-ui/react";

export default function Card({ children, ...props }) {
  return (
    <Box
      bg="bg.panel"
      borderColor="border.default"
      borderWidth="1px"
      borderRadius="l2" 
      boxShadow="sm"
      p={6} 
      {...props}
    >
      {children}
    </Box>
  );
}