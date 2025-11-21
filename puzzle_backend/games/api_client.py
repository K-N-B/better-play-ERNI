import random
import requests
from bs4 import BeautifulSoup

# --- Configuration ---
from .config import (
    DEFAULT_EASY_BLANKS,
    DEFAULT_HARD_BLANKS,
    NEWS_API_BASE_URL,
    NEWS_API_FEED_PARAM,
    SUDOKU_API_BASE_URL,
)

# ----------------------------------------------------------------------
# HELPER: SUDOKU SOLVER (Backtracking)
# ----------------------------------------------------------------------

def _is_safe(board, row, col, num):
    # Check row and column
    for x in range(9):
        if board[row][x] == num or board[x][col] == num:
            return False
    # Check 3x3 box
    start_row, start_col = row - (row % 3), col - (col % 3)
    for i in range(3):
        for j in range(3):
            if board[i + start_row][j + start_col] == num:
                return False
    return True

def _solve_and_count(board, limit=2):
    for i in range(9):
        for j in range(9):
            if board[i][j] == 0:
                count = 0
                for num in range(1, 10):
                    if _is_safe(board, i, j, num):
                        board[i][j] = num
                        count += _solve_and_count(board, limit)
                        board[i][j] = 0 
                        if count >= limit:
                            return count
                return count
    return 1

# ----------------------------------------------------------------------
# A. SUDOKU API CLIENTS
# ----------------------------------------------------------------------

def _flatten_board(board):
    flattened = []
    for row in board:
        for cell in row:
            if cell is None:
                flattened.append("0")
            else:
                flattened.append(str(cell))
    return "".join(flattened)

def _fetch_one_sudoku_from_api():
    query = "?query={newboard(limit:1){grids{value,solution,difficulty}}}"
    resp = requests.get(SUDOKU_API_BASE_URL + query, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    grids = data.get("newboard", {}).get("grids", [])
    if not grids:
        raise RuntimeError("Sudoku API returned no grids")
    return grids[0]

def _make_unique_variant(base_string: str, blanks_target: int) -> str:
    if len(base_string) != 81:
        raise ValueError("base_string must be length 81")

    board_flat = [int(c) for c in base_string]
    board_2d = [board_flat[i:i+9] for i in range(0, 81, 9)]
    coords = [(r, c) for r in range(9) for c in range(9)]
    random.shuffle(coords)

    current_blanks = 0
    
    # DEBUG PRINT (Optional: keep or remove for production)
    print(f"   [Gen] Attempting to create {blanks_target} blanks...")

    for r, c in coords:
        if current_blanks >= blanks_target:
            break
        backup = board_2d[r][c]
        board_2d[r][c] = 0
        
        board_copy = [row[:] for row in board_2d]
        solutions = _solve_and_count(board_copy, limit=2)
        
        if solutions != 1:
            board_2d[r][c] = backup
        else:
            current_blanks += 1

    print(f"   [Gen] Finished. Achieved {current_blanks} blanks")

    result_flat = []
    for row in board_2d:
        for num in row:
            result_flat.append(str(num))
    return "".join(result_flat)

# --- UPDATED FALLBACK DATA ---
# Only storing solutions now. We will generate the puzzle strings dynamically.
FALLBACK_SOLUTIONS = [
    "534287196871694352629135748468729531193568274257413689386951427715842963942376815",
    "357896214614235897289417635962173548543682971871549326135728469428961753796354182",
    "246395781918672435735481269573914826492836157681257943154723698827569314369148572",
    "425693817167258349839147562643821795791435286258976431584769123316582974972314658",
    "689327514274159638531864792928476153145983276763215489897542361416738925352691847"
]

def generate_sudoku_puzzle_data(date_to_be_used):
    solution_string = ""
    
    try:
        # 1. Try to get from API
        grid = _fetch_one_sudoku_from_api()
        base_solution = grid.get("solution")
        solution_string = _flatten_board(base_solution)
        print(f"Fetched live data for {date_to_be_used}")

    except Exception as exc:
        # 2. If API fails, pick a random fallback solution
        print(f"[games.api_client] Error fetching Sudoku: {exc}. Using Fallback.")
        solution_string = random.choice(FALLBACK_SOLUTIONS)

    # 3. Generate the puzzles using the solution (Works for both API and Fallback data)
    # This ensures Fallbacks are ALSO unique!
    puzzle_string_easy = _make_unique_variant(solution_string, DEFAULT_EASY_BLANKS)
    puzzle_string_hard = _make_unique_variant(solution_string, DEFAULT_HARD_BLANKS)

    return {
        "date_to_be_used": date_to_be_used,
        "solution_string": solution_string,
        "puzzle_string_easy": puzzle_string_easy,
        "puzzle_string_hard": puzzle_string_hard,
    }

# ----------------------------------------------------------------------
# B. NEWS/RSS API CLIENT
# ----------------------------------------------------------------------

def fetch_cleaned_news_articles():
    full_url = NEWS_API_BASE_URL + NEWS_API_FEED_PARAM
    try:
        resp = requests.get(full_url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        articles = data.get("items", [])
        valid_articles = []
        for a in articles:
            title = a.get("title", "").strip()
            desc_html = a.get("description", "")
            clue_text = BeautifulSoup(desc_html, "html.parser").get_text(" ", strip=True)
            if title and clue_text:
                valid_articles.append({"title": title, "description": clue_text})
        return valid_articles[:10]
    except Exception as e:
        print(f"🛑 RSS fetch failed: {e}")
        return []