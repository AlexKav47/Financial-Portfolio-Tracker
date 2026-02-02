import { Box, Container } from "@chakra-ui/react";
import TopNav from "./TopNav";

export default function AppShell({ children }) {
  return (
    <Box minH="100vh" bg="bg.canvas" transition="background 0.2s">
      <TopNav />
      
      <Container maxW="6xl" py={8}>
        <Box 
          bg="bg.panel" 
          shadow="sm" 
          borderRadius="l3" 
          p={{ base: 4, md: 8 }}
          borderWidth="1px"
          borderColor="border.subtle"
        >
          {children}
        </Box>
      </Container>
    </Box>
  );
}