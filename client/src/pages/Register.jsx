import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Field,
  Heading,
  Input,
  Stack,
  Text,
  Alert,
  Link,
  List,
  HStack,
  Circle,
} from "@chakra-ui/react";
import { UserPlus, ArrowRight, ShieldCheck, LineChart } from "lucide-react";
import { register } from "../api/authApi";

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // ---- hardcoded palette (independent of color mode) ----
  const T = {
    bg0: "#050816",
    bg1: "rgba(11, 18, 39, 0.72)",
    bg2: "rgba(14, 25, 55, 0.70)",
    stroke: "rgba(148, 163, 184, 0.18)",
    stroke2: "rgba(148, 163, 184, 0.28)",
    text0: "#EAF0FF",
    text1: "rgba(234,240,255,0.78)",
    text2: "rgba(234,240,255,0.56)",
    brand0: "#7C3AED",
    brand1: "#22D3EE",
    danger: "#FB7185",
    shadow: "0 30px 90px rgba(0,0,0,0.55)",
  };

  const validatePassword = (password) => {
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
    if (!/[!@#$%^&*]/.test(password)) return "Password must contain at least one special character (!@#$%^&*).";
    return null;
  };

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim()) return setError("Email is required.");

    const passwordError = validatePassword(pw1);
    if (passwordError) return setError(passwordError);

    if (pw1 !== pw2) return setError("Passwords do not match.");

    setBusy(true);
    try {
      const { res, data } = await register(email, pw1);
      setBusy(false);
      if (!res.ok) {
        setError(data?.error || "Registration failed.");
        return;
      }
      nav("/login", { replace: true });
    } catch {
      setBusy(false);
      setError("An unexpected error occurred.");
    }
  }

  return (
    <Box minH="100vh" bg={T.bg0} color={T.text0} position="relative" overflow="hidden">
      {/* grid overlay */}
      <Box
        position="absolute"
        inset="0"
        bgImage={`radial-gradient(${T.stroke2} 1px, transparent 1px)`}
        bgSize="44px 44px"
        opacity="0.22"
        maskImage="radial-gradient(ellipse at 45% 15%, black, transparent 72%)"
        pointerEvents="none"
      />
      {/* glow blobs */}
      <Box
        position="absolute"
        top="-18%"
        left="-10%"
        w="760px"
        h="760px"
        bg={T.brand0}
        opacity="0.14"
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
        bg={T.brand1}
        opacity="0.12"
        filter="blur(200px)"
        borderRadius="full"
        pointerEvents="none"
      />

      <Container maxW="md" py={{ base: 10, md: 16 }} position="relative" zIndex="1">
        {/* Brand header */}
        <HStack mb={6} justify="center" gap={3}>
          <Box
            p="10px"
            borderRadius="14px"
            bg="rgba(124, 58, 237, 0.14)"
            border={`1px solid rgba(124, 58, 237, 0.25)`}
            boxShadow="0 0 0 1px rgba(34, 211, 238, 0.06) inset"
          >
            <LineChart size={18} color={T.text0} />
          </Box>
          <Stack gap={0} lineHeight="1.05" textAlign="left">
            <Text fontWeight="900" letterSpacing="-0.6px">
              Portfolio Tracker
            </Text>
            <Text fontSize="12px" color={T.text2} fontWeight="700">
              Create your account
            </Text>
          </Stack>
        </HStack>

        {/* Card shell */}
        <Box
          borderRadius="28px"
          p="1px"
          bg={`linear-gradient(135deg, rgba(34,211,238,0.25), rgba(124,58,237,0.25), rgba(234,240,255,0.06))`}
          boxShadow={T.shadow}
        >
          <Box
            borderRadius="27px"
            bg={`linear-gradient(180deg, ${T.bg2}, ${T.bg1})`}
            border={`1px solid ${T.stroke}`}
            backdropFilter="blur(12px)"
            p={{ base: 6, md: 8 }}
          >
            <Stack gap={6}>
              <HStack justify="space-between" align="start">
                <Stack gap={1}>
                  <Heading size="md" letterSpacing="-0.6px">
                    Create account
                  </Heading>
                  <Text color={T.text2} fontSize="sm">
                    Set a strong password and you&apos;re in.
                  </Text>
                </Stack>

                <Circle
                  size="38px"
                  bg="rgba(234,240,255,0.06)"
                  border={`1px solid ${T.stroke}`}
                >
                  <UserPlus size={16} color={T.text1} />
                </Circle>
              </HStack>

              {error && (
                <Alert.Root
                  status="error"
                  variant="subtle"
                  borderRadius="16px"
                  bg="rgba(251, 113, 133, 0.12)"
                  border={`1px solid rgba(251, 113, 133, 0.22)`}
                  color={T.text0}
                >
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title style={{ color: T.danger }}>{error}</Alert.Title>
                  </Alert.Content>
                </Alert.Root>
              )}

              <form onSubmit={onSubmit}>
                <Stack gap={4}>
                  <Field.Root>
                    <Field.Label color={T.text2}>Email</Field.Label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="email@example.com"
                      bg="rgba(5, 8, 22, 0.45)"
                      borderColor={T.stroke}
                      _hover={{ borderColor: T.stroke2 }}
                      _focusVisible={{
                        borderColor: "rgba(34,211,238,0.55)",
                        boxShadow: "0 0 0 3px rgba(34,211,238,0.18)",
                      }}
                      _placeholder={{ color: "rgba(234,240,255,0.38)" }}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label color={T.text2}>Password</Field.Label>
                    <Input
                      value={pw1}
                      onChange={(e) => setPw1(e.target.value)}
                      type="password"
                      bg="rgba(5, 8, 22, 0.45)"
                      borderColor={T.stroke}
                      _hover={{ borderColor: T.stroke2 }}
                      _focusVisible={{
                        borderColor: "rgba(124,58,237,0.65)",
                        boxShadow: "0 0 0 3px rgba(124,58,237,0.18)",
                      }}
                      _placeholder={{ color: "rgba(234,240,255,0.38)" }}
                    />

                    {/* password requirements */}
                    <Box
                      mt={3}
                      p={4}
                      borderRadius="16px"
                      bg="rgba(5, 8, 22, 0.42)"
                      border={`1px solid ${T.stroke}`}
                    >
                      <HStack mb={2} gap={2} color={T.text1}>
                        <ShieldCheck size={16} />
                        <Text fontSize="xs" fontWeight="900" letterSpacing="0.12em">
                          PASSWORD REQUIREMENTS
                        </Text>
                      </HStack>

                      <List.Root gap="1" variant="marker" fontSize="xs" color={T.text2} ps={5}>
                        <List.Item>Minimum 8 characters long</List.Item>
                        <List.Item>At least one uppercase letter (A-Z)</List.Item>
                        <List.Item>At least one number (0-9)</List.Item>
                        <List.Item>At least one special character (!@#$%^&*)</List.Item>
                      </List.Root>
                    </Box>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label color={T.text2}>Confirm Password</Field.Label>
                    <Input
                      value={pw2}
                      onChange={(e) => setPw2(e.target.value)}
                      type="password"
                      bg="rgba(5, 8, 22, 0.45)"
                      borderColor={T.stroke}
                      _hover={{ borderColor: T.stroke2 }}
                      _focusVisible={{
                        borderColor: "rgba(34,211,238,0.55)",
                        boxShadow: "0 0 0 3px rgba(34,211,238,0.18)",
                      }}
                      _placeholder={{ color: "rgba(234,240,255,0.38)" }}
                    />
                  </Field.Root>

                  <Button
                    type="submit"
                    loading={busy}
                    width="full"
                    borderRadius="16px"
                    bg={`linear-gradient(90deg, ${T.brand1}, ${T.brand0})`}
                    color="#071126"
                    _hover={{ filter: "brightness(1.05)", transform: "translateY(-1px)" }}
                    _active={{ transform: "translateY(0px)" }}
                    rightIcon={<ArrowRight size={16} />}
                    mt={1}
                  >
                    Register
                  </Button>

                  <Text textAlign="center" fontSize="sm" color={T.text2}>
                    Already have an account?{" "}
                    <Link
                      asChild
                      fontWeight="800"
                      color="rgba(34,211,238,0.95)"
                      _hover={{ textDecoration: "none", filter: "brightness(1.08)" }}
                    >
                      <RouterLink to="/login">Sign in</RouterLink>
                    </Link>
                  </Text>
                </Stack>
              </form>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
