//Takes remainingAttempts as a prop and displays it (e.g., "Guesses left: 5/6").

interface AttemptsTrackerProps {
  attemptsLeft: number;
}

export const AttemptsTracker = ({ attemptsLeft }: AttemptsTrackerProps) => {
  return (
    <div className="mb-4">
      <p className="text-lg text-gray-700">
        Guesses Left:{' '}
        <span className="font-bold text-xl text-red-600">{attemptsLeft}</span>
      </p>
      {/* You could add a visual hangman SVG here */}
    </div>
  );
};
