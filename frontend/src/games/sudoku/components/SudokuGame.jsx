import React, { useState, useEffect } from "react";
import SudokuBoard from "./SudokuBoard";
import { checkSolution, copyBoard } from "../utils/sudokuGenerator";
import { fetchSudokuPuzzleByDifficulty } from "../services/sudokuApi";
import "./SudokuGame.css";
import GameIntro from "../../../components/GameIntro";

const SudokuGame = () => {
  const [gameData, setGameData] = useState(null);
  const [board, setBoard] = useState(null);
  const [difficulty, setDifficulty] = useState("easy");
  const [gameStatus, setGameStatus] = useState("selecting"); // selecting, playing, won
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [points, setPoints] = useState(0);
  const [hintsRemaining, setHintsRemaining] = useState(5);

  const [gameStarted, setGameStarted] = useState(false);
  const startGame = () => setGameStarted(true);

  // Player data - will be replaced with actual logged in user data
  const [player, setPlayer] = useState({
    name: "John Doe",
    accumulatedPoints: 0,
  });

  // Track completed games per day
  const [completedToday, setCompletedToday] = useState({
    easy: false,
    hard: false,
  });

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const startNewGame = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSudokuPuzzleByDifficulty(difficulty);
      setGameData({ puzzle: copyBoard(data.puzzle), solution: data.solution });
      setBoard(copyBoard(data.puzzle));
      setGameStatus("playing");
      setTimer(0);
      setIsRunning(true);
    } catch (err) {
      setError("Failed to load puzzle. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCellChange = (row, col, value) => {
    if (gameStatus === "won" || gameStatus === "solved") return;

    const newBoard = copyBoard(board);
    newBoard[row][col] = value;
    setBoard(newBoard);

    // Check if puzzle is complete
    const isComplete = newBoard.every((row) => row.every((cell) => cell !== 0));
    if (isComplete && checkSolution(newBoard, gameData.solution)) {
      setGameStatus("won");
      setIsRunning(false);

      // Add current points to accumulated points
      setPlayer((prev) => ({
        ...prev,
        accumulatedPoints: prev.accumulatedPoints + points,
      }));

      // Mark this difficulty as completed today
      setCompletedToday((prev) => ({
        ...prev,
        [difficulty]: true,
      }));
    }
  };

  const handleStartGame = async (selectedDifficulty) => {
    // Check if this difficulty has already been completed today
    if (completedToday[selectedDifficulty]) {
      setError(
        `You have already completed the ${selectedDifficulty} puzzle today. Try again tomorrow!`
      );
      return;
    }

    setDifficulty(selectedDifficulty);
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSudokuPuzzleByDifficulty(selectedDifficulty);
      setGameData({ puzzle: copyBoard(data.puzzle), solution: data.solution });
      setBoard(copyBoard(data.puzzle));
      setGameStatus("playing");
      setTimer(0);
      setIsRunning(true);
      // Set initial points based on difficulty
      setPoints(selectedDifficulty === "easy" ? 100 : 200);
      setHintsRemaining(5);
    } catch (err) {
      setError("Failed to load puzzle. Please try again.");
      console.error(err);
      setGameStatus("selecting");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewGame = () => {
    setGameStatus("selecting");
    setIsRunning(false);
  };

  const handleReset = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSudokuPuzzleByDifficulty(difficulty);
      setGameData({ puzzle: copyBoard(data.puzzle), solution: data.solution });
      setBoard(copyBoard(data.puzzle));
      setGameStatus("playing");
      setTimer(0);
      setIsRunning(true);
      // Reset points based on difficulty
      setPoints(difficulty === "easy" ? 100 : 200);
      setHintsRemaining(5);
    } catch (err) {
      setError("Failed to load puzzle. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHint = () => {
    if (gameStatus === "won" || gameStatus === "solved" || hintsRemaining <= 0)
      return;

    // Find all empty cells
    const emptyCells = [];
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }

    // If there are empty cells, pick a random one
    if (emptyCells.length > 0) {
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      const { row, col } = emptyCells[randomIndex];
      const newBoard = copyBoard(board);
      newBoard[row][col] = gameData.solution[row][col];
      setBoard(newBoard);

      // Deduct points based on difficulty
      const pointDeduction = difficulty === "easy" ? 10 : 20;
      setPoints((prevPoints) => Math.max(0, prevPoints - pointDeduction));

      // Decrease hints remaining
      setHintsRemaining((prev) => prev - 1);
    }
  };

  const handleSolve = () => {
    if (gameStatus === "won" || gameStatus === "solved") return;

    // Set the board to the solution
    setBoard(copyBoard(gameData.solution));
    setGameStatus("solved"); // Changed from 'won' to 'solved'
    setIsRunning(false);

    // Forfeit points - set to 0 and don't add to accumulated points
    setPoints(0);

    // Mark this difficulty as completed today (but with no points earned)
    setCompletedToday((prev) => ({
      ...prev,
      [difficulty]: true,
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Difficulty selection screen
  if (gameStatus === "selecting") {
    return (
      <div>
        <GameIntro
          title="Sudoku"
          description="Time to test your logic with the Daily Sudoku! No math required, just pure logic and deduction"
          howToPlay="The goal is to fill the 9x9 grid with numbers from 1 to 9. Each row, column, and 3x3 square must contain the numbers 1 through 9, with no repeats. <br /> <br /> Find the right place for every number!"
          pointsInfo='You will earn <span class="font-bold">100pts</span> for finishing this puzzle, x2 for finishing Hard difficulty.'
          hintInfo='Using a hint will deduct <span class="font-bold">20pts</span>. You will get additional points for completing it early.'
          onStart={startGame}
          onDifficultyChange={setDifficulty}
          color="bg-[#C7337A]"
          darkColor="shadow-sky-900"
        />
        <div className="sudoku-game grid grid-cols-1 md:grid-cols-2 place-items-center h-full gap-15">
          <div>
            <div className="game-header text-sm md:text-xl">
              <h1>Sudoku Game</h1>
            </div>

            <div className="player-info gap-5 mb-5">
              <h3>Player: {player.name}</h3>
              <p className="accumulated-points">
                Total Points: {player.accumulatedPoints}
              </p>
            </div>

            <div className="difficulty-selection">
              <h2 className="py-5 md:py-10 text-center">Select Difficulty</h2>
              {error && <div className="error-message">{error}</div>}
              <div className="difficulty-buttons">
                <button
                  onClick={() => handleStartGame("easy")}
                  className={`btn btn-difficulty ${
                    completedToday.easy ? "completed" : ""
                  }`}
                  disabled={isLoading || completedToday.easy}
                >
                  Easy
                  {completedToday.easy && (
                    <span className="completed-badge">✓ Completed</span>
                  )}
                </button>
                <button
                  onClick={() => handleStartGame("hard")}
                  className={`btn btn-difficulty ${
                    completedToday.hard ? "completed" : ""
                  }`}
                  disabled={isLoading || completedToday.hard}
                >
                  Hard
                  {completedToday.hard && (
                    <span className="completed-badge">✓ Completed</span>
                  )}
                </button>
              </div>
              <div
                className={`${
                  isLoading ? "hidden md:visible" : "hidden md:invisible"
                } loading`}
              >
                Loading puzzle...
              </div>
            </div>
          </div>
          <div>
            <div className="game-instructions">
              <h3>How to Play:</h3>
              <ul>
                <li>Fill the 9×9 grid with numbers 1-9</li>
                <li>Each row must contain all digits 1-9</li>
                <li>Each column must contain all digits 1-9</li>
                <li>Each 3×3 box must contain all digits 1-9</li>
                <li>Click a cell to select it and type a number</li>
                <li>Invalid entries will be highlighted in red</li>
                <li>Each difficulty can only be completed once per day</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!board || !gameData) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="sudoku-game grid grid-cols-1 md:grid-cols-2 place-items-center h-full p-5">
      <div className="order-1 md:order-2">
        <div className="game-header flex flex-col items-center justify-center">
          <div>
            <h1>Sudoku Game</h1>
          </div>

          <div className="player-info-inline flex flex-col">
            <div className="flex gap-10">
              <span>
                Player: <strong>{player.name}</strong>
              </span>
              <span>
                Difficulty:{" "}
                <strong>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </strong>
              </span>
            </div>
            <div>
              <span className="total-points">
                Total Points: <strong>{player.accumulatedPoints}</strong>
              </span>
            </div>
          </div>
          <div className="game-stats">
            <div className="timer">Time: {formatTime(timer)}</div>
            <div className="points">Points: {points}</div>
          </div>
        </div>

        <div className="game-controls">
          <div className="button-group flex justify-center gap-3">
            <div className="flex gap-3">
              <button
                onClick={handleNewGame}
                className="btn btn-primary"
                disabled={isLoading}
              >
                New Game
              </button>
              <button
                onClick={handleReset}
                className="btn btn-secondary"
                disabled={isLoading}
              >
                Reset
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleHint}
                className="btn btn-hint"
                disabled={isLoading || hintsRemaining <= 0}
              >
                Hint ({hintsRemaining})
              </button>
              <button
                onClick={handleSolve}
                className="btn btn-solve"
                disabled={isLoading}
              >
                Solve
              </button>
            </div>
          </div>
        </div>

        {gameStatus === "won" ? (
          <div className="win-message">
            🎉 Congratulations! You solved the puzzle in {formatTime(timer)}!
            <div className="points-earned">+{points} points earned!</div>
          </div>
        ) : gameStatus === "solved" ? (
          <div className="solved-message">
            Puzzle solved. Better luck next time!
            <div className="points-forfeited">Points forfeited</div>
          </div>
        ) : (
          // invisible placeholder to prevent sudden layout jump
          <div className="hidden md:invisible">placeholder</div>
        )}
      </div>
      <div className="order-2 md:order-1">
        <SudokuBoard
          board={board}
          initialBoard={gameData.puzzle}
          onCellChange={handleCellChange}
          solution={gameData.solution}
        />
      </div>
    </div>
  );
};

export default SudokuGame;
