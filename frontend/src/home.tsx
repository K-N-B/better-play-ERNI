import Navbar from "./components/Navbar";

const games = [
  { title: "Games", subtitle: "Choose your poison for today or experience all of them!", color: "bg-white text-black shadow-white", },
  { title: "Sudoku", subtitle: "Sharpen your logic — fill the grid without repeating numbers.", color: "bg-sky-400 text-white shadow-sky-800" },
  { title: "Wordle", subtitle: "Guess the hidden word in six tries or less.", color: "bg-emerald-500 text-white shadow-emerald-900" },
  { title: "Hangman", subtitle: "Save the stickman — reveal the word before time runs out.", color: "bg-pink-400 text-white shadow-pink-800" },
  { title: "Crossword", subtitle: "Test your vocabulary and wit by solving the daily word clues.", color: "bg-yellow-400 text-white shadow-yellow-800" },
  { title: "Connections", subtitle: "Group words into four hidden categories and find the link.", color: "bg-purple-500 text-white shadow-purple-900" },
];


export default function Home() {
  return (
    <div className="min-h-screen h-full w-full bg-[#F1ECE6]">
      <Navbar />
      <main className="w-full h-dvh mx-auto pt-20 px-6">
        <div className="flex h-full gap-8 py-8">
          {/* Left leaderboard column */}
          <aside className="w-72 h-full bg-white rounded-2xl p-6 shadow-md sticky top-20 self-start">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Leaderboards</h2>
              <button className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">All-time</button>
            </div>

            <ol className="space-y-3">
              {[1,2,3,4,5,6,7,8,9,10].map((n)=> (
                <li key={n} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 text-sm font-semibold text-sky-600">{n}</div>
                    <div className="text-sm">{n===1? 'Jerome Barba' : 'ERNI Employee'}</div>
                  </div>
                  <div className="text-sm text-slate-500">{(1827 - n*20)} pts</div>
                </li>
              ))}
            </ol>
          </aside>

          {/* Center content: cards grid */}
          <section className="flex-1 h-full">
            <div className="bg-white rounded-3xl p-6 shadow-md h-full">
              <div className="grid h-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {games.map((g) => (
                  <article key={g.title} className={`rounded-2xl h-full ${g.color} shadow-[0_5px_0_0] active:shadow-[0_4px_0_0_rgba(0,0,0,0.15)] translate-y-[-2px] active:translate-y-0 p-8 h-48 flex flex-col justify-between`}>
                    <div className="flex items-start justify-between">
                      <div className="text-3xl font-extrabold">{g.title}</div>
                      
                    </div>

                    <div className="text-sm opacity-90">{g.subtitle}</div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
