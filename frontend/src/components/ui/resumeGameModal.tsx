// src/components/ui/resumeGameModal.tsx

interface ResumeGameModalProps {
  guessCount: number;
  maxGuesses: number;
  puzzleDate: string;
  puzzleNumber: number;
  editor?: string;
  onContinue: () => void;
}

export const ResumeGameModal = ({
  guessCount,
  maxGuesses,
  puzzleDate,
  puzzleNumber,
  editor = "ERNI Team",
  onContinue,
}: ResumeGameModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-300">
        {/* Welcome Back Header */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome Back
        </h1>
        
        {/* Progress Message */}
        <p className="text-xl text-gray-700 mb-8 leading-relaxed">
          {guessCount > 0 ? (
            <>
              You've made <strong className="text-emerald-600">{guessCount}</strong> of{' '}
              <strong>{maxGuesses}</strong> guesses. Keep it up!
            </>
          ) : (
            <>
              You started this puzzle earlier.
              <br />
              <strong className="text-emerald-600">Ready to continue?</strong>
            </>
          )}
        </p>
        
        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full bg-black text-white font-semibold text-lg py-4 px-8 rounded-full hover:bg-gray-800 transition-colors mb-8"
        >
          Continue
        </button>
        
        {/* Puzzle Info */}
        <div className="text-sm text-gray-600 space-y-1">
          <p className="font-medium">
            {new Date(puzzleDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
          <p>No. {puzzleNumber}</p>
          <p>Edited by {editor}</p>
        </div>
      </div>
    </div>
  );
};