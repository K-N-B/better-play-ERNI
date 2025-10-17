
import {
  puzzle,
  sudoku,
  wordle,
  ernigram,
  crossword,
  connections,
} from "../assets/icons/icons";
import GameButton from "../components/GameButton";

const games = [
  {
    title: "Games",
    subtitle: "Choose your poison for today or experience all of them!",
    color: "bg-slate-50 text-black shadow-slate-50",
    icon: puzzle,
  },
  {
    title: "Sudoku",
    subtitle: "Sharpen your logic — fill the grid without repeating numbers.",
    color: "bg-pink-400 text-slate-50 shadow-[0_5px_0_0] shadow-pink-800",
    icon: sudoku,
  },
  {
    title: "Wordle",
    subtitle: "Guess the hidden word in six tries or less.",
    color: "bg-emerald-500 text-slate-50 shadow-emerald-900",
    icon: wordle,
  },
  {
    title: "ERNIgram",
    subtitle: "Save the stickman — reveal the word before time runs out.",
    color: "bg-sky-500 text-slate-50 shadow-[0_5px_0_0] shadow-sky-800",
    icon: ernigram,
  },
  {
    title: "Crossword",
    subtitle: "Test your vocabulary and wit by solving the daily word clues.",
    color: "bg-amber-500 text-slate-50 shadow-amber-800",
    icon: crossword,
  },
  {
    title: "Connections",
    subtitle: "Group words into four hidden categories and find the link.",
    color: "bg-purple-500 text-slate-50 shadow-purple-900",
    icon: connections,
  },
];

export default function Home() {
  return (
    // <div className="min-h-screen h-full w-full bg-[#F1ECE6] absolute inset-0 bg-[linear-gradient(to_right,#D2B694_2px,transparent_1px),linear-gradient(to_bottom,#D2B694_2px,transparent_1px)] bg-[size:24px_24px]">
    //   <main className="w-full h-dvh mx-auto pt-20 px-6 ">
        <div className="flex h-full gap-8 ">
          {/* Left leaderboard column */}
          <aside className="w-1/4 h-full bg-slate-50 rounded-2xl p-6 shadow-md sticky self-start">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Leaderboards</h2>
              <button className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">
                All-time
              </button>
            </div>

            <ol className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <li key={n} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 text-base font-semibold text-sky-600">
                      {n}
                    </div>
                    <div className="text-base">
                      {n === 1 ? "Jerome Barba" : "ERNI Employee"}
                    </div>
                  </div>
                  <div className="text-base text-slate-500">
                    {1827 - n * 20} pts
                  </div>
                </li>
              ))}
            </ol>
          </aside>

          {/* Center content: cards grid */}
          <section className="flex-1 h-full">
            <div className="bg-slate-50 rounded-3xl p-6 shadow-md h-full">
              <div className="grid h-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {games.map((g) => (
                  <GameButton key={g.title} title={g.title} subtitle={g.subtitle} color={g.color} icon={g.icon} />
                ))}
              </div>
            </div>
          </section>
        </div>
    //   </main>
    // </div>
  );
}
