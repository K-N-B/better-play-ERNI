import React, { useState, useEffect, useCallback } from "react";
import GameIntro from "../../../components/GameIntro";
import SudokuBoard from "./SudokuBoard";
import { checkSolution, copyBoard } from "../utils/sudokuGenerator";
import { fetchSudokuPuzzleByDifficulty } from "../services/sudokuApi";
import "./SudokuGame.css";

const EASY_START_POINTS = 100;
const HARD_START_POINTS = 200;
const HINT_COST = { easy: 10, hard: 20 };
const MAX_HINTS = 5;

export default function SudokuGame() {
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState("easy");

  const startGame = () => setGameStarted(true);

  return (
    <>
      {!gameStarted ? (
        <GameIntro
          title="Sudoku"
          description="Test your logic in the Daily Sudoku! No math required—just pure reasoning."
          howToPlay="Fill the 9×9 grid with numbers 1–9. Each row, column, and 3×3 square must contain all digits 1–9 without repeats."
          pointsInfo='Earn <span class="font-bold">100pts</span> for Easy and <span class="font-bold">200pts</span> for Hard.'
          hintInfo='Using a hint deducts <span class="font-bold">10–20pts</span> depending on difficulty.'
          onStart={startGame}
          onDifficultyChange={setDifficulty}
          color="bg-[#C7337A]"
          darkColor="shadow-sky-900"
        />
      ) : (
        <SudokuGameMain difficulty={difficulty} />
      )}
    </>
  );
}

function SudokuGameMain({ difficulty }) {
  const [gameData, setGameData] = useState(null);
  const [board, setBoard] = useState(null);
  const [gameStatus, setGameStatus] = useState("playing");
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [points, setPoints] = useState(
    difficulty === "hard" ? HARD_START_POINTS : EASY_START_POINTS
  );
  const [hintsRemaining, setHintsRemaining] = useState(MAX_HINTS);
  const [hintUsed, setHintUsed] = useState(false);

  // Timer
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Fetch puzzle
  useEffect(() => {
    const loadPuzzle = async () => {
      setIsLoading(true);
      try {
        const data = await fetchSudokuPuzzleByDifficulty(difficulty);
        setGameData({
          puzzle: copyBoard(data.puzzle),
          solution: data.solution,
        });
        setBoard(copyBoard(data.puzzle));
      } catch (err) {
        console.error("Failed to load puzzle", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadPuzzle();
  }, [difficulty]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleCellChange = useCallback(
    (row, col, value) => {
      if (gameStatus !== "playing") return;

      const newBoard = copyBoard(board);
      newBoard[row][col] = value;
      setBoard(newBoard);

      const isComplete = newBoard.every((r) => r.every((c) => c !== 0));
      if (isComplete && checkSolution(newBoard, gameData.solution)) {
        setGameStatus("won");
        setIsRunning(false);
        alert(`🎉 You solved it! Time: ${formatTime(timer)} — +${points} pts`);
      }
    },
    [board, gameData, gameStatus, points, timer]
  );

  const handleHint = () => {
    if (gameStatus !== "playing" || hintsRemaining <= 0 || hintUsed) return;

    const emptyCells = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) emptyCells.push({ r, c });
      }
    }

    if (emptyCells.length === 0) return;
    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newBoard = copyBoard(board);
    newBoard[r][c] = gameData.solution[r][c];
    setBoard(newBoard);
    setHintsRemaining((h) => h - 1);
    setHintUsed(true);
    setPoints((p) => Math.max(0, p - HINT_COST[difficulty]));
  };

  const handleSolve = () => {
    if (gameStatus !== "playing") return;
    setBoard(copyBoard(gameData.solution));
    setGameStatus("solved");
    setPoints(0);
    setIsRunning(false);
  };

  const resetGame = () => {
    setGameStatus("playing");
    setHintUsed(false);
    setHintsRemaining(MAX_HINTS);
    setPoints(difficulty === "hard" ? HARD_START_POINTS : EASY_START_POINTS);
    setTimer(0);
    setIsRunning(true);
    setBoard(copyBoard(gameData.puzzle));
  };

  if (isLoading || !board || !gameData) {
    return <div className="loading">Loading Sudoku...</div>;
  }

  return (
    <div className="h-full text-center grid grid-cols-2">
      {/* LEFT SIDE (Board) */}
      <div className="p-10 bg-white rounded-3xl flex flex-col items-center justify-center">
        <SudokuBoard
          board={board}
          initialBoard={gameData.puzzle}
          onCellChange={handleCellChange}
          solution={gameData.solution}
        />
      </div>

      {/* RIGHT SIDE (Stats + Controls) */}
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-6xl font-bold text-gray-900">Sudoku</div>
        <div className="text-gray-700 mt-2 text-xl font-medium">
          on {difficulty} difficulty
        </div>
        <div className="text-gray-600 mt-2 text-lg">
          Time: <span className="font-semibold">{formatTime(timer)}</span>
        </div>
        <div className="text-gray-600 mt-1 text-lg">
          Points: <span className="font-semibold">{points}</span>
        </div>

        <button
          onClick={handleHint}
          disabled={hintUsed || hintsRemaining <= 0 || gameStatus !== "playing"}
          className="mt-6 px-5 py-4 bg-white border border-[#C7337A] text-[#C7337A] rounded-full text-xl font-semibold hover:bg-[#F7E3EC] transition"
        >
          {hintUsed ? "Hint Used" : `Hint (${hintsRemaining})`}
        </button>

        <button
          onClick={handleSolve}
          disabled={gameStatus !== "playing"}
          className="mt-6 px-5 py-4 bg-white border border-[#C7337A] text-[#C7337A] rounded-full text-xl font-semibold hover:bg-[#F7E3EC] transition"
        >
          Solve
        </button>
        {gameStatus !== "playing" && (
          <button
            onClick={resetGame}
            className="mt-6 px-6 py-3 bg-[#C7337A] text-white rounded-full font-semibold hover:bg-[#9C1C5D]"
          >
            Play Again
          </button>
        )}
      </div>
    </div>
  );
}
