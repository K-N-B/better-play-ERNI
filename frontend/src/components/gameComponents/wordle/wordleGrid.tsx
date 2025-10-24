//A "dumb" component. It just takes the array of guesses and the current guess as props and renders the 6x5 grid, coloring the tiles based on their status (correct, present, absent).
// --- Helper logic for coloring the grid ---
type GuessStatus = "correct" | "present" | "absent" | "pending" | "typing";

const getGuessStatus = (guess: string, solution: string): GuessStatus[] => {
  const statuses: GuessStatus[] = Array(5).fill("absent");
  const solChars = solution.split("");

  // 1st pass: find 'correct' (green)
  for (let i = 0; i < 5; i++) {
    if (guess[i] === solChars[i]) {
      statuses[i] = "correct";
      solChars[i] = " "; // Mark as used
    }
  }
  // 2nd pass: find 'present' (yellow)
  for (let i = 0; i < 5; i++) {
    if (statuses[i] !== "correct" && solChars.includes(guess[i])) {
      statuses[i] = "present";
      solChars[solChars.indexOf(guess[i])] = " "; // Mark as used
    }
  }
  return statuses;
};

// --- TailwindCSS color map ---
const statusColors: Record<GuessStatus, string> = {
  correct: "bg-emerald-500 border-emerald-500 text-white",
  present: "bg-yellow-400 border-yellow-400 text-white",
  absent: "bg-gray-600 border-gray-600 text-white",
  pending: "bg-white border-gray-300",
  typing: "bg-white border-gray-500 scale-105",
};

// --- Component Props ---
interface WordleGridProps {
  guesses: string[];
  currentGuess: string;
  solution: string;
  currentRow: number;
  maxGuesses: number;
}

export const WordleGrid = ({
  guesses,
  currentGuess,
  solution,
  currentRow,
  maxGuesses,
}: WordleGridProps) => {
  const rows = Array(maxGuesses).fill(null);
  return (
    <div
      className={`grid grid-rows-${maxGuesses} gap-1.5 w-full max-w-sm mx-auto mb-4`}
    >
      {rows.map((_, rowIndex) => {
        const guess = guesses[rowIndex];
        const isCurrentRow = rowIndex === currentRow;
        const statuses = guess ? getGuessStatus(guess, solution) : [];

        return (
          <div key={rowIndex} className="grid grid-cols-5 gap-1.5">
            {Array(5)
              .fill(null)
              .map((_, colIndex) => {
                const char = isCurrentRow
                  ? currentGuess[colIndex]
                  : guess?.[colIndex];
                const status = guess
                  ? statuses[colIndex]
                  : isCurrentRow && char
                  ? "typing"
                  : "pending";

                return (
                  <div
                    key={colIndex}
                    className={`flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 
                            border-2 text-3xl font-bold uppercase 
                            transition-all duration-150 ${statusColors[status]}`}
                  >
                    {char}
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
};
