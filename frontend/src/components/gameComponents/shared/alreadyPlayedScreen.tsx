// src/components/gameComponents/shared/alreadyPlayedScreen.tsx
// COMPLETE FILE WITH DIFFICULTY FIX

import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Difficulty } from "../../../pages/gamePage";

interface AlreadyPlayedScreenProps {
  gameType: "wordle" | "sudoku" | "ernigram";
  score: number;
  submittedAt: string;
  difficulty: Difficulty;
}

export const AlreadyPlayedScreen = ({
  gameType,
  score,
  submittedAt,
  difficulty,
}: AlreadyPlayedScreenProps) => {
  const navigate = useNavigate();

  // ✅ FIXED: Properly format difficulty for display
  const displayDifficulty = (difficulty || "easy").toUpperCase();

  const gameColors = {
    wordle: "bg-emerald-100 border-emerald-300 text-emerald-800",
    sudoku: "bg-pink-100 border-pink-300 text-pink-800",
    ernigram: "bg-sky-100 border-sky-300 text-sky-800",
  };

  const gameTitles = {
    wordle: "Wordle",
    sudoku: "Sudoku",
    ernigram: "ERNIgram",
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="flex items-center justify-center min-h-[600px] p-8">
      <div
        className={`max-w-lg w-full p-12 rounded-3xl border-2 ${gameColors[gameType]} text-center`}
      >
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <CheckCircle size={80} className="text-green-500" strokeWidth={2} />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold mb-4">Already Completed!</h1>

        {/* Message */}
        <p className="text-lg mb-6">
          You've already completed today's{" "}
          <strong>{gameTitles[gameType]}</strong> puzzle on{" "}
          <strong>{displayDifficulty}</strong> difficulty.
        </p>

        {/* Score Display */}
        <div className="bg-white/50 rounded-xl p-6 mb-6">
          <p className="text-sm text-gray-600 mb-2">Your Score</p>
          <p className="text-5xl font-bold">{score}</p>
          <p className="text-sm text-gray-500 mt-2">points</p>
        </div>

        {/* Submission Time */}
        <p className="text-sm text-gray-600 mb-8">
          Completed on {formatDate(submittedAt)}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 px-6 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
          >
            Back to Home
          </button>
          <button
            onClick={() => navigate("/leaderboards")}
            className="w-full py-3 px-6 bg-white text-gray-800 font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition"
          >
            View Leaderboards
          </button>
        </div>

        {/* Fun Message */}
        <p className="text-sm text-gray-600 mt-6">
          Come back tomorrow for a new puzzle! 🎉
        </p>
      </div>
    </div>
  );
};
