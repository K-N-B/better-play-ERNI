// src/components/ui/resumeGameScreen.tsx

interface ResumeGameScreenProps {
  gameType: 'wordle' | 'sudoku' | 'ernigram'; // ✅ ADD THIS PROP
  guessCount: number;
  maxGuesses: number;
  puzzleDate: string;
  puzzleNumber: number;
  onContinue: () => void;
  difficulty: string;
}

export const ResumeGameScreen = ({
  gameType,
  guessCount,
  maxGuesses,
  puzzleDate,
  puzzleNumber,
  onContinue,
  difficulty,
}: ResumeGameScreenProps) => {
  const gameColors = {
    wordle: {
      primary: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      buttonHover: 'hover:bg-emerald-600',
      buttonBg: 'bg-emerald-500',
    },
    sudoku: {
      primary: 'text-pink-600',
      bg: 'bg-pink-50',
      border: 'border-pink-200',
      buttonHover: 'hover:bg-pink-600',
      buttonBg: 'bg-pink-500',
    },
    ernigram: {
      primary: 'text-sky-600',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      buttonHover: 'hover:bg-sky-600',
      buttonBg: 'bg-sky-500',
    },
  };

  const colors = gameColors[gameType];
  return (
    // This outer div mimics the layout of AlreadyPlayedScreen
    <div className="flex items-center justify-center min-h-[500px] p-8">
      {/* ✅ APPLY DYNAMIC CLASSES HERE */}
      <div
        className={`bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border-2 ${colors.border} ${colors.bg}`}
      >
        {/* Welcome Back Header */}
        <h1 className={`text-4xl font-bold mb-4 ${colors.primary}`}>
          Welcome Back
        </h1>

        {/* Progress Message */}
        <p className="text-xl text-black mb-8 leading-relaxed">
          {guessCount > 0 ? (
            <>
              You've made{' '}
              <strong className={colors.primary}>{guessCount}</strong> of{' '}
              <strong>{maxGuesses}</strong> guesses on{' '}
              <strong className="text-black">{difficulty}</strong> difficulty.
              Keep it up!
            </>
          ) : (
            <>
              You started this puzzle earlier.
              <br />
              <strong className={colors.primary}>Ready to continue?</strong>
            </>
          )}
        </p>

        {/* Continue Button */}
        {/* ✅ APPLY DYNAMIC CLASSES HERE */}
        <button
          onClick={onContinue}
          className={`w-full text-white font-semibold text-lg py-4 px-8 rounded-full transition-colors mb-4 ${colors.buttonBg} ${colors.buttonHover}`}
        >
          Continue
        </button>

        {/* Puzzle Info */}
        <div className="text-base text-gray-600 space-y-1">
          <p className="font-medium">
            {new Date(puzzleDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          {/* ✅ APPLY DYNAMIC CLASS HERE */}
          {/* <p className={`font-semibold capitalize ${colors.primary}`}>{difficulty} Mode</p>
                    <p>No. {puzzleNumber}</p> */}
        </div>
      </div>
    </div>
  );
};
