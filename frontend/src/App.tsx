
import { Routes, Route } from "react-router-dom";


import Navbar from "./components/Navbar"; 
import Home from "./home";
import SudokuGame from './games/sudoku';
import HangmanGame from './games/hangman';


function App() {

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sudoku" element={<SudokuGame />} />
        <Route path="/hangman" element={<HangmanGame />} />
      </Routes>
    </>
    
  )
}

export default App;
