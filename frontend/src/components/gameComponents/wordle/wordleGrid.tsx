import clsx from "clsx";

// --- Helper logic (Unchanged) ---
type GuessStatus = "correct" | "present" | "absent" | "pending" | "typing";

const getGuessStatus = (
  guess: string,
  solution: string,
  wordLength: number
): GuessStatus[] => {
  const statuses: GuessStatus[] = Array(wordLength).fill("absent");
  const solChars = solution.split("");

  for (let i = 0; i < wordLength; i++) {
    if (guess[i] === solChars[i]) {
      statuses[i] = "correct";
      solChars[i] = " ";
    }
  }
  for (let i = 0; i < wordLength; i++) {
    if (statuses[i] !== "correct" && solChars.includes(guess[i])) {
      statuses[i] = "present";
      solChars[solChars.indexOf(guess[i])] = " ";
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
  typing: "bg-white border-gray-500 ring-2 ring-gray-400", // Changed scale to ring to avoid layout shift
};

interface WordleGridProps {
  guesses: string[];
  currentGuess: string;
  solution: string;
  currentRow: number;
  maxGuesses: number;
  wordLength: number;
}

export const WordleGrid = ({
  guesses,
  currentGuess,
  solution,
  currentRow,
  maxGuesses,
  wordLength,
}: WordleGridProps) => {
  const rows = Array(maxGuesses).fill(null);

  return (
    // Outer Container:
    // 1. Fits width but prevents becoming too huge (max-w-md).
    // 2. Padding ensures it doesn't touch screen edges on mobile.
    <div className="w-full max-w-[350px] md:max-w-[450px] mx-auto p-2">
      <div className="grid gap-1.5 md:gap-2 w-full">
        {rows.map((_, rowIndex) => {
          const guess = guesses[rowIndex];
          const isCurrentRow = rowIndex === currentRow;
          const statuses = guess
            ? getGuessStatus(guess, solution, wordLength)
            : [];

          return (
            <div
              key={rowIndex}
              className="grid gap-1.5 md:gap-2"
              style={{
                // DYNAMIC COLUMNS: Creates exactly 'wordLength' columns of equal width
                gridTemplateColumns: `repeat(${wordLength}, minmax(0, 1fr))`,
              }}
            >
              {Array(wordLength)
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
                    // CELL CONTAINER
                    // 'aspect-square' is the magic class. It forces height to match width.
                    // This allows the grid to shrink/grow based solely on width.
                    <div
                      key={colIndex}
                      className={clsx(
                        "aspect-square flex items-center justify-center border-2 font-bold uppercase select-none transition-colors duration-200",
                        statusColors[status],
                        // DYNAMIC FONT SIZING
                        // If word is long (8+), use smaller text.
                        // Otherwise, use larger text.
                        wordLength >= 8
                          ? "text-xl md:text-2xl"
                          : "text-2xl md:text-4xl"
                      )}
                    >
                      {char}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
};