import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, Center, Spinner } from "@chakra-ui/react";
import { getMe } from "../api/userApi";

export default function ProtectedRoute({ children }) {
  const [state, setState] = useState({ loading: true, authed: false });
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    async function run() {
      const { res } = await getMe();
      if (!mounted) return;

      if (res.ok) setState({ loading: false, authed: true });
      else setState({ loading: false, authed: false });
    }

    run();

    return () => {
      mounted = false;
    };
  }, []);

  if (state.loading) {
    return (
      <Center minH="100vh">
        <Box>
          <Spinner size="lg" />
        </Box>
      </Center>
    );
  }

  if (!state.authed) {
    return <Navigate to="/register" replace state={{ from: location.pathname }} />;
  }

  return children;
}
