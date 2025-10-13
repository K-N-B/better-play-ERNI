import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Hangman.css';

const WORDS = [
  'JAVASCRIPT',
  'REACT',
  'PROGRAMMING',
  'DEVELOPER',
  'COMPUTER',
  'ALGORITHM',
  'FUNCTION',
  'VARIABLE',
  'COMPONENT',
  'DATABASE',
  'INTERFACE',
  'KEYBOARD',
  'PYTHON',
  'HANGMAN',
  'CHALLENGE'
];

const MAX_WRONG = 6;
const STORAGE_KEY = 'hangmanGameState';

const Hangman = () => {
  const [difficulty, setDifficulty] = useState(null); // null, 'easy', 'hard'
  const [word, setWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won, lost, solved
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [player] = useState({ name: 'John Doe' });
  const [totalPoints, setTotalPoints] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const guessedLettersRef = useRef(new Set());
  const isRestoringRef = useRef(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      isRestoringRef.current = false;
      return;
    }

    const savedState = window.localStorage.getItem(STORAGE_KEY);
    if (!savedState) {
      isRestoringRef.current = false;
      return;
    }

    try {
      const parsed = JSON.parse(savedState);
      if (parsed && typeof parsed === 'object') {
        if (parsed.difficulty === 'easy' || parsed.difficulty === 'hard') {
          setDifficulty(parsed.difficulty);
        }
        if (typeof parsed.word === 'string') {
          setWord(parsed.word);
        }
        if (Array.isArray(parsed.guessedLetters)) {
          setGuessedLetters(parsed.guessedLetters);
        }
        if (typeof parsed.wrongGuesses === 'number') {
          setWrongGuesses(parsed.wrongGuesses);
        }
        if (typeof parsed.gameStatus === 'string') {
          setGameStatus(parsed.gameStatus);
        }
        if (typeof parsed.score === 'number') {
          setScore(parsed.score);
        }
        if (typeof parsed.totalPoints === 'number') {
          setTotalPoints(parsed.totalPoints);
        }
        if (typeof parsed.hintUsed === 'boolean') {
          setHintUsed(parsed.hintUsed);
        }
        if (typeof parsed.timer === 'number') {
          setTimer(parsed.timer);
        }
        if (typeof parsed.isTimerRunning === 'boolean') {
          setIsTimerRunning(parsed.isTimerRunning && parsed.gameStatus === 'playing');
        } else if (parsed.gameStatus === 'playing') {
          setIsTimerRunning(true);
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to restore Hangman game state:', error);
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      isRestoringRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (word && guessedLetters.length > 0) {
      checkGameStatus();
    }
  }, [guessedLetters, wrongGuesses]);

  useEffect(() => {
    if (isRestoringRef.current || typeof window === 'undefined') {
      return;
    }

    if (difficulty === null || !word) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const stateToStore = {
      difficulty,
      word,
      guessedLetters,
      wrongGuesses,
      gameStatus,
      score,
      totalPoints,
      hintUsed,
      timer,
      isTimerRunning,
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToStore));
    } catch (error) {
      console.error('Failed to persist Hangman game state:', error);
    }
  }, [difficulty, word, guessedLetters, wrongGuesses, gameStatus, score, totalPoints, hintUsed, timer, isTimerRunning]);

  const fetchAdminWords = async () => {
    try {
      const response = await fetch('/adminWordsforHangman.txt');
      if (!response.ok) {
        console.log('Admin words file not found or not accessible');
        return [];
      }
      const text = await response.text();
      // Split by newlines and filter out empty lines and comments
      const words = text.split('\n')
        .map(word => word.trim())
        .filter(word => word.length > 0 && !word.startsWith('#'))
        .map(word => word.toUpperCase());
      console.log('Admin words loaded:', words);
      return words;
    } catch (error) {
      console.log('No admin words file found or error reading it:', error);
      return [];
    }
  };

  const fetchRandomWord = async (selectedDifficulty) => {
    setIsLoading(true);
    try {
      // Priority 1: Try to get admin words
      const adminWords = await fetchAdminWords();

      if (adminWords.length > 0) {
        // Filter admin words by difficulty
        const filteredAdminWords = selectedDifficulty === 'easy'
          ? adminWords.filter(w => w.length >= 4 && w.length <= 6)
          : adminWords.filter(w => w.length >= 8 && w.length <= 10);

        console.log(`Filtered admin words for ${selectedDifficulty}:`, filteredAdminWords);

        if (filteredAdminWords.length > 0) {
          const randomWord = filteredAdminWords[Math.floor(Math.random() * filteredAdminWords.length)];
          console.log('Using admin word:', randomWord);
          setWord(randomWord);
          setIsLoading(false);
          return;
        } else {
          console.log(`No admin words match ${selectedDifficulty} difficulty criteria`);
        }
      }

      // Priority 2: Try to fetch from API
      const response = await fetch('https://random-word-api.herokuapp.com/word?number=100');
      const words = await response.json();

      // Filter by difficulty
      let filteredWords;
      if (selectedDifficulty === 'easy') {
        filteredWords = words.filter(w => w.length >= 4 && w.length <= 6);
      } else {
        filteredWords = words.filter(w => w.length >= 8 && w.length <= 10);
      }

      // If no words match criteria, use fallback
      if (filteredWords.length === 0) {
        filteredWords = selectedDifficulty === 'easy'
          ? WORDS.filter(w => w.length >= 4 && w.length <= 6)
          : WORDS.filter(w => w.length >= 8 && w.length <= 10);
      }

      const randomWord = filteredWords[Math.floor(Math.random() * filteredWords.length)];
      setWord(randomWord.toUpperCase());
    } catch (error) {
      console.error('Error fetching word:', error);
      // Priority 3: Fallback to local words
      const fallbackWords = selectedDifficulty === 'easy'
        ? WORDS.filter(w => w.length >= 4 && w.length <= 6)
        : WORDS.filter(w => w.length >= 8 && w.length <= 10);
      const randomWord = fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
      setWord(randomWord);
    } finally {
      setIsLoading(false);
    }
  };

  const startGame = async (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
    guessedLettersRef.current = new Set();
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameStatus('playing');
    setHintUsed(false);
    setTimer(0);
    setIsTimerRunning(false);
    // Set initial score based on difficulty
    setScore(selectedDifficulty === 'easy' ? 100 : 200);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    await fetchRandomWord(selectedDifficulty);
    setIsTimerRunning(true);
  };
  const handleNewGame = () => {
    resetGame();
  };

  const resetGame = () => {
    setDifficulty(null);
    setWord('');
    guessedLettersRef.current = new Set();
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameStatus('playing');
    setScore(0);
    setHintUsed(false);
    setTimer(0);
    setIsTimerRunning(false);
    setIsLoading(false);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const checkGameStatus = () => {
    // Don't check status if game was already solved via button
    if (gameStatus === 'solved') {
      return;
    }

    // Check if won
    const wordLetters = word.split('');
    const hasWon = wordLetters.every(letter => guessedLetters.includes(letter));

    if (hasWon) {
      setGameStatus('won');
      setIsTimerRunning(false);
      // Add current score to total points when player wins
      setTotalPoints(prevTotal => prevTotal + score);
      return;
    }

    // Check if lost
    if (wrongGuesses >= MAX_WRONG) {
      setGameStatus('lost');
      setIsTimerRunning(false);
      // No points added to total when player loses
    }
  };

  useEffect(() => {
    guessedLettersRef.current = new Set(guessedLetters);
  }, [guessedLetters]);

  const handleGuess = useCallback((letter) => {
    if (gameStatus !== 'playing' || !word || guessedLettersRef.current.has(letter)) {
      return;
    }

    const isCorrect = word.includes(letter);

    guessedLettersRef.current = new Set([...guessedLettersRef.current, letter]);
    setGuessedLetters(prevGuessed => [...prevGuessed, letter]);

    if (!isCorrect) {
      setWrongGuesses(prevWrong => prevWrong + 1);
      // Deduct points based on difficulty
      const pointsToDeduct = difficulty === 'easy' ? 10 : 20;
      setScore(prevScore => Math.max(0, prevScore - pointsToDeduct));
    }
  }, [difficulty, gameStatus, word]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key } = event;
      if (!key) {
        return;
      }

      const letter = key.toUpperCase();
      if (/^[A-Z]$/.test(letter)) {
        if (event.repeat || guessedLettersRef.current.has(letter)) {
          event.preventDefault();
          return;
        }

        const button = document.querySelector(`button.key[data-letter=\"${letter}\"]`);
        if (!button || button.disabled) {
          event.preventDefault();
          return;
        }

        event.preventDefault();
        button.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const solvePuzzle = useCallback(() => {
    if (!word) {
      return;
    }

    setGameStatus('solved');
    setGuessedLetters(word.split(''));
    setScore(0);
    setIsTimerRunning(false);
  }, [word]);

  useEffect(() => {
    if (!isTimerRunning) {
      return;
    }

    const intervalId = setInterval(() => {
      setTimer(prevTimer => prevTimer + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isTimerRunning]);

  useEffect(() => {
    if (gameStatus === 'playing' && word) {
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning(false);
    }
  }, [gameStatus, word]);

  useEffect(() => {
    if (gameStatus !== 'playing' || timer < 300) {
      return;
    }
    setIsTimerRunning(false);
    solvePuzzle();
  }, [gameStatus, timer, solvePuzzle]);

  const useHint = () => {
    if (hintUsed || gameStatus !== 'playing') {
      return;
    }

    // Get unguessed letters from the word
    const unguessedLetters = word.split('').filter(letter => !guessedLetters.includes(letter));

    if (unguessedLetters.length > 0) {
      // Pick a random unguessed letter
      const randomLetter = unguessedLetters[Math.floor(Math.random() * unguessedLetters.length)];
      setGuessedLetters([...guessedLetters, randomLetter]);

      // Deduct points based on difficulty
      const pointsToDeduct = difficulty === 'easy' ? 20 : 40;
      setScore(Math.max(0, score - pointsToDeduct));

      setHintUsed(true);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderWord = () => {
    return word.split('').map((letter, idx) => (
      <span key={idx} className="letter-box">
        {guessedLetters.includes(letter) ? letter : '_'}
      </span>
    ));
  };

  const renderKeyboard = () => {
    const rows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
    ];

    return (
      <div className="keyboard">
        {rows.map((row, rowIndex) => (
          <div className="keyboard-row" key={`row-${rowIndex}`}>
            {row.map(letter => (
              <button
                key={letter}
                type="button"
                onClick={() => handleGuess(letter)}
                disabled={guessedLetters.includes(letter) || gameStatus !== 'playing'}
                data-letter={letter}
                className={`key ${guessedLetters.includes(letter) ?
                  (word.includes(letter) ? 'correct' : 'wrong') : ''}`}
              >
                {letter}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderHangman = () => {
    const parts = [
      <circle key="head" cx="140" cy="70" r="20" className="body-part" />,
      <line key="body" x1="140" y1="90" x2="140" y2="150" className="body-part" />,
      <line key="leftarm" x1="140" y1="110" x2="110" y2="130" className="body-part" />,
      <line key="rightarm" x1="140" y1="110" x2="170" y2="130" className="body-part" />,
      <line key="leftleg" x1="140" y1="150" x2="120" y2="180" className="body-part" />,
      <line key="rightleg" x1="140" y1="150" x2="160" y2="180" className="body-part" />
    ];

    return (
      <svg className="hangman-svg" width="200" height="250">
        {/* Gallows */}
        <line x1="10" y1="230" x2="150" y2="230" className="gallows" />
        <line x1="50" y1="230" x2="50" y2="20" className="gallows" />
        <line x1="50" y1="20" x2="140" y2="20" className="gallows" />
        <line x1="140" y1="20" x2="140" y2="50" className="gallows" />

        {/* Body parts based on wrong guesses */}
        {parts.slice(0, wrongGuesses)}
      </svg>
    );
  };

  // Difficulty selection screen
  if (difficulty === null) {
    return (
      <div className="hangman-container">
        <h1>Hangman Game</h1>
        <div className="player-info">
          <span className="player-name">Player: {player.name}</span>
          <span className="total-points">Total Points: {totalPoints}</span>
        </div>
        <div className="difficulty-selection">
          <h2>Select Difficulty</h2>
          <div className="difficulty-buttons">
            <button
              className="difficulty-button easy"
              onClick={() => startGame('easy')}
            >
              Easy
              <span className="difficulty-description">4-6 letter words</span>
            </button>
            <button
              className="difficulty-button hard"
              onClick={() => startGame('hard')}
            >
              Hard
              <span className="difficulty-description">8-10 letter words</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading screen
  if (isLoading) {
    return (
      <div className="hangman-container">
        <h1>Hangman Game</h1>
        <div className="loading">Loading word...</div>
      </div>
    );
  }

  return (
    <div className="hangman-container">
      <h1>Hangman Game</h1>
      <div className="player-info">
        <span className="player-name">Player: {player.name}</span>
        <span className="total-points">Total Points: {totalPoints}</span>
      </div>
      <div className="game-header">
        <div className="difficulty-badge">
          Difficulty: {difficulty.toUpperCase()}
        </div>
        <div className="score-display">
          Score: {score} points
        </div>
        <div className="timer-display">
          Time: {formatTime(timer)}
        </div>
      </div>

      {gameStatus === 'playing' && (
        <div className="game-actions">
          <button
            className="hint-button"
            onClick={useHint}
            disabled={hintUsed}
          >
            {hintUsed ? 'Hint Used' : `Use Hint (-${difficulty === 'easy' ? 20 : 40} pts)`}
          </button>
          <button className="solve-button" onClick={solvePuzzle}>
            Solve Puzzle
          </button>
        </div>
      )}

      <div className="game-info">
        <p>Wrong Guesses: {wrongGuesses} / {MAX_WRONG}</p>
        <button
          type="button"
          className="ml-4 px-3 py-1 text-xs rounded bg-slate-200 text-slate-700 border border-slate-300 hover:bg-slate-300"
          onClick={handleNewGame}
        >
          New Game (For Debug only)
        </button>
      </div>

      {renderHangman()}

      <div className="word-display">
        {renderWord()}
      </div>

      {gameStatus === 'won' && (
        <div className="game-message won">
          <h2>🎉 You Won!</h2>
          <p>The word was: {word}</p>
          <p className="final-score">Final Score: {score} points</p>
          <p className="daily-message">Come back tomorrow for a new puzzle!</p>
        </div>
      )}

      {gameStatus === 'lost' && (
        <div className="game-message lost">
          <h2>😢 Game Over!</h2>
          <p>The word was: {word}</p>
          <p className="final-score">No points awarded</p>
          <p className="daily-message">Try again tomorrow!</p>
        </div>
      )}

      {gameStatus === 'solved' && (
        <div className="game-message solved">
          <h2>Better luck next time!</h2>
          <p>The word was: {word}</p>
          <p className="final-score">No points awarded</p>
          <p className="daily-message">Try again tomorrow!</p>
        </div>
      )}

      {renderKeyboard()}
    </div>
  );
};

export default Hangman;
