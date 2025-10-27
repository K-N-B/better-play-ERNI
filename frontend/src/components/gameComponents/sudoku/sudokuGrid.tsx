// Renders the 9x9 grid. It highlights the selected cell, row, column, and 3x3 box. It renders "given" numbers differently from "user-entered" numbers and "notes".

import type { SudokuCell } from '../../../types/game'; // We'll add this type

interface SudokuGridProps {
  grid: SudokuCell[][];
  selectedCell: { row: number, col: number } | null;
  onCellClick: (row: number, col: number) => void;
}

export const SudokuGrid = ({ grid, selectedCell, onCellClick }: SudokuGridProps) => {
  // Helper to determine cell classes
  const getCellClasses = (row: number, col: number) => {
    let classes = 'flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 border border-gray-300 transition-colors';

    // Bold borders for 3x3 boxes
    if (row % 3 === 0 && row !== 0) classes += ' border-t-2 border-t-primary';
    if (col % 3 === 0 && col !== 0) classes += ' border-l-2 border-l-primary';

    // Cell value type
    const cell = grid[row][col];
    if (cell.isGiven) {
      classes += ' bg-gray-200 text-gray-900 font-bold';
    } else {
      classes += ' bg-white text-blue-600 cursor-pointer hover:bg-blue-50';
    }

    // Selected cell highlighting
    if (selectedCell) {
      if (selectedCell.row === row && selectedCell.col === col) {
        classes += ' bg-blue-200'; // Selected cell
      } else if (selectedCell.row === row || selectedCell.col === col) {
        classes += ' bg-blue-50'; // Highlight row/col
      }
    }
    
    // Show error
    if (cell.isError) {
      classes += ' bg-red-200 text-red-700';
    }
    
    return classes;
  };

  return (
    <div className="grid grid-cols-9 border-2 border-primary shadow-lg">
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={getCellClasses(rowIndex, colIndex)}
            onClick={() => !cell.isGiven && onCellClick(rowIndex, colIndex)}
          >
            {cell.value ? (
              <span className="text-xl">{cell.value}</span>
            ) : (
              // Render notes
              <div className="grid grid-cols-3 gap-0.5 text-xs text-gray-500">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(note => (
                  <span key={note} className={cell.notes.includes(note) ? 'visible' : 'invisible'}>
                    {note}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};