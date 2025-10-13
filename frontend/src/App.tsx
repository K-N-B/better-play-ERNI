
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar"; 
import Home from "./home";
import Leaderboards from "./leaderboards";
import SudokuGame from './games/sudoku';
import HangmanGame from './games/hangman';
import WordleGame from './games/wordle';


function App() {

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/leaderboards" element={<Leaderboards />} />
        <Route path="/sudoku" element={<SudokuGame />} />
        <Route path="/hangman" element={<HangmanGame />} />
        <Route path="/wordle" element={<WordleGame />} />
      </Routes>
    </>
    
  )
}

export default App;
