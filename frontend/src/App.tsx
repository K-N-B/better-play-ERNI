// src/App.tsx - WITH CHALLENGE PROVIDER

import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/authContext";
import { ChallengeProvider } from "./context/ChallengeContext"; // ✅ NEW
import LoginPage from "./pages/loginPage";
import AuthCallback from "./pages/AuthCallback";
import { HomePage } from "./pages/homePage";
import { LeaderboardPage } from "./pages/leaderboardPage";
import { ProtectedRoute } from "./components/ui/protectedRoute";
import { Layout } from "./components/layout/layout";
import { GamePage } from "./pages/gamePage";
import { ChallengePage } from "./pages/challengePage";
import { ShopPage } from "./pages/shopPage";
import { useEffect } from "react";
import { initializeCSRF } from "./api/authService";

function App() {
  useEffect(() => {
    const setupCSRF = async () => {
      try {
        await initializeCSRF();
        console.log("[App] CSRF token initialized");
      } catch (error) {
        console.error("[App] Failed to initialize CSRF token:", error);
      }
    };

    setupCSRF();
  }, []); // Empty dependency array = runs once on mount
  return (
    <AuthProvider>
      {/* ✅ WRAP WITH CHALLENGE PROVIDER AFTER AUTH PROVIDER */}
      <ChallengeProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth-callback" element={<AuthCallback />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/leaderboards" element={<LeaderboardPage />} />
              <Route path="/game/:gameType" element={<GamePage />} />
              <Route path="/challenges" element={<ChallengePage />} />
              <Route path="/shop" element={<ShopPage />} />
            </Route>
          </Route>
        </Routes>
      </ChallengeProvider>
    </AuthProvider>
  );
}

export default App;
