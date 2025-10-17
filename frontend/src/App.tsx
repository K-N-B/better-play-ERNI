import { Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import AuthCallback from "./components/AuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout"; // Layout includes Navbar
import Home from "./pages/home";
import Leaderboards from "./pages/leaderboards";
import SudokuGame from "./games/sudoku";
import ErnigramGame from "./games/ernigram";
import WordleGame from "./games/wordle";
import UnderConstruction from "./components/UnderConstruction";

function App() {
  return (
    <>
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
          path="/wordle"
          element={
            <ProtectedRoute>
              <Layout>
                <WordleGame />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ernigram"
          element={
            <ProtectedRoute>
              <Layout>
                <ErnigramGame />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/crossword"
          element={
            <Layout>
              <UnderConstruction
                title="Crossword"
                bg="bg-amber-200"
                text="text-amber-900"
              />
            </Layout>
          }
        />
        <Route
          path="/connections"
          element={
            <ProtectedRoute>
              <Layout>
                <UnderConstruction
                  title="Connections"
                  bg="bg-purple-300"
                  text="text-purple-900"
                />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
