import type { SudokuCell } from '../../../types/game'; // Make sure this path is correct
import clsx from 'clsx'; // Import clsx for cleaner class logic

interface SudokuGridProps {
  grid: SudokuCell[][];
  selectedCell: { row: number, col: number } | null;
  onCellClick: (row: number, col: number) => void;
}

export const SudokuGrid = ({ grid, selectedCell, onCellClick }: SudokuGridProps) => {
  
  const getCellClasses = (row: number, col: number) => {
    const cell = grid[row][col];
    
    // --- THIS IS THE FIX ---
    // 1. REMOVED all 'border', 'border-t-4', 'border-l-4' classes from here.
    // The parent 'divide-' classes will handle the thin lines.
    // The parent 'border-6' handles the outer border.
    const classes = clsx(
      'flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 font-extrabold transition-colors',
      
      // 2. We STILL add THICK borders for the 3x3 box lines.
      // These will draw ON TOP of the parent's thin divide lines.
      row % 3 === 0 && row !== 0 && 'border-t-4 border-t-gray-400',
      col % 3 === 0 && col !== 0 && 'border-l-4 border-l-gray-400',

      // Cell value type
      cell.isGiven
        ? 'bg-gray-200 text-gray-900 font-extrabold'
        : 'bg-white text-blue-600 cursor-pointer hover:bg-blue-50',

      // Selected cell highlighting (no change)
      selectedCell && selectedCell.row === row && selectedCell.col === col && 'bg-blue-200',
      selectedCell && (selectedCell.row === row || selectedCell.col === col) && 'bg-blue-50',
      
      // Show error (no change)
      cell.isError && 'bg-red-200 text-red-700'
    );
    // --- END FIX ---
    
    return classes;
  };

  return (
    // --- THIS IS THE FIX ---
    // 1. REMOVED 'gap-0'.
    // 2. ADDED 'divide-x divide-y divide-gray-300' to create the thin 1px grid lines.
    <div className="grid grid-cols-9 rounded-2xl border-6 border-gray-500 overflow-hidden divide-x divide-y divide-gray-400">
    {/* --- END FIX --- */}
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