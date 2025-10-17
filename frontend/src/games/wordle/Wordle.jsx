import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import GameIntro from "../../components/GameIntro";
import Grid from "./components/Grid";
import { fetchWordPools, FALLBACK_POOLS } from "./wordList";

const WORD_LENGTH = 5;
const EASY_START_POINTS = 100;
const HARD_START_POINTS = 200;
const HINT_COST = { easy: 20, hard: 40 };

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
          hintInfo='Using a hint deducts <span class="font-bold">20pts</span>.'
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

function WordleGame({ difficulty }) {
  const STORAGE_KEY = "wordle.dailyState";
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [solution, setSolution] = useState("");
  const [guesses, setGuesses] = useState(Array(6).fill(""));
  const [currentGuess, setCurrentGuess] = useState("");
  const [currentRow, setCurrentRow] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [points, setPoints] = useState(
    difficulty === "hard" ? HARD_START_POINTS : EASY_START_POINTS
  );
  const [hintUsed, setHintUsed] = useState(false);
  const [wordPools, setWordPools] = useState({
    easy: FALLBACK_POOLS.easyWords,
    hard: FALLBACK_POOLS.hardWords,
  });

  // Fetch words
  useEffect(() => {
    fetchWordPools().then((pools) =>
      setWordPools({ easy: pools.easyWords, hard: pools.hardWords })
    );
  }, []);

  // Pick random word when starting
  useEffect(() => {
    const pool = difficulty === "hard" ? wordPools.hard : wordPools.easy;
    const randomWord =
      pool[Math.floor(Math.random() * pool.length)]?.toUpperCase() || "APPLE";
    setSolution(randomWord);
  }, [difficulty, wordPools]);

  // Handle keyboard input
  const handleKeyPress = useCallback(
    (event) => {
      const key = event.key.toUpperCase();
      if (!/^[A-Z]$/.test(key) && key !== "ENTER" && key !== "BACKSPACE") return;

      if (key === "ENTER") {
        if (currentGuess.length !== WORD_LENGTH) return;

        const newGuesses = [...guesses];
        newGuesses[currentRow] = currentGuess;
        setGuesses(newGuesses);

        if (currentGuess === solution) {
          setIsGameOver(true);
          alert("You guessed it!");
        } else if (currentRow === 5) {
          setIsGameOver(true);
          alert(`Game Over! The word was ${solution}`);
        } else {
          setCurrentRow((prev) => prev + 1);
          setCurrentGuess("");
        }
      } else if (key === "BACKSPACE") {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (currentGuess.length < WORD_LENGTH) {
        setCurrentGuess((prev) => prev + key);
      }
    },
    [currentGuess, currentRow, guesses, solution]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  const handleHint = () => {
    if (hintUsed || isGameOver) return;
    const hintIndex = Math.floor(Math.random() * solution.length);
    alert(`Hint: Position ${hintIndex + 1} contains "${solution[hintIndex]}"`);
    setHintUsed(true);
    setPoints((p) => p - HINT_COST[difficulty]);
  };

  const resetGame = () => {
    setGuesses(Array(6).fill(""));
    setCurrentGuess("");
    setCurrentRow(0);
    setIsGameOver(false);
    setPoints(difficulty === "hard" ? HARD_START_POINTS : EASY_START_POINTS);
    setHintUsed(false);
  };

  return (
    <div className="h-full text-center grid grid-cols-2">
      <div className="p-10 bg-white rounded-3xl flex items-center justify-center">
        <Grid
          guesses={guesses}
          currentGuess={currentGuess}
          currentRow={currentRow}
          solution={solution}
        />

        {isGameOver && (
          <button
            onClick={resetGame}
            className="mt-6 px-6 py-3 bg-emerald-500 text-white rounded-full font-semibold hover:bg-emerald-600"
          >
            Play Again
          </button>
        )}
      </div>

      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-6xl font-bold text-gray-900">Wordle</div>
        <div className="text-gray-700 mt-2 text-2xl font-medium">
          on {difficulty} difficulty
        </div>
        <button
          onClick={handleHint}
          disabled={hintUsed || isGameOver}
          className="mt-6 px-5 py-4 bg-white border border-emerald-500 text-emerald-600 rounded-full text-2xl font-semibold hover:bg-emerald-50 transition"
        >
          {hintUsed ? "Hint Used" : "Hint"}
        </button>
      </div>
    </div>
  );
}
