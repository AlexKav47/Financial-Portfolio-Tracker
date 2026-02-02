import { useState } from "react";
import { useLocation, useNavigate, Link as RouterLink } from "react-router-dom";
import { Box, Button, Container, Field, Heading, Input, Stack, Alert, Text, Link, } from "@chakra-ui/react";
import { login } from "../api/authApi";

export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !pw) return setError("Email and password are required.");

    setBusy(true);
    const { res, data } = await login(email, pw);
    setBusy(false);

    if (!res.ok) {
      setError(data?.error || "Login failed.");
      return;
    }

    nav(from, { replace: true });
  }

  return (
    <Container maxW="md" py={12}>
      <Box borderWidth="1px" borderRadius="lg" p={8}>
        <Stack gap={6}> 
          <Heading size="md">Login</Heading>

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
                <Input 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  type="email" 
                  placeholder="email@example.com"
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Password</Field.Label>
                <Input 
                  value={pw} 
                  onChange={(e) => setPw(e.target.value)} 
                  type="password" 
                />
              </Field.Root>

              <Button type="submit" loading={busy} width="full">
                Login
              </Button>

              <Text textAlign="center" fontSize="sm">
                Don't have an account?{" "}
                <Link asChild color="blue.500" fontWeight="medium">
                  <RouterLink to="/register">Register</RouterLink>
                </Link>
              </Text>
            </Stack>
          </form>
        </Stack>
      </Box>
    </Container>
  );
}