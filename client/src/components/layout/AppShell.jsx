import { Box, Container } from "@chakra-ui/react";
import TopNav from "./TopNav";

export default function AppShell({ children }) {
  return (
    <Box minH="100vh" bg="bg.canvas" color="fg" position="relative" overflow="hidden">
      {/* grid overlay */}
      <Box
        position="absolute"
        inset="0"
        bgImage="radial-gradient(rgba(148,163,184,0.22) 1px, transparent 1px)"
        bgSize="44px 44px"
        opacity={{ base: 0.10, md: 0.16 }}
        maskImage="radial-gradient(ellipse at 45% 15%, black, transparent 70%)"
        pointerEvents="none"
      />

      {/* glows */}
      <Box
        position="absolute"
        top="-18%"
        left="-10%"
        w="760px"
        h="760px"
        bg="accent.primary"
        opacity={{ base: 0.10, md: 0.14 }}
        filter="blur(180px)"
        borderRadius="full"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-22%"
        right="-12%"
        w="820px"
        h="820px"
        bg="accent.secondary"
        opacity={{ base: 0.08, md: 0.12 }}
        filter="blur(200px)"
        borderRadius="full"
        pointerEvents="none"
      />

      <Box position="relative" zIndex="1">
        <TopNav />

        <Container maxW="6xl" py={{ base: 6, md: 8 }}>
          <Box
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="shell"
            p={{ base: 4, md: 8 }}
            boxShadow="premium"
            backdropFilter="blur(10px)"
          >
            {children}
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
