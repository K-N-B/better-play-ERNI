import React, { useState, useEffect } from "react";
import GameIntro from "../../components/GameIntro";

export default function Ernigram() {
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState("easy");

  const startGame = () => setGameStarted(true);

  return (
    <>
      {!gameStarted ? (
        <GameIntro
          title="ERNIgram"
          description="Do you think you know ERNI well enough? Let’s find out!"
          howToPlay="A secret word or phrase related to our company, culture, or projects is waiting to be solved. Guess it one letter at a time. Correct letters will appear in their spots. A wrong guess removes a bar from the battery, so don’t let it drain!"
          pointsInfo='You will earn <span class="font-bold">100pts</span> for finishing this puzzle, x2 for finishing Hard difficulty.'
          hintInfo='Using a hint will deduct <span class="font-bold">20pts</span>. You will get additional points for completing it early.'
          onStart={startGame}
          onDifficultyChange={setDifficulty}
          color="bg-sky-500"
        />
      ) : (
          <ERNIgramGame difficulty={difficulty} />
      )}
    </>
  );
}

function ERNIgramGame({ difficulty }) {
  const secretWord = "BETTERASKERNI";
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongLetters, setWrongLetters] = useState([]);
  const [battery, setBattery] = useState(difficulty === "hard" ? 3 : 6);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const handleKeyPress = (event) => {
    const letter = event.key.toUpperCase();
    if (!/^[A-Z]$/.test(letter) || guessedLetters.includes(letter) || wrongLetters.includes(letter) || gameOver || gameWon) return;

    if (secretWord.includes(letter)) {
      setGuessedLetters((prev) => [...prev, letter]);
    } else {
      setWrongLetters((prev) => [...prev, letter]);
      setBattery((prev) => prev - 1);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [guessedLetters, wrongLetters, gameOver, gameWon]);

  useEffect(() => {
    if (battery <= 0) setGameOver(true);
    const allRevealed = secretWord.split("").every((l) => guessedLetters.includes(l));
    if (allRevealed) setGameWon(true);
  }, [battery, guessedLetters]);

  const resetGame = () => {
    setGuessedLetters([]);
    setWrongLetters([]);
    setBattery(difficulty === "hard" ? 3 : 6);
    setGameOver(false);
    setGameWon(false);
  };

  return (
    <div className="h-full text-center grid grid-cols-2">
      <div className="p-20 text-2xl rounded-3xl flex flex-col items-center justify-center bg-white">
        <div className="font-semibold bg-sky-400 text-white rounded-full px-6 py-1 text-sm mb-6">
          What is ERNI's tagline?
        </div>

        <div className="grid grid-cols-6 gap-2 mb-6">
          {secretWord.split("").map((letter, i) => (
            <div
              key={i}
              className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-bold text-lg md:text-xl rounded-md border ${
                guessedLetters.includes(letter)
                  ? "bg-sky-900 text-white border-sky-900"
                  : "bg-sky-100 border-sky-300"
              }`}
            >
              {guessedLetters.includes(letter) ? letter : ""}
            </div>
          ))}
        </div>

        <div className="text-left w-full text-sm md:text-base">
          <div className="text-red-600 font-semibold mb-1">
            Wrong letters: {wrongLetters.join(", ") || "None"}
          </div>
          <div className="font-semibold text-gray-800 flex items-center gap-2">
            Battery
            <div className="flex gap-1">
              {Array.from({ length: difficulty === "hard" ? 3 : 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-5 h-3 rounded-sm ${i < battery ? "bg-green-500" : "bg-gray-300"}`}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {(gameOver || gameWon) && (
          <div className="mt-6 text-center">
            <div
              className={`font-bold text-xl ${gameWon ? "text-green-600" : "text-red-600"}`}
            >
              {gameWon ? "You guessed it!" : "Game Over!"}
            </div>
            <button
              onClick={resetGame}
              className="mt-3 px-4 py-2 bg-sky-500 text-white rounded-full font-semibold hover:bg-sky-600"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-4xl font-bold text-gray-900">ERNIgram</div>
        <div className="text-gray-700 mt-1 text-base font-medium">
          on {difficulty} difficulty
        </div>

        <button className="mt-6 px-4 py-2 bg-white border border-sky-500 text-sky-600 rounded-full text-sm font-semibold hover:bg-sky-50 transition">
          Hint
        </button>
      </div>
    </div>
  );
}