import React, { useState, useEffect, useCallback } from "react";
import GameIntro from "../../components/GameIntro";
import Grid from "./components/Grid";
import Keyboard from "./components/Keyboard";
import { puzzleApi } from "../../services/api";

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

export default function Wordle() {
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState("easy");

  const startGame = () => setGameStarted(true);

  return (
    <>
      {!gameStarted ? (
        <GameIntro
          title="Wordle"
          description="Test your vocabulary and logic in our ERNI Wordle challenge!"
          howToPlay="Guess the 5-letter word. Green letters are correct and in the right place, yellow are correct but misplaced. You have 6 tries!"
          pointsInfo='Earn <span class="font-bold">100pts</span> for finishing on Easy, <span class="font-bold">200pts</span> on Hard.'
          hintInfo='Using a hint deducts <span class="font-bold">20pts</span> on Easy, <span class="font-bold">40pts</span> on Hard. Complete early for bonus points!'
          onStart={startGame}
          onDifficultyChange={setDifficulty}
          color="bg-emerald-500"
          darkColor="shadow-emerald-900"
        />
      ) : (
        <WordleGame difficulty={difficulty} />
      )}
    </>
  );
}

interface WordleGameProps {
  difficulty: string;
}

function WordleGame({ difficulty }: WordleGameProps) {
  // Puzzle & Attempt State
  const [puzzleData, setPuzzleData] = useState<any>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Game State
  const [guesses, setGuesses] = useState<string[]>(Array(MAX_GUESSES).fill(""));
  const [currentGuess, setCurrentGuess] = useState("");
  const [currentRow, setCurrentRow] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);

  // Scoring State
  const [points, setPoints] = useState(difficulty === "hard" ? 200 : 100);
  const [hintsUsed, setHintsUsed] = useState<number[]>([]);
  const [hintText, setHintText] = useState<string>("");
  const [showHintModal, setShowHintModal] = useState(false);

  // Game Result State
  const [answer, setAnswer] = useState("");
  const [finalScore, setFinalScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [streakBonus, setStreakBonus] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  // UI State
  const [message, setMessage] = useState("");
  const [activeKey, setActiveKey] = useState("");

  // Fetch puzzle on mount
  useEffect(() => {
    fetchPuzzle();
  }, [difficulty]);

  // Timer
  useEffect(() => {
    if (!isGameOver && attemptId) {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isGameOver, attemptId]);

  const fetchPuzzle = async () => {
    try {
      setLoading(true);
      const data = await puzzleApi.getDailyPuzzle('wordle', difficulty);
      setPuzzleData(data);

      // Check if already attempted
      if (data.attempt_id) {
        setAttemptId(data.attempt_id);
        setHintsUsed(data.hints_used || []);
        setPoints(data.current_score || (difficulty === "hard" ? 200 : 100));

        if (data.is_completed) {
          setIsGameOver(true);
          setAnswer(data.answer);
          setMessage(data.is_successful ? "Already completed!" : "Already attempted!");
        }
      } else {
        // Start new attempt
        const attemptData = await puzzleApi.startPuzzle(data.puzzle_id);
        setAttemptId(attemptData.attempt_id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch puzzle:', error);
      setMessage('Failed to load puzzle. Please refresh.');
      setLoading(false);
    }
  };

  const handleKeyPress = useCallback(
    async (key: string) => {
      if (isGameOver || !attemptId) return;

      setActiveKey(key);
      setTimeout(() => setActiveKey(""), 100);

      if (key === "ENTER") {
        if (currentGuess.length !== WORD_LENGTH) {
          setMessage(`Word must be ${WORD_LENGTH} letters`);
          setTimeout(() => setMessage(""), 2000);
          return;
        }

        try {
          setMessage("Checking...");
          
          // Submit guess to backend
          const result = await puzzleApi.submitGuess(attemptId, currentGuess);

          // Update guesses with feedback
          const newGuesses = [...guesses];
          newGuesses[currentRow] = currentGuess;
          setGuesses(newGuesses);

          // Check if game is over
          if (result.completed) {
            setIsGameOver(true);
            setIsWon(result.successful);
            setAnswer(result.answer);
            setFinalScore(result.final_score);
            setTimeElapsed(result.time_taken || timeElapsed);
            setStreakBonus(result.streak_bonus || 0);
            setCurrentStreak(result.current_streak || 0);

            if (result.successful) {
              setMessage(`🎉 Congratulations! You scored ${result.final_score} points!`);
            } else {
              setMessage(`Game Over! The word was ${result.answer}`);
            }
          } else {
            setCurrentRow(prev => prev + 1);
            setCurrentGuess("");
            setMessage("");
          }

        } catch (error) {
          console.error('Failed to submit guess:', error);
          setMessage('Failed to submit guess. Please try again.');
        }

      } else if (key === "BACKSPACE") {
        setCurrentGuess(prev => prev.slice(0, -1));
        setMessage("");
      } else if (currentGuess.length < WORD_LENGTH && /^[A-Z]$/.test(key)) {
        setCurrentGuess(prev => prev + key);
        setMessage("");
      }
    },
    [currentGuess, currentRow, guesses, isGameOver, attemptId, timeElapsed]
  );

  // Keyboard event listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toUpperCase();
      
      if (key === "ENTER") {
        handleKeyPress("ENTER");
      } else if (key === "BACKSPACE") {
        handleKeyPress("BACKSPACE");
      } else if (/^[A-Z]$/.test(key)) {
        handleKeyPress(key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress]);

  const handleHint = async () => {
    if (hintsUsed.length >= 3 || isGameOver || !attemptId) {
      setMessage("No hints available!");
      return;
    }

    try {
      const result = await puzzleApi.requestHint(attemptId);
      
      setHintText(result.hint);
      setHintsUsed([...hintsUsed, result.hint_number]);
      setPoints(result.current_score);
      setShowHintModal(true);

      setTimeout(() => {
        setShowHintModal(false);
      }, 5000);

    } catch (error) {
      console.error('Failed to get hint:', error);
      setMessage('Failed to get hint. Please try again.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading puzzle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full text-center grid grid-cols-2 gap-8">
      {/* Left Side - Game Board */}
      <div className="p-10 bg-white rounded-3xl flex flex-col items-center justify-center relative">
        {/* Message Banner */}
        {message && (
          <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg font-semibold text-white z-10 ${
            message.includes('🎉') ? 'bg-green-500' : 
            message.includes('Game Over') ? 'bg-red-500' : 
            'bg-blue-500'
          }`}>
            {message}
          </div>
        )}

        {/* Hint Modal */}
        {showHintModal && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 max-w-md z-10 shadow-lg">
            <p className="text-lg font-semibold text-yellow-800 mb-2">💡 Hint #{hintsUsed.length}</p>
            <p className="text-gray-700">{hintText}</p>
          </div>
        )}

        {/* Grid */}
        <div className="mb-6">
          <Grid
            guesses={guesses}
            currentGuess={currentGuess}
            currentRow={currentRow}
            solution={answer || "     "} // Hide solution until game over
          />
        </div>

        {/* Keyboard */}
        <Keyboard
          onKeyPress={handleKeyPress}
          guesses={guesses.filter(g => g !== "")}
          solution={answer || ""}
          activeKey={activeKey}
        />

        {/* Game Over Options */}
        {isGameOver && (
          <div className="mt-6 space-y-3">
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold text-gray-900">
                Final Score: {finalScore} points
              </p>
              <p className="text-gray-600">
                Time: {formatTime(timeElapsed)}
              </p>
              {streakBonus > 0 && (
                <p className="text-orange-600 font-semibold">
                  🔥 Streak Bonus: +{streakBonus} points ({currentStreak} days)
                </p>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-emerald-500 text-white rounded-full font-semibold hover:bg-emerald-600 transition shadow-lg"
            >
              Play Again Tomorrow
            </button>
          </div>
        )}
      </div>

      {/* Right Side - Info Panel */}
      <div className="flex flex-col items-center justify-center text-center space-y-6">
        <div>
          <div className="text-6xl font-bold text-gray-900">Wordle</div>
          <div className="text-gray-700 mt-2 text-2xl font-medium">
            on {difficulty} difficulty
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl p-6 shadow-md w-full max-w-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">{points}</div>
              <div className="text-sm text-gray-600">Current Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{currentRow}</div>
              <div className="text-sm text-gray-600">Attempts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{hintsUsed.length}/3</div>
              <div className="text-sm text-gray-600">Hints Used</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{formatTime(timeElapsed)}</div>
              <div className="text-sm text-gray-600">Time</div>
            </div>
          </div>
        </div>

        {/* Hint Button */}
        <button
          onClick={handleHint}
          disabled={hintsUsed.length >= 3 || isGameOver}
          className={`px-8 py-4 rounded-full text-2xl font-semibold transition shadow-lg ${
            hintsUsed.length >= 3 || isGameOver
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50'
          }`}
        >
          {hintsUsed.length >= 3 ? 'No Hints Left' : `💡 Get Hint (${3 - hintsUsed.length} left)`}
        </button>

        {/* Hint Cost Info */}
        {!isGameOver && (
          <div className="text-sm text-gray-500">
            Each hint costs {difficulty === 'easy' ? '20' : '40'} points
          </div>
        )}

        {/* Theme Info */}
        {puzzleData?.theme && (
          <div className="bg-blue-50 rounded-lg p-4 max-w-sm">
            <p className="text-sm text-gray-600 mb-1">Today's Theme:</p>
            <p className="text-lg font-semibold text-blue-700">{puzzleData.theme}</p>
          </div>
        )}

        {/* Answer (only when game over) */}
        {isGameOver && answer && (
          <div className="bg-emerald-50 rounded-lg p-4 max-w-sm">
            <p className="text-sm text-gray-600 mb-1">The word was:</p>
            <p className="text-3xl font-bold text-emerald-700">{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}