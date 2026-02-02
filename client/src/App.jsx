import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Learning from "./pages/Learning.jsx";
import Income from "./pages/Income.jsx";
import Assets from "./pages/Assets.jsx";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
  path="/learning"
  element={
    <ProtectedRoute>
      <Learning />
    </ProtectedRoute>
  }
/>

<Route
  path="/assets"
  element={
    <ProtectedRoute>
      <Assets />
    </ProtectedRoute>
  }
/>

<Route
  path="/income"
  element={
    <ProtectedRoute>
      <Income />
    </ProtectedRoute>
  }
/>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

