import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SudokuBoard from './SudokuBoard';
import { checkSolution, copyBoard } from '../utils/sudokuGenerator';
import { fetchSudokuPuzzleByDifficulty } from '../services/sudokuApi';
import './SudokuGame.css';

const STORAGE_KEY = 'sudokuGameState';

const SudokuGame = () => {
  const [gameData, setGameData] = useState(null);
  const [board, setBoard] = useState(null);
  const [difficulty, setDifficulty] = useState('easy');
  const [gameStatus, setGameStatus] = useState('selecting'); // selecting, playing, won
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [points, setPoints] = useState(0);
  const [hintsRemaining, setHintsRemaining] = useState(5);

  // Player data - will be replaced with actual logged in user data
  const [player, setPlayer] = useState({
    name: 'John Doe',
    accumulatedPoints: 0
  });

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Track completed games per day
  const [completedToday, setCompletedToday] = useState({
    easy: false,
    hard: false
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      setHasHydrated(true);
      return;
    }

    const storedState = window.localStorage.getItem(STORAGE_KEY);
    if (!storedState) {
      setHasHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(storedState);
      if (!parsed || parsed.date !== todayKey) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      if (parsed.gameData) {
        setGameData({
          puzzle: parsed.gameData.puzzle?.map(row => [...row]) ?? null,
          solution: parsed.gameData.solution?.map(row => [...row]) ?? null
        });
      }

      if (Array.isArray(parsed.board)) {
        setBoard(parsed.board.map(row => [...row]));
      }

      if (parsed.difficulty) {
        setDifficulty(parsed.difficulty);
      }

      if (parsed.gameStatus) {
        setGameStatus(parsed.gameStatus);
      }

      if (typeof parsed.timer === 'number') {
        setTimer(parsed.timer);
      }

      if (typeof parsed.isRunning === 'boolean') {
        setIsRunning(parsed.isRunning && parsed.gameStatus === 'playing');
      }

      if (typeof parsed.points === 'number') {
        setPoints(parsed.points);
      }

      if (typeof parsed.hintsRemaining === 'number') {
        setHintsRemaining(parsed.hintsRemaining);
      }

      if (parsed.completedToday) {
        setCompletedToday(parsed.completedToday);
      }

      if (parsed.player) {
        setPlayer(prev => ({
          ...prev,
          ...parsed.player
        }));
      }
    } catch (error) {
      console.error('Failed to restore Sudoku state:', error);
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHasHydrated(true);
    }
  }, [todayKey]);

  useEffect(() => {
    if (!hasHydrated || typeof window === 'undefined') {
      return;
    }

    const stateToStore = {
      date: todayKey,
      gameData: gameData
        ? {
            puzzle: gameData.puzzle,
            solution: gameData.solution
          }
        : null,
      board,
      difficulty,
      gameStatus,
      timer,
      isRunning,
      points,
      hintsRemaining,
      completedToday,
      player
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToStore));
    } catch (error) {
      console.error('Failed to persist Sudoku state:', error);
    }
  }, [
    todayKey,
    gameData,
    board,
    difficulty,
    gameStatus,
    timer,
    isRunning,
    points,
    hintsRemaining,
    completedToday,
    player,
    hasHydrated
  ]);

  const handleCellChange = (row, col, value) => {
    if (gameStatus === 'won' || gameStatus === 'solved') return;

    const newBoard = copyBoard(board);
    newBoard[row][col] = value;
    setBoard(newBoard);

    // Check if puzzle is complete
    const isComplete = newBoard.every(row => row.every(cell => cell !== 0));
    if (isComplete && checkSolution(newBoard, gameData.solution)) {
      setGameStatus('won');
      setIsRunning(false);

      // Add current points to accumulated points
      setPlayer(prev => ({
        ...prev,
        accumulatedPoints: prev.accumulatedPoints + points
      }));

      // Mark today's puzzle as completed for both difficulties
      setCompletedToday({
        easy: true,
        hard: true
      });
    }
  };

  const handleStartGame = async (selectedDifficulty) => {
    // Check if this difficulty has already been completed today
    if (completedToday.easy || completedToday.hard) {
      setError('You have already completed today\'s puzzle. Try again tomorrow!');
      return;
    }

    setDifficulty(selectedDifficulty);
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSudokuPuzzleByDifficulty(selectedDifficulty);
      setGameData({ puzzle: copyBoard(data.puzzle), solution: data.solution });
      setBoard(copyBoard(data.puzzle));
      setGameStatus('playing');
      setTimer(0);
      setIsRunning(true);
      // Set initial points based on difficulty
      setPoints(selectedDifficulty === 'easy' ? 100 : 200);
      setHintsRemaining(5);
    } catch (err) {
      setError('Failed to load puzzle. Please try again.');
      console.error(err);
      setGameStatus('selecting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewGame = () => {
    setGameStatus('selecting');
    setIsRunning(false);
    setGameData(null);
    setBoard(null);
    setDifficulty('easy');
    setTimer(0);
    setPoints(0);
    setHintsRemaining(5);
    setCompletedToday({
      easy: false,
      hard: false
    });
    setError(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const forfeitPuzzle = useCallback(() => {
    if (gameData?.solution) {
      setBoard(copyBoard(gameData.solution));
    }
    setGameStatus('solved');
    setIsRunning(false);
    setPoints(0);
    setCompletedToday({
      easy: true,
      hard: true
    });
  }, [gameData]);

  useEffect(() => {
    if (gameStatus === 'playing' && timer >= 300) {
      forfeitPuzzle();
    }
  }, [timer, gameStatus, forfeitPuzzle]);

  const handleHint = () => {
    if (gameStatus === 'won' || gameStatus === 'solved' || hintsRemaining <= 0) return;

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
      const pointDeduction = difficulty === 'easy' ? 10 : 20;
      setPoints(prevPoints => Math.max(0, prevPoints - pointDeduction));

      // Decrease hints remaining
      setHintsRemaining(prev => prev - 1);
    }
  };

  const handleSolve = () => {
    if (gameStatus === 'won' || gameStatus === 'solved') return;
    forfeitPuzzle();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Difficulty selection screen
  if (gameStatus === 'selecting') {
    return (
      <div className="sudoku-game">
        <div className="game-header">
          <h1>Sudoku Game</h1>
        </div>

        <div className="player-info">
          <h3>Player: {player.name}</h3>
          <p className="accumulated-points">Total Points: {player.accumulatedPoints}</p>
        </div>

        <div className="difficulty-selection">
          <h2>Select Difficulty</h2>
          {error && <div className="error-message">{error}</div>}
          <div className="difficulty-buttons">
            <button
              onClick={() => handleStartGame('easy')}
              className={`btn btn-difficulty ${completedToday.easy ? 'completed' : ''}`}
              disabled={isLoading || completedToday.easy}
            >
              Easy
              {completedToday.easy && <span className="completed-badge">✓ Completed</span>}
            </button>
            <button
              onClick={() => handleStartGame('hard')}
              className={`btn btn-difficulty ${completedToday.hard ? 'completed' : ''}`}
              disabled={isLoading || completedToday.hard}
            >
              Hard
              {completedToday.hard && <span className="completed-badge">✓ Completed</span>}
            </button>
          </div>
          {isLoading && <div className="loading">Loading puzzle...</div>}
        </div>

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
    );
  }

  if (!board || !gameData) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="sudoku-game">
      <div className="game-header">
        <h1>Sudoku Game</h1>
        <div className="player-info-inline">
          <span>Player: <strong>{player.name}</strong></span>
          <span>Difficulty: <strong>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</strong></span>
          <span className="total-points">Total Points: <strong>{player.accumulatedPoints}</strong></span>
        </div>
        <div className="game-stats">
          <div className="timer">Time: {formatTime(timer)}</div>
          <div className="points">Points: {points}</div>
        </div>
      </div>

      <div className="game-controls">
        <div className="button-group">
          <button onClick={handleNewGame} className="btn btn-primary" disabled={isLoading}>
            New Game (For Debug Only)
          </button>
          <button onClick={handleHint} className="btn btn-hint" disabled={isLoading || hintsRemaining <= 0}>
            Hint -{difficulty === 'hard' ? 20 : 10} ({hintsRemaining})
          </button>
          <button onClick={handleSolve} className="btn btn-solve" disabled={isLoading}>
            Solve
          </button>
        </div>
      </div>

      {gameStatus === 'won' && (
        <div className="win-message">
          🎉 Congratulations! You solved the puzzle in {formatTime(timer)}!
          <div className="points-earned">+{points} points earned!</div>
        </div>
      )}

      {gameStatus === 'solved' && (
        <div className="solved-message">
          Puzzle solved. Better luck next time!
          <div className="points-forfeited">Points forfeited</div>
        </div>
      )}

      <SudokuBoard
        board={board}
        initialBoard={gameData.puzzle}
        onCellChange={handleCellChange}
        solution={gameData.solution}
      />
    </div>
  );
};

export default SudokuGame;
