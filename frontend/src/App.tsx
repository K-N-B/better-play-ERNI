
import { Routes, Route } from "react-router-dom";


import Navbar from "./components/Navbar"; 
import Home from "./home";
import Leaderboards from "./leaderboards";
import SudokuGame from './games/sudoku';
import HangmanGame from './games/hangman';


function App() {

  return (
    <>
      <Navbar />
      <div className="min-h-screen h-full w-full bg-[#F1ECE6] absolute inset-0 bg-[linear-gradient(to_right,#D2B694_2px,transparent_1px),linear-gradient(to_bottom,#D2B694_2px,transparent_1px)] bg-[size:24px_24px]">
      <main className="w-full h-dvh mx-auto pt-20 px-6 ">
        <div className="flex h-full w-full p-8">
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
    
  )
}

export default App;
