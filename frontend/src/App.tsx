import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./home";
import Leaderboards from "./leaderboards";
import SudokuGame from "./games/sudoku";
import HangmanGame from "./games/hangman";

function App() {
  return (
    <>
      <div className="flex flex-col h-dvh w-dvw bg-[#F1ECE6]  bg-[linear-gradient(to_right,#D2B694_2px,transparent_1px),linear-gradient(to_bottom,#D2B694_2px,transparent_1px)] bg-[size:24px_24px]">
        <Navbar />
        <main className="md:h-full md:w-full md:overflow-hidden">
          <div className="h-full w-full p-5 md:p-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/leaderboards" element={<Leaderboards />} />
              <Route path="/sudoku" element={<SudokuGame />} />
              <Route path="/hangman" element={<HangmanGame />} />
            </Routes>
          </div>
        </main>
      </div>
    </>
  );
}

export default App;
