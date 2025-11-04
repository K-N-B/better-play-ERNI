// The heart of your app's routing.

// What you need to do:
// Wrap the entire app in your <AuthProvider>.
// Set up BrowserRouter and Routes.
// Define all your routes (e.g., /, /login, /game/:gameType).
// Wrap all authenticated pages inside the <Layout> component and the <ProtectedRoute> component.

import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/authContext";
import LoginPage from "./pages/loginPage";
import AuthCallback from "./pages/AuthCallback";
import { HomePage } from "./pages/homePage";
import { LeaderboardPage } from "./pages/leaderboardPage";
import { ProtectedRoute } from "./components/ui/protectedRoute";
import { Layout } from "./components/layout/layout";
import { GamePage } from "./pages/gamePage";
import { ChallengePage } from "./pages/challengePage";
import { ShopPage } from "./pages/shopPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} /> {/* <-- ADD THIS */}
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
    </AuthProvider>
  );
}

export default App;
