import Navbar from "./components/Navbar";
import { puzzle, sudoku, wordle, hangman, crossword, connections } from "./assets/icons/icons";

const games = [
  { title: "Games", subtitle: "Choose your poison for today or experience all of them!", color: "bg-slate-50 text-black shadow-slate-50", icon: puzzle },
  { title: "Sudoku", subtitle: "Sharpen your logic — fill the grid without repeating numbers.", color: "bg-sky-400 text-slate-50 shadow-sky-800", icon: sudoku },
  { title: "Wordle", subtitle: "Guess the hidden word in six tries or less.", color: "bg-emerald-500 text-slate-50 shadow-emerald-900", icon: wordle },
  { title: "Hangman", subtitle: "Save the stickman — reveal the word before time runs out.", color: "bg-pink-400 text-slate-50 shadow-pink-800", icon: hangman },
  { title: "Crossword", subtitle: "Test your vocabulary and wit by solving the daily word clues.", color: "bg-yellow-400 text-slate-50 shadow-yellow-800", icon: crossword },
  { title: "Connections", subtitle: "Group words into four hidden categories and find the link.", color: "bg-purple-500 text-slate-50 shadow-purple-900", icon: connections },
];


export default function Home() {
  return (
    <div className="grid grid-cols-2 h-full gap-8">
      <div className="bg-slate-50 rounded-3xl p-6 shadow-md">
        <h2 className="text-xl font-bold">Leaderboards</h2>
        <div className="flex relative w-[169px] h-[236px] justify-center">
          
          {/* Second SVG serves as the base (lower z) */}
          <svg className="absolute z-10 w-full h-auto" xmlns="http://www.w3.org/2000/svg" width="169" height="236" viewBox="0 0 169 236" fill="none">
            <g filter="url(#filter0_d_28_606)">
              <path d="M0.118652 5.29646e-05H168.882V182.37C168.882 186.74 166.406 190.734 162.49 192.677L89.6162 228.847C86.3931 230.447 82.6073 230.447 79.3843 228.847L6.51001 192.677C2.59489 190.734 0.118652 186.74 0.118652 182.37V5.29646e-05Z" fill="#FFC200" />
            </g>
            <defs>
              <filter id="filter0_d_28_606" x="0.118652" y="6.10352e-05" width="168.763" height="235.8" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                <feFlood flood-opacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="5.75365" />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.65098 0 0 0 0 0.366667 0 0 0 0 0.0823529 0 0 0 1 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_28_606" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_28_606" result="shape" />
              </filter>
            </defs>
          </svg>

          {/* Circle */}
          <div className="absolute z-30 rounded-full w-10 h-10 bg-[#A65D15] top-8 left-8"></div>
          <div className="absolute z-20 rounded-full w-20 h-20 bg-white top-10"></div>

          {/* First SVG drawn on top */}
          <div className="absolute bottom-7 z-20 w-full h-auto">
            <svg className="" xmlns="http://www.w3.org/2000/svg" width="169" height="51" viewBox="0 0 169 51" fill="none">
              <path d="M-3.90869 4.46594L1.0779 10.3198C2.15197 11.5806 3.48557 12.5948 4.98758 13.2929L79.6561 47.998C82.6759 49.4016 86.1558 49.4281 89.1967 48.0707L163.79 14.7749C166.221 13.6896 168.201 11.7947 169.392 9.41315L173.304 1.58911" stroke="#F1ECE6" stroke-width="2.87682" stroke-linecap="round" />
            </svg>
          </div>
        </div>
      </div>
      <div className="bg-slate-50 rounded-3xl p-6 shadow-md">
        <h2 className="text-xl font-bold">All-time Leaderboards</h2>
      </div>
      
      
    </div>
   
  );
}
