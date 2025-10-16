import React, { useState } from "react";
import SudokuCell from "./SudokuCell";
import "./SudokuBoard.css";

const SudokuBoard = ({ board, initialBoard, onCellChange, solution }) => {
  const [selectedCell, setSelectedCell] = useState(null);

  const handleCellClick = (row, col) => {
    setSelectedCell({ row, col });
  };

  const isInitialCell = (row, col) => {
    return initialBoard[row][col] !== 0;
  };

  const isError = (row, col) => {
    if (board[row][col] === 0) return false;
    return board[row][col] !== solution[row][col];
  };

  const isHighlighted = (row, col) => {
    if (!selectedCell) return false;
    const { row: selRow, col: selCol } = selectedCell;

    // Highlight same row, column, or 3x3 box
    const sameRow = row === selRow;
    const sameCol = col === selCol;
    const sameBox =
      Math.floor(row / 3) === Math.floor(selRow / 3) &&
      Math.floor(col / 3) === Math.floor(selCol / 3);

    return sameRow || sameCol || sameBox;
  };

  const handleCellChange = (row, col, value) => {
    onCellChange(row, col, value);
  };

  return (
    <div className="sudoku-board">
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="sudoku-row">
          {row.map((cell, colIndex) => (
            <SudokuCell
              key={`${rowIndex}-${colIndex}`}
              value={cell}
              onChange={(value) => handleCellChange(rowIndex, colIndex, value)}
              isInitial={isInitialCell(rowIndex, colIndex)}
              isSelected={
                selectedCell &&
                selectedCell.row === rowIndex &&
                selectedCell.col === colIndex
              }
              onClick={() => handleCellClick(rowIndex, colIndex)}
              isError={isError(rowIndex, colIndex)}
              isHighlighted={isHighlighted(rowIndex, colIndex)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default SudokuBoard;
