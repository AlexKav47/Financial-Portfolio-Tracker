import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {Box, Button, Container, Field, Heading, Input, Stack, Text, Alert, Link, List, } from "@chakra-ui/react";
import { register } from "../api/authApi";

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  
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
    } catch (err) {
      setBusy(false);
      setError("An unexpected error occurred.");
    }
  }

  return (
    <Container maxW="md" py={12}>
      <Box borderWidth="1px" borderRadius="lg" p={8}>
        <Stack gap={6}>
          <Heading size="md">Create account</Heading>

          {error && (
            <Alert.Root status="error" variant="subtle">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{error}</Alert.Title>
              </Alert.Content>
            </Alert.Root>
          )}

          <form onSubmit={onSubmit}>
            <Stack gap={4}>
              <Field.Root>
                <Field.Label>Email</Field.Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              </Field.Root>

              <Field.Root>
                <Field.Label>Password</Field.Label>
                <Input value={pw1} onChange={(e) => setPw1(e.target.value)} type="password" />
                
                <Box display="grid" placeItems="center" width="full">
                <Box mt={2} p={3} bg="gray.50" borderRadius="md" borderWidth="1px" >
                  <Text fontSize="xs" fontWeight="bold" mb={1} color="gray.600">
                    PASSWORD REQUIREMENTS:
                  </Text>
                  <List.Root gap="1" variant="marker" fontSize="xs" color="gray.600" ps={5}>
                    <List.Item>Minimum 8 characters long</List.Item>
                    <List.Item>At least one uppercase letter (A-Z)</List.Item>
                    <List.Item>At least one number (0-9)</List.Item>
                    <List.Item>At least one special character (!@#$%^&*)</List.Item>
                  </List.Root>
                </Box>
                </Box>
              </Field.Root>

              <Field.Root>
                <Field.Label>Confirm Password</Field.Label>
                <Input value={pw2} onChange={(e) => setPw2(e.target.value)} type="password" />
              </Field.Root>

              <Button type="submit" loading={busy} width="full" mt={2}>
                Register
              </Button>

              <Text textAlign="center" fontSize="sm">
                Already have an account?{" "}
                <Link asChild color="blue.500" fontWeight="medium">
                  <RouterLink to="/login">Sign in</RouterLink>
                </Link>
              </Text>
            </Stack>
          </form>
        </Stack>
      </Box>
    </Container>
  );
}