import { useEffect, useState } from "react";
import { 
  Button, Dialog, HStack, Input, NativeSelect, 
  Stack, Text, Alert, Separator, 
} from "@chakra-ui/react";
import Card from "../ui/Card.jsx";
import { getMySettings, updateMySettings } from "../../api/settingsApi.js";
import { changePassword } from "../../api/passwordApi.js";
import { LogOut } from "lucide-react";

export default function SettingsDialog({ open, onOpenChange, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [theme, setTheme] = useState("dark");
  const [currency, setCurrency] = useState("EUR");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    async function load() {
      setError("");
      setLoading(true);
      const { res, data } = await getMySettings();
      if (!mounted) return;
      setLoading(false);

      if (!res.ok) {
        setError(data?.error || "Failed to load settings.");
        return;
      }

      // Ensure this matches your backend response mapping (emailLower -> email)
      setEmail(data?.email || "");
      setTheme(data?.settings?.theme || "dark");
      setCurrency(data?.settings?.currency || "EUR");
    }
    load();
    return () => { mounted = false; };
  }, [open]);

  // --- LOGOUT LOGIC ---
  const handleLogout = () => {
    // Clear your storage (Token/Session)
    localStorage.removeItem("token"); 
    // Redirect to login page
    window.location.href = "/login";
  };

  async function onSaveSettings() {
    setError("");
    setSaving(true);
    const { res, data } = await updateMySettings({ theme, currency });
    setSaving(false);
    if (!res.ok) {
      setError(data?.error || "Failed to save settings.");
      return;
    }
    onUpdated?.(data.settings);
    onOpenChange(false);
  }

  async function onChangePassword() {
    setError("");
    setChangingPw(true);
    const { res, data } = await changePassword({ currentPassword, newPassword });
    setChangingPw(false);
    if (!res.ok) {
      setError(data?.error || "Failed to change password.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
  }

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content p={0} borderRadius="lg" maxW="520px" w="100%">
          <Card p={6}>
            <HStack justify="space-between" mb={2}>
              <Dialog.Title>
                <Text fontWeight="semibold">Settings</Text>
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <Button variant="ghost" size="sm">Close</Button>
              </Dialog.CloseTrigger>
            </HStack>

            <Text fontSize="sm" color="fg.muted" mb={4}>
              Account: {email || "—"}
            </Text>

            {error ? (
              <Alert.Root status="error" variant="subtle" mb={4}>
                <Alert.Indicator />
                <Alert.Title>{error}</Alert.Title>
              </Alert.Root>
            ) : null}

            <Stack gap={4}>
              {/* Theme & Currency Fields stay here */}
              <Stack gap={2}>
                <Text fontSize="sm" fontWeight="medium">Theme</Text>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    disabled={loading}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Stack>

              <Stack gap={2}>
                <Text fontSize="sm" fontWeight="medium">Currency</Text>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    disabled={loading}
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Stack>

              <Separator />

              {/* Password Fields */}
              <Stack gap={2}>
                <Text fontSize="sm" fontWeight="medium">Change Password</Text>
                <Input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="New password (min 8 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onChangePassword}
                  loading={changingPw}
                  disabled={!currentPassword || newPassword.length < 8}
                >
                  Update Password
                </Button>
              </Stack>

              <Separator />

              <Stack gap={2} align="center">
                <Text fontSize="sm" fontWeight="medium" color="red.500">
                  Danger Zone
                </Text>
                  <Button
                    variant="ghost"
                    colorPalette="red"
                    onClick={handleLogout}
                    size="sm"
                  > 
                  <LogOut size={14} />
                    Log Out
                  </Button>
              </Stack>

              <HStack justify="flex-end" pt={2}>
                <Button
                  onClick={onSaveSettings}
                  loading={saving}
                  disabled={loading}
                >
                  Save Changes
                </Button>
              </HStack>
            </Stack>
          </Card>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}