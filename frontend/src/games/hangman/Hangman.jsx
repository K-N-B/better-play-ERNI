import React, { useState, useEffect } from 'react';
import DifficultyToggle from '../../components/DifficultyToggle';
import PrimaryButton from '../../components/PrimaryButton';
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

const Hangman = () => {
  const [difficulty, setDifficulty] = useState('easy'); // 'easy' or 'hard'
  const [gameStarted, setGameStarted] = useState(false);
  const [word, setWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameStatus, setGameStatus] = useState('pending'); // pending, playing, won, lost, solved
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [player] = useState({ name: 'John Doe' });
  const [totalPoints, setTotalPoints] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);

  useEffect(() => {
    if (word && guessedLetters.length > 0) {
      checkGameStatus();
    }
  }, [guessedLetters, wrongGuesses]);

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

  const startGame = async () => {
    setGameStarted(true);
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameStatus('playing');
    setHintUsed(false);
    // Set initial score based on difficulty
    setScore(difficulty === 'easy' ? 100 : 200);
    await fetchRandomWord(difficulty);
  };

  const resetGame = () => {
    setDifficulty('easy');
    setGameStarted(false);
    setWord('');
    setGuessedLetters([]);
    setWrongGuesses(0);
    setScore(0);
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
      // Add current score to total points when player wins
      setTotalPoints(prevTotal => prevTotal + score);
      return;
    }

    // Check if lost
    if (wrongGuesses >= MAX_WRONG) {
      setGameStatus('lost');
      // No points added to total when player loses
    }
  };

  const handleGuess = (letter) => {
    if (gameStatus !== 'playing' || guessedLetters.includes(letter)) {
      return;
    }

    const newGuessedLetters = [...guessedLetters, letter];
    setGuessedLetters(newGuessedLetters);

    if (!word.includes(letter)) {
      setWrongGuesses(wrongGuesses + 1);
      // Deduct points based on difficulty
      const pointsToDeduct = difficulty === 'easy' ? 10 : 20;
      setScore(Math.max(0, score - pointsToDeduct));
    }
  };

  const solvePuzzle = () => {
    setGameStatus('solved');
    // Reveal all letters
    setGuessedLetters(word.split(''));
    // No points awarded when solving
  };

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

  const renderWord = () => {
    return word.split('').map((letter, idx) => (
      <span key={idx} className="letter-box">
        {guessedLetters.includes(letter) ? letter : '_'}
      </span>
    ));
  };

  const renderKeyboard = () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    return (
      <div className="keyboard">
        {alphabet.map(letter => (
          <button
            key={letter}
            onClick={() => handleGuess(letter)}
            disabled={guessedLetters.includes(letter) || gameStatus !== 'playing'}
            className={`key ${guessedLetters.includes(letter) ?
              (word.includes(letter) ? 'correct' : 'wrong') : ''}`}
          >
            {letter}
          </button>
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
  if (!gameStarted) {
    return (
      <div className="hangman-container grid grid-cols-2 flex-col-reverse">
        <div className="place-content-center p-20 text-2xl leading-6 bg-white h-full rounded-3xl">
            <div className="font-medium ">Do you think you know ERNI well enough? Let’s find out!</div>
            <div className="font-semibold mt-8">How to play:</div>
            <div className="mt-2">A secret word or phrase related to our company, culture, or projects is waiting to be solved. Guess it one letter at a time. Correct letters will appear in their spots. A wrong guess removes a bar from the battery, so don’t let it drain!</div>
        </div>
        <div className="place-content-center p-20 text-xl leading-5">
          <div className="text-5xl font-bold">ERNIgram</div>
          <div className="mt-10 font-medium">
            <div>You will earn <span className="font-bold">100pts</span> for finishing this puzzle, x2 for finishing Hard difficulty.</div>
            <div className="mt-10">Using a hint will deduct <span className="font-bold">20pts</span>. You will get additional points for completing it early.</div>
          </div>
          <div className="difficulty-selection mt-6 text-xl">
            <div className="font-semibold text-black">Choose a difficulty:</div> 
            <DifficultyToggle
              onToggle={(isHard) => setDifficulty(isHard ? 'hard' : 'easy')}
            />
            <div className="difficulty-buttons mt-10">
              <button className="font-semibold text-primary text-4xl leading-none px-6 py-4 rounded-2xl bg-sky-400 text-slate-50 shadow-[0_5px_0_0] shadow-sky-800" onClick={startGame}>
                Start
              </button>
            </div>
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
      <h1>ERNIgram</h1>
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
