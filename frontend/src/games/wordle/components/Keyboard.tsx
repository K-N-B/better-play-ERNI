import React from "react";
import "./Keyboard.css";

// Define types for the props
interface KeyboardProps {
  onKeyPress: (key: string) => void;
  guesses: string[];
  solution: string;
  activeKey: string;
}

const Keyboard: React.FC<KeyboardProps> = ({ onKeyPress, guesses, solution, activeKey }) => {
  // Define the keyboard layout (rows of keys)
  const rows: string[][] = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "BACKSPACE"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "ENTER"],
    ["Z", "X", "C", "V", "B", "N", "M"],
  ];

  // Get the status of a key (correct, present, absent, or default)
  const getKeyStatus = (key: string): string => {
    if (key === "ENTER" || key === "BACKSPACE") return "";

    let status = "";

    for (const guess of guesses) {
      if (!guess) continue;

      for (let i = 0; i < guess.length; i++) {
        if (guess[i] === key) {
          if (solution[i] === key) {
            return "correct";
          }
          if (solution.includes(key)) {
            status = "present";
          } else if (status !== "present") {
            status = "absent";
          }
        }
      }
    }

    return status;
  };

  // Build the class name for each key based on its status and other factors
  const buildKeyClassName = (key: string): string => {
    const classes = ["key"];
    if (key.length > 1) classes.push("key-large");
    const status = getKeyStatus(key);
    if (status) classes.push(status);
    if (activeKey === key) classes.push("active");
    return classes.join(" ");
  };

  return (
    <div className="keyboard">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="keyboard-row">
          {row.map((key) => (
            <button
              key={key}
              className={buildKeyClassName(key)}
              onClick={() => onKeyPress(key)}
            >
              {key === "BACKSPACE" ? "Backspace" : key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;
