import React from "react";
import "./SudokuCell.css";

const SudokuCell = ({
  value,
  onChange,
  isInitial,
  isSelected,
  onClick,
  isError,
  isHighlighted,
}) => {
  const handleChange = (e) => {
    const val = e.target.value;
    if (val === "" || (val >= "1" && val <= "9")) {
      onChange(val === "" ? 0 : parseInt(val));
    }
  };

  const getCellClass = () => {
    let className = "sudoku-cell w-10 h-10 md:w-14 md:h-14 p-2";
    if (isInitial) className += " initial";
    if (isSelected) className += " selected";
    if (isError) className += " error";
    if (isHighlighted) className += " highlighted";
    return className;
  };

  return (
    <input
      type="text"
      className={getCellClass()}
      value={value === 0 ? "" : value}
      onChange={handleChange}
      onClick={onClick}
      disabled={isInitial}
      maxLength="1"
    />
  );
};

export default SudokuCell;
