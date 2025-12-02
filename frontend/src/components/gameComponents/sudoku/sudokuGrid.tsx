import clsx from "clsx"; // Import clsx for cleaner class logic

export interface SudokuCell {
  value: number | null;
  isGiven: boolean;
  isError: boolean;
  isHint: boolean;
  notes: number[];
}

interface SudokuGridProps {
  grid: SudokuCell[][];
  selectedCell: { row: number; col: number } | null;
  onCellClick: (row: number, col: number) => void;
}

export const SudokuGrid = ({
  grid,
  selectedCell,
  onCellClick,
}: SudokuGridProps) => {
  const getCellClasses = (row: number, col: number) => {
    const cell = grid[row][col];
    const isSelected =
      selectedCell && selectedCell.row === row && selectedCell.col === col;
    const isSameRowOrCol =
      selectedCell &&
      !isSelected &&
      (selectedCell.row === row || selectedCell.col === col);

    return clsx(
      "flex items-center justify-center aspect-square w-full font-extrabold transition-colors duration-150 ease-in-out relative",

      // --- 3x3 thicker lines ---
      row % 3 === 0 &&
        row !== 0 &&
        "border-t-2 md:border-t-4 border-t-gray-500",
      col % 3 === 0 &&
        col !== 0 &&
        "border-l-2 md:border-l-4 border-l-gray-500",

      // --- Cell types ---
      cell.isGiven && "bg-gray-200 text-gray-900 font-extrabold",
      !cell.isGiven && "bg-white text-blue-600 cursor-pointer hover:bg-blue-50",
      cell.isHint && "bg-yellow-200 text-black font-bold",
      cell.isError && "bg-red-200 text-red-700",

      // --- Highlights ---
      isSameRowOrCol && "!bg-blue-100",
      isSelected && "!bg-blue-200 !z-10"
    );
  };

  return (
    // --- THIS IS THE FIX ---
    // 1. REMOVED 'gap-0'.
    // 2. ADDED 'divide-x divide-y divide-gray-300' to create the thin 1px grid lines.
    <div className="w-full max-w-lg mx-auto aspect-square grid grid-cols-9 rounded-2xl border-3 md:border-6 border-gray-500 overflow-hidden divide-x divide-y divide-gray-300 bg-gray-500">
      {/* --- END FIX --- */}
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            data-testid={`cell-${rowIndex}-${colIndex}`}
            className={getCellClasses(rowIndex, colIndex)}
            onClick={() => {
              if (!cell.isGiven && !cell.isHint) {
                onCellClick(rowIndex, colIndex);
              }
            }}
          >
            {cell.value ? (
              <span className="text-md md:text-xl">{cell.value}</span>
            ) : (
              // Render notes
              <div className="grid grid-cols-3 gap-0.5 w-full h-full p-0 lg:p-0.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((note) => (
                  <div key={note} className="flex items-center justify-center">
                    <span
                      className={clsx(
                        // Very small text for notes on mobile
                        "text-[8px] sm:text-[8px] md:text-xs text-gray-500 leading-none",
                        cell.notes.includes(note) ? "visible" : "invisible"
                      )}
                    >
                      {note}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};
