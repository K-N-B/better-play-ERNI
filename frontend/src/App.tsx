import { Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import AuthCallback from "./components/AuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout"; // Layout includes Navbar

import Home from "./home";
import Leaderboards from "./leaderboards";
import SudokuGame from "./games/sudoku";
import HangmanGame from "./games/hangman";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected routes wrapped with Layout (Navbar + content) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboards"
        element={
          <ProtectedRoute>
            <Layout>
              <Leaderboards />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sudoku"
        element={
          <ProtectedRoute>
            <Layout>
              <SudokuGame />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hangman"
        element={
          <ProtectedRoute>
            <Layout>
              <HangmanGame />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;