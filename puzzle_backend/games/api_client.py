# /games/api_client.py
import random

import requests
from bs4 import BeautifulSoup

# --- Configuration (Assumed from your project's config file) ---
# Ensure these variables are accessible via this import.
from .config import (
    DEFAULT_EASY_BLANKS,
    DEFAULT_HARD_BLANKS,
    NEWS_API_BASE_URL,
    NEWS_API_FEED_PARAM,
    SUDOKU_API_BASE_URL,
)

# ----------------------------------------------------------------

# ----------------------------------------------------------------------
# A. SUDOKU API CLIENTS (Utilities and Generators)
# ----------------------------------------------------------------------


def _flatten_board(board):
    """
    Accepts board as list-of-lists or nested arrays, returns 81-char string,
    using '0' for blanks.
    """
    flattened = []
    for row in board:
        for cell in row:
            # cell may be int or None; ensure '0' for blanks
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


def _make_variant_from_base(base_string: str, blanks_target: int) -> str:
    """
    base_string: 81-char string with digits '0'-'9' (0 means blank)
    This function will randomly turn some non-zero cells to '0' until the
    total number of '0's equals blanks_target (or as many as possible).
    """
    if len(base_string) != 81:
        raise ValueError("base_string must be length 81")

    arr = list(base_string)
    current_blanks = [i for i, ch in enumerate(arr) if ch == "0"]
    non_blank_indices = [i for i, ch in enumerate(arr) if ch != "0"]

    blanks_needed = max(0, blanks_target - len(current_blanks))
    if blanks_needed > 0 and non_blank_indices:
        to_blank = random.sample(non_blank_indices, min(blanks_needed, len(non_blank_indices)))
        for idx in to_blank:
            arr[idx] = "0"
    return "".join(arr)


FALLBACK_PUZZLES = [
    {
        "solution": "534287196871694352629135748468729531193568274257413689386951427715842963942376815	",
        "easy": "000000096001690350029030700460020031190568070200000009000051407005002903040000800",
        "hard": "000000090000690050009030700400020031190068070200000009000051007005002900040000800",
    },
    {
        "solution": "357896214614235897289417635962173548543682971871549326135728469428961753796354182",
        "easy": "000000000600005090280007000902100500500000900070500020105708060008001050796054002",
        "hard": "000000000600005090280007000902000500500000900070500020105700060008000050796054002",
    },
    {
        "solution": "246395781918672435735481269573914826492836157681257943154723698827569314369148572",
        "easy": "046390081008600030705000000500000006090830100601200040100020000007069300000148000",
        "hard": "046390001000600030005000000500000006090830100601200040100020000007069300000108000",
    },
    {
        "solution": "425693817167258349839147562643821795791435286258976431584769123316582974972314658",
        "easy": "000690000160200000809000002000000000090000080200006400500009000300000904070004650",
        "hard": "000690000160200000809000002000000000090000080200006400500009000300000904070004650	",
    },
    {
        "solution": "689327514274159638531864792928476153145983276763215489897542361416738925352691847",
        "easy": "009000000000000030500804002908006000100080000003000480000000300000000000300600047",
        "hard": "009000000000000030500804002908006000100080000003000480000000300000000000300600047	",
    },
    {
        "solution": "457936218698712354321458769842567193713849526965321847179284635586193472234675981",
        "easy": "050030010008010000300000700042000090710040500000300840000084600500100470200000080",
        "hard": "050030010008010000300000700042000090710040500000300840000084600500100470200000080	",
    },
]


def get_random_fallback():
    return random.choice(FALLBACK_PUZZLES)


def generate_sudoku_puzzle_data(date_to_be_used):
    """
    Public-facing function to generate all Sudoku data for a given date
    by calling the external API.
    """
    try:
        grid = _fetch_one_sudoku_from_api()
        base_solution = grid.get("solution")

        solution_string = _flatten_board(base_solution)
        base_puzzle_string = _flatten_board(base_solution)

        puzzle_string_easy = _make_variant_from_base(base_puzzle_string, DEFAULT_EASY_BLANKS)
        puzzle_string_hard = _make_variant_from_base(base_puzzle_string, DEFAULT_HARD_BLANKS)

        # print(f"API base blanks: {base_puzzle_string.count('0')}")
        # print(f"Easy blanks: {puzzle_string_easy.count('0')}")
        # print(f"Hard blanks: {puzzle_string_hard.count('0')}")

        # print("EASY:", puzzle_string_easy)
        # print("HARD:",  puzzle_string_hard)

        # print("Same string?", puzzle_string_easy ==  puzzle_string_hard)

        return {
            "date_to_be_used": date_to_be_used,
            "solution_string": solution_string,
            "puzzle_string_easy": puzzle_string_easy,
            "puzzle_string_hard": puzzle_string_hard,
        }
    except Exception as exc:
        print(f"[games.api_client] Error fetching Sudoku: {exc}")
        # Return fallback data on error
        fb = get_random_fallback()
        return {
            "date_to_be_used": date_to_be_used,
            "solution_string": fb["solution"],
            "puzzle_string_easy": fb["easy"],
            "puzzle_string_hard": fb["hard"],
        }


# ----------------------------------------------------------------------
# B. NEWS/RSS API CLIENT (External Fetcher)
# ----------------------------------------------------------------------


def fetch_cleaned_news_articles():
    """Fetch and clean multiple RSS articles from the external API."""
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
            # Use BeautifulSoup to strip HTML/clean text
            clue_text = BeautifulSoup(desc_html, "html.parser").get_text(" ", strip=True)
            if title and clue_text:
                valid_articles.append({"title": title, "description": clue_text})
        return valid_articles[:10]
    except Exception as e:
        print(f"🛑 RSS fetch failed: {e}")
        return []
