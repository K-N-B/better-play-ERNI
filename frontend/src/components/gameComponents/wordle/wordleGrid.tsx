// WordleGrid component - now uses validated statuses from backend
type GuessStatus = 'correct' | 'present' | 'absent' | 'pending' | 'typing';

const statusColors: Record<GuessStatus, string> = {
  correct: 'bg-emerald-500 border-emerald-500 text-white',
  present: 'bg-yellow-400 border-yellow-400 text-white',
  absent: 'bg-gray-600 border-gray-600 text-white',
  pending: 'bg-white border-gray-300',
  typing: 'bg-white border-gray-500 scale-105',
};

interface WordleGridProps {
  guesses: string[];
  currentGuess: string;
  guessStatuses: Array<Array<'correct' | 'present' | 'absent'>>; // NEW: Validated statuses from backend
  currentRow: number;
  maxGuesses: number;
}

export const WordleGrid = ({ 
  guesses, 
  currentGuess, 
  guessStatuses,
  currentRow, 
  maxGuesses 
}: WordleGridProps) => {
  const rows = Array(maxGuesses).fill(null);
  
  return (
    <div className={`grid gap-1.5 w-full max-w-sm mx-auto mb-4`} style={{ gridTemplateRows: `repeat(${maxGuesses}, minmax(0, 1fr))` }}>
      {rows.map((_, rowIndex) => {
        const guess = guesses[rowIndex];
        const isCurrentRow = rowIndex === currentRow;
        const statuses = guessStatuses[rowIndex] || [];

        return (
          <div key={rowIndex} className="grid grid-cols-5 gap-1.5">
            {Array(5).fill(null).map((_, colIndex) => {
              const char = isCurrentRow ? currentGuess[colIndex] : guess?.[colIndex];
              
              // Determine status
              let status: GuessStatus;
              if (guess && statuses[colIndex]) {
                // Validated guess - use backend status
                status = statuses[colIndex];
              } else if (isCurrentRow && char) {
                // Current guess being typed
                status = 'typing';
              } else {
                // Empty cell
                status = 'pending';
              }

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