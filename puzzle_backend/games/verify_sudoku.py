import sys
from datetime import datetime
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from games.api_client import generate_sudoku_puzzle_data
except ImportError as e:
    print(f"❌ Import Error: {e}")
    print("Make sure your folder structure is: puzzle_Backend/games/verify_sudoku.py")
    sys.exit(1)

# --- Independent Solver for Verification ---

# --- Independent Solver for Verification ---

def is_safe(board, row, col, num):
    for x in range(9):
        if board[row][x] == num or board[x][col] == num:
            return False
    start_row, start_col = row - (row % 3), col - (col % 3)
    for i in range(3):
        for j in range(3):
            if board[i + start_row][j + start_col] == num:
                return False
    return True

def count_solutions(board_string, limit=2):
    """
    Converts string to board, solves, and returns count (up to 'limit').
    """
    # Convert string '004...' to 9x9 int grid
    board = [[int(board_string[r*9 + c]) for c in range(9)] for r in range(9)]
    return _solve_recursive(board, limit)

def _solve_recursive(board, limit):
    for i in range(9):
        for j in range(9):
            if board[i][j] == 0:
                count = 0
                for num in range(1, 10):
                    if is_safe(board, i, j, num):
                        board[i][j] = num
                        count += _solve_recursive(board, limit)
                        board[i][j] = 0 # Backtrack
                        if count >= limit: 
                            return count
                return count
    return 1

# --- The Test Loop ---

def run_stress_test(iterations=5):
    print(f"🔍 Starting Stress Test: Checking {iterations} rounds...")
    print("-" * 80)

    failures = 0

    for i in range(1, iterations + 1):
        print(f"Round {i}:")
        
        # 1. Generate the data using your new function
        data = generate_sudoku_puzzle_data(datetime.now().date())
        
        sol_str = data['solution_string']
        easy_str = data['puzzle_string_easy']
        hard_str = data['puzzle_string_hard']
        
        # --- PRINT STATEMENTS ADDED HERE ---
        print(f"   [Data] Solution: {sol_str}")
        print(f"   [Data] Easy:     {easy_str}")
        print(f"   [Data] Hard:     {hard_str}")
        # -----------------------------------

        # 2. Verify Easy
        easy_count = count_solutions(easy_str)
        if easy_count != 1:
            print(f"\n❌ FAILURE on Easy! Found {easy_count} solutions.")
            failures += 1
        
        # 3. Verify Hard
        hard_count = count_solutions(hard_str)
        if hard_count != 1:
            print(f"\n❌ FAILURE on Hard! Found {hard_count} solutions.")
            failures += 1
            
        if easy_count == 1 and hard_count == 1:
            print("   ✅ Verification: Unique (OK)")
            
        print("-" * 80)

    if failures == 0:
        print(f"🎉 SUCCESS! All {iterations * 2} puzzles had exactly 1 unique solution.")
    else:
        print(f"⚠️ WARNING: {failures} puzzles were ambiguous (had multiple solutions).")

if __name__ == "__main__":
    run_stress_test(5) # Reduced default to 5 to keep output manageable