import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Flex, HStack, Button, Tabs, Text, Menu, } from "@chakra-ui/react";
import { ChevronDown, LogOut, Settings as SettingsIcon } from "lucide-react";
import { logout } from "../../api/authApi";
import { loadSettings, saveSettings } from "../../state/settingStore";
import { useColorMode } from "../ui/color-mode";
import SettingsDialog from "../settings/SettingsDialog.jsx";

const tabs = [
  { label: "Main", path: "/dashboard" },
  { label: "Learning", path: "/learning" },
  { label: "Assets", path: "/assets" },
  { label: "Income", path: "/income" },
];

function indexFromPath(pathname) {
  const idx = tabs.findIndex((t) => t.path === pathname);
  return idx === -1 ? "0" : idx.toString();
}

export default function TopNav() {
  const location = useLocation();
  const nav = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();
  const activeTabValue = indexFromPath(location.pathname);
  // Local settings cache
  const [settings, setSettings] = useState(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  async function onLogout() {
    await logout();
    window.location.href = "/login";
  }

  return (
    <Box bg="bg.panel" borderBottomWidth="1px" position="sticky" top="0" zIndex="docked">
      <Flex
        align="center"
        justify="space-between"
        maxW="6xl"
        mx="auto"
        px={6}
        py={2}
        gap={4}
      >
        <HStack gap={3}>
          <Text fontWeight="bold" fontSize="lg" letterSpacing="tight">
            Financial Portfolio Tracker
          </Text>
        </HStack>

        <Tabs.Root
          value={activeTabValue}
          onValueChange={(details) => nav(tabs[parseInt(details.value, 10)].path)}
          variant="line"
        >
          <Tabs.List>
            {tabs.map((t, index) => (
              <Tabs.Trigger key={t.path} value={index.toString()}>
                {t.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs.Root>

        <HStack gap={3}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
          >
            <SettingsIcon size={16} />
            <Text ml={2}>Settings</Text>
          </Button>

          <Menu.Root>
            <Menu.Trigger asChild>
              <Button variant="ghost" size="sm">
                <Text>Account</Text>
                <ChevronDown size={14} />
              </Button>
            </Menu.Trigger>

            <Menu.Content minW="200px">
              <Menu.Item
                value="logout"
                color="fg.error"
                onClick={onLogout}
              >
                <LogOut size={14} />
                Logout
              </Menu.Item>
            </Menu.Content>
          </Menu.Root>
        </HStack>
      </Flex>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onUpdated={(serverSettings) => {
          const baseCurrency = serverSettings.currency || settings.baseCurrency;

          const found = currencyOptions.find((o) => o.baseCurrency === baseCurrency);
          setSettings({
            baseCurrency,
            currencySymbol: found?.currencySymbol || settings.currencySymbol,
          });

          if (serverSettings.theme && serverSettings.theme !== colorMode) {
            toggleColorMode(); k
          }
        }}
      />
    </Box>
  );
}
