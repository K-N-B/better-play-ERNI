// useSudokuInput.ts

import { useCallback, useEffect } from "react";
import type { SudokuCell } from "./sudokuGrid";

import { useSound } from "../../../hooks/useSound";
import click1 from "@/assets/sounds/keyboard_press_1.mp3";
import click2 from "@/assets/sounds/keyboard_press_2.mp3";
import click3 from "@/assets/sounds/keyboard_press_3.mp3";
// Define the arguments the hook needs from the Game component
interface keyboardInputSudokuProps {
  grid: SudokuCell[][];
  selectedCell: { row: number; col: number } | null;
  isGameOver: boolean;
  isNoteMode: boolean;
  alreadyCompleted: { hasSubmitted: boolean } | null;

  // Functions the hook needs to call back to the Game component
  setSelectedCell: (cell: { row: number; col: number } | null) => void;
  setIsNoteMode: (mode: boolean | ((prev: boolean) => boolean)) => void;
  handleInputCore: (value: number | null) => void;
}

export const keyboardInputSudoku = ({
  selectedCell,
  isGameOver,
  alreadyCompleted,
  setSelectedCell,
  setIsNoteMode,
  handleInputCore,
}: keyboardInputSudokuProps) => {
  const playClick = useSound([click1, click2, click3], 0.5);
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!selectedCell) return;
      if (isGameOver || alreadyCompleted?.hasSubmitted) return;

      const key = event.key;
      let inputValue: number | null | undefined = undefined;

      // --- Input Logic ---
      if (key >= "1" && key <= "9") {
        inputValue = parseInt(key);
      } else if (key === "Delete" || key === "Backspace" || key === "0") {
        inputValue = null;
        event.preventDefault();
      }

      if (inputValue !== undefined) {
        // ⭐️ Play sound before dispatching core logic ⭐️
        playClick();
        handleInputCore(inputValue);
        return;
      }
      // --- Navigation Logic (Move this out of handleInputCore's job) ---
      if (
        key === "ArrowUp" ||
        key === "ArrowDown" ||
        key === "ArrowLeft" ||
        key === "ArrowRight"
      ) {
        playClick();
        event.preventDefault();
        const { row, col } = selectedCell;
        let newRow = row;
        let newCol = col;

        if (key === "ArrowUp") newRow = Math.max(0, row - 1);
        if (key === "ArrowDown") newRow = Math.min(8, row + 1);
        if (key === "ArrowLeft") newCol = Math.max(0, col - 1);
        if (key === "ArrowRight") newCol = Math.min(8, col + 1);

        setSelectedCell({ row: newRow, col: newCol });
        return;
      }

      // --- Toggle Note Mode ---
      if (key.toLowerCase() === "n") {
        playClick();
        setIsNoteMode((prev) => !prev);
        return;
      }
    },
    [
      selectedCell,
      isGameOver,
      alreadyCompleted,
      handleInputCore,
      setSelectedCell,
      setIsNoteMode,
    ]
  );

  // ⭐️ 2. EFFECT HOOK (Attach/Detach listener) ⭐️
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // The hook itself doesn't need to return anything if it only handles side effects
  // return {};
};
