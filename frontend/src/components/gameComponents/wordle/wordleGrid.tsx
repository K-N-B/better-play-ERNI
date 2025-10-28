//A "dumb" component. It just takes the array of guesses and the current guess as props and renders the 6x5 grid, coloring the tiles based on their status (correct, present, absent).
import clsx from 'clsx';

// --- Helper logic for coloring the grid ---
type GuessStatus = 'correct' | 'present' | 'absent' | 'pending' | 'typing';

const getGuessStatus = (guess: string, solution: string, wordLength: number): GuessStatus[] => {
  const statuses: GuessStatus[] = Array(wordLength).fill('absent');
  const solChars = solution.split('');

  // 1st pass: find 'correct'
  for (let i = 0; i < wordLength; i++) {
    if (guess[i] === solChars[i]) {
      statuses[i] = 'correct';
      solChars[i] = ' ';
    }
  }
  // 2nd pass: find 'present'
  for (let i = 0; i < wordLength; i++) {
    if (statuses[i] !== 'correct' && solChars.includes(guess[i])) {
      statuses[i] = 'present';
      solChars[solChars.indexOf(guess[i])] = ' ';
    }
  }
  return statuses;
};
// ---

// --- TailwindCSS color map ---
const statusColors: Record<GuessStatus, string> = {
  correct: 'bg-emerald-500 border-emerald-500 text-white',
  present: 'bg-yellow-400 border-yellow-400 text-white',
  absent: 'bg-gray-600 border-gray-600 text-white',
  pending: 'bg-white border-gray-300',
  typing: 'bg-white border-gray-500 scale-105',
};

// --- Component Props ---
interface WordleGridProps {
  guesses: string[];
  currentGuess: string;
  solution: string;
  currentRow: number;
  maxGuesses: number;
  wordLength: number; // <-- Add prop
}

export const WordleGrid = ({ guesses, currentGuess, solution, currentRow, maxGuesses, wordLength }: WordleGridProps) => {
  const rows = Array(maxGuesses).fill(null);

  // --- UPDATED: Dynamic grid columns and cell size ---
  // Adjust cell size based on length
  const cellSizeClass =
    wordLength > 8 ? 'h-10 w-10 sm:h-12 sm:w-12 text-xl' :
    wordLength > 6 ? 'h-12 w-12 sm:h-14 sm:w-14 text-2xl' :
    'h-14 w-14 sm:h-16 sm:w-16 text-3xl';
  
  // Need to use inline style for dynamic grid-cols if length > 12
  const gridColsClass = `grid-cols-${wordLength}`; // e.g., grid-cols-5, grid-cols-6
  // ---
  return (
    <div className={clsx(`grid gap-1.5 w-full max-w-sm mx-auto mb-4`, `grid-rows-${maxGuesses}`)}>
      {rows.map((_, rowIndex) => {
        const guess = guesses[rowIndex];
        const isCurrentRow = rowIndex === currentRow;
        const statuses = guess ? getGuessStatus(guess, solution, wordLength) : []; // Pass length

        return (
          // --- UPDATED: Dynamic grid columns ---
          <div key={rowIndex} className={clsx("grid gap-1.5", gridColsClass)}>
            {Array(wordLength).fill(null).map((_, colIndex) => { // Use dynamic length
              const char = isCurrentRow ? currentGuess[colIndex] : guess?.[colIndex];
              const status = guess ? statuses[colIndex] : isCurrentRow && char ? 'typing' : 'pending';

              return (
                <div
                  key={colIndex}
                  className={clsx(
                      "flex items-center justify-center border-2 font-bold uppercase transition-all duration-150",
                      cellSizeClass, // Apply dynamic cell size
                      statusColors[status]
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
  );
};