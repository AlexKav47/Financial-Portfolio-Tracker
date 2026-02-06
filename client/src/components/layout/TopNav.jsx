import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Flex, HStack, Button, Tabs, Text, Menu, } from "@chakra-ui/react";
import { ChevronDown, LogOut, Settings as SettingsIcon } from "lucide-react";
import { logout } from "../../api/authApi";
import { loadSettings, saveSettings } from "../../state/settingStore";
import { useColorMode } from "../ui/color-mode";
import SettingsDialog from "../settings/SettingsDialog.jsx";

const currencyOptions = [
  { baseCurrency: "USD", currencySymbol: "$" },
  { baseCurrency: "EUR", currencySymbol: "€" },
  { baseCurrency: "GBP", currencySymbol: "£" },
];

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
  const { colorMode, setColorMode } = useColorMode();
  const activeTabValue = indexFromPath(location.pathname);
  
  const [settings, setSettings] = useState(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  async function onLogout() {
    await logout();
    window.location.href = "/";
  }

  return (
    <Flex
      as="nav"
      bg="bg.panel"
      borderBottomWidth="1px"
      borderColor="border.subtle"
      position="sticky"
      top="0"
      zIndex="docked"
      backdropFilter="blur(12px)"
      px={6} 
      height="64px" 
      align="center"
      justify="space-between" 
    >
      {/* Left Section Branding */}
      <HStack gap={3} flexShrink={0}>
        <Text fontWeight="bold" fontSize="lg" letterSpacing="tight">
          Financial Portfolio Tracker
        </Text>
      </HStack>

      {/* Center Section Navigation Tabs */}
      <Box flex="1" display="flex" justify="center">
        <Tabs.Root
          value={activeTabValue}
          onValueChange={(details) => nav(tabs[parseInt(details.value, 10)].path)}
          variant="line"
          fitted={false} // Ensures tabs take only the space they need
        >
          <Tabs.List borderBottom="none"> 
            {tabs.map((t, index) => (
              <Tabs.Trigger key={t.path} value={index.toString()} py={4}>
                {t.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs.Root>
      </Box>

      {/* Right Section Actions */}
      <HStack gap={4} flexShrink={0}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSettingsOpen(true)}
          _hover={{ bg: "bg.muted" }}
        >
          <SettingsIcon size={16} />
          <Text ml={2} display={{ base: "none", md: "inline" }}>Settings</Text>
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
            setColorMode(serverSettings.theme);
          }
        }}
      />
    </Flex>
  );
}