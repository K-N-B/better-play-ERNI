import React from "react";
import "./Grid.css";

// Define types for the props
interface GridProps {
  guesses: string[];
  currentGuess: string;
  currentRow: number;
  solution: string;
}

const Grid: React.FC<GridProps> = ({ guesses, currentGuess, currentRow, solution }) => {
  // Function to determine the status of a cell (correct, present, absent)
  const getCellStatus = (rowIndex: number, cellIndex: number): string => {
    const guess = guesses[rowIndex];
    if (!guess || guess.length < cellIndex + 1) return "";

    const letter = guess[cellIndex];
    const solutionLetter = solution[cellIndex];

    if (letter === solutionLetter) {
      return "correct";
    } else if (solution.includes(letter)) {
      return "present";
    } else {
      return "absent";
    }
  };

  return (
    <div className="WordleGrid">
      {guesses.map((guess, rowIndex) => (
        <div key={rowIndex} className="row">
          {[0, 1, 2, 3, 4].map((cellIndex) => {
            const isCurrentRow = rowIndex === currentRow;
            const letter =
              isCurrentRow && currentGuess[cellIndex]
                ? currentGuess[cellIndex]
                : guess[cellIndex] || "";

            const status = guess ? getCellStatus(rowIndex, cellIndex) : "";

            return (
              <div key={cellIndex} className={`cell ${status}`}>
                {letter}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Grid;
