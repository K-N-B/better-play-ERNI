import Navbar from "./components/Navbar";
import { puzzle, sudoku, wordle, hangman, crossword, connections } from "./assets/icons/icons";

const games = [
  { title: "Games", subtitle: "Choose your poison for today or experience all of them!", color: "bg-slate-50 text-black shadow-slate-50", icon: puzzle},
  { title: "Sudoku", subtitle: "Sharpen your logic — fill the grid without repeating numbers.", color: "bg-sky-400 text-slate-50 shadow-sky-800", icon: sudoku},
  { title: "Wordle", subtitle: "Guess the hidden word in six tries or less.", color: "bg-emerald-500 text-slate-50 shadow-emerald-900", icon: wordle },
  { title: "Hangman", subtitle: "Save the stickman — reveal the word before time runs out.", color: "bg-pink-400 text-slate-50 shadow-pink-800", icon: hangman },
  { title: "Crossword", subtitle: "Test your vocabulary and wit by solving the daily word clues.", color: "bg-yellow-400 text-slate-50 shadow-yellow-800", icon: crossword },
  { title: "Connections", subtitle: "Group words into four hidden categories and find the link.", color: "bg-purple-500 text-slate-50 shadow-purple-900", icon: connections },
];


export default function Home() {
  return (

      <div className="min-h-screen h-full w-full bg-[#F1ECE6] absolute inset-0 bg-[linear-gradient(to_right,#D2B694_2px,transparent_1px),linear-gradient(to_bottom,#D2B694_2px,transparent_1px)] bg-[size:24px_24px]">
      <main className="w-full h-dvh mx-auto pt-20 px-6 ">
        
      </main>
    </div>
  );
}
