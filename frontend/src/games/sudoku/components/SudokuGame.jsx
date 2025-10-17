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
  const [gameStatus, setGameStatus] = useState("playing"); // playing, won, solved
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [points, setPoints] = useState(
    difficulty === "hard" ? HARD_START_POINTS : EASY_START_POINTS
  );
  const [hintsRemaining, setHintsRemaining] = useState(MAX_HINTS);
  const [player, setPlayer] = useState({
    name: "John Doe",
    accumulatedPoints: 0,
  });

  // Timer
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Fetch new puzzle on start
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
        setPlayer((p) => ({
          ...p,
          accumulatedPoints: p.accumulatedPoints + points,
        }));
      }
    },
    [board, gameData, gameStatus, points]
  );

  const handleHint = () => {
    if (gameStatus !== "playing" || hintsRemaining <= 0) return;

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
    setTimer(0);
    setHintsRemaining(MAX_HINTS);
    setPoints(difficulty === "hard" ? HARD_START_POINTS : EASY_START_POINTS);
    setGameStatus("playing");
    setIsRunning(true);
    setBoard(copyBoard(gameData.puzzle));
  };

  if (isLoading || !board || !gameData) {
    return <div className="loading">Loading Sudoku...</div>;
  }

  return (
    <div className="h-full grid grid-cols-1 md:grid-cols-2 place-items-center p-6">
      {/* LEFT: Board */}
      <div className="order-2 md:order-1">
        <SudokuBoard
          board={board}
          initialBoard={gameData.puzzle}
          onCellChange={handleCellChange}
          solution={gameData.solution}
        />
      </div>

      {/* RIGHT: Controls and Stats */}
      <div className="order-1 md:order-2 flex flex-col items-center text-center gap-4">
        <h1 className="text-4xl font-bold text-[#C7337A]">Sudoku</h1>
        <div className="text-sm text-gray-600">
          Difficulty: <strong>{difficulty}</strong>
        </div>
        <div className="text-base">Time: {formatTime(timer)}</div>
        <div className="font-semibold">Points: {points}</div>

        <div className="flex flex-wrap justify-center gap-3 mt-4">
          <button onClick={resetGame} className="btn btn-primary">
            Reset
          </button>
          <button
            onClick={handleHint}
            disabled={hintsRemaining <= 0 || gameStatus !== "playing"}
            className="btn btn-hint"
          >
            Hint ({hintsRemaining})
          </button>
          <button onClick={handleSolve} className="btn btn-solve">
            Solve
          </button>
        </div>

        {gameStatus === "won" && (
          <div className="mt-4 text-green-600 font-semibold">
            🎉 You solved it in {formatTime(timer)}! +{points} pts
          </div>
        )}

        {gameStatus === "solved" && (
          <div className="mt-4 text-red-500 font-semibold">
            Puzzle auto-solved — no points earned.
          </div>
        )}
      </div>
    </div>
  );
}
