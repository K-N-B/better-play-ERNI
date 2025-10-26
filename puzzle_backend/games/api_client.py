# games/api_client.py
import pprint  # Add 'import pprint' at the top of api_client.py
import requests
import random
from .config import SUDOKU_API_BASE_URL, DEFAULT_EASY_BLANKS, DEFAULT_HARD_BLANKS

from .config import NEWS_API_BASE_URL, NEWS_API_FEED_PARAM
from bs4 import BeautifulSoup
import pprint


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
    return "".join(flattened)  # length 81


def _fetch_one_sudoku_from_api():
    query = "?query={newboard(limit:1){grids{value,solution,difficulty}}}"
    # Use the imported constant
    resp = requests.get(SUDOKU_API_BASE_URL + query, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    grids = data.get("newboard", {}).get("grids", [])
    if not grids:
        raise RuntimeError("Sudoku API returned no grids")
    grid = grids[0]
    return grid  # contains 'value' and 'solution' at minimum


def _make_variant_from_base(base_string: str, blanks_target: int) -> str:
    """
    base_string: 81-char string with digits '0'-'9' (0 means blank)
    blanks_target: total blanks desired (including existing blanks)
    This function will randomly turn some non-zero cells to '0' until the
    total number of '0's equals blanks_target (or as many as possible).
    """
    if len(base_string) != 81:
        raise ValueError("base_string must be length 81")

    # convert to list for mutation
    arr = list(base_string)
    current_blanks = [i for i, ch in enumerate(arr) if ch == '0']
    non_blank_indices = [i for i, ch in enumerate(arr) if ch != '0']

    # how many additional blanks we need
    blanks_needed = max(0, blanks_target - len(current_blanks))
    if blanks_needed > 0 and non_blank_indices:
        # sample indices to blank
        to_blank = random.sample(non_blank_indices, min(
            blanks_needed, len(non_blank_indices)))
        for idx in to_blank:
            arr[idx] = '0'
    return "".join(arr)


def generate_sudoku_puzzle_data(date_to_be_used):
    """
    Public-facing function to generate all Sudoku data for a given date.
    """
    try:
        grid = _fetch_one_sudoku_from_api()
        base_puzzle = grid.get("value")
        base_solution = grid.get("solution")

        solution_string = _flatten_board(base_solution)
        base_puzzle_string = _flatten_board(base_puzzle)

        # Build variants using imported constants
        puzzle_string_easy = _make_variant_from_base(
            base_puzzle_string, DEFAULT_EASY_BLANKS)
        puzzle_string_hard = _make_variant_from_base(
            base_puzzle_string, DEFAULT_HARD_BLANKS)

        return {
            "date_to_be_used": date_to_be_used,
            "solution_string": solution_string,
            "puzzle_string_easy": puzzle_string_easy,
            "puzzle_string_hard": puzzle_string_hard,
        }
    except Exception as exc:
        print(f"[games.api_client] Error fetching Sudoku: {exc}")
        # Return fallback data on error
        fallback = "0" * 81
        return {
            "date_to_be_used": date_to_be_used,
            "solution_string": fallback,
            "puzzle_string_easy": fallback,
            "puzzle_string_hard": fallback,
        }


# --- PUBLIC ERNIGRAM GENERATOR ---
def generate_ernigram_puzzle_data(date_to_be_used):
    fallback_data = {
        "solution_phrase": "PYTHON PROGRAMMING",
        "clue": "General purpose language"
    }

    try:
        # Construct the full URL using the new constants
        full_url = NEWS_API_BASE_URL + NEWS_API_FEED_PARAM

        # DEBUG STEP 1: Print the request URL
        print(f"DEBUG: Attempting RSS API call for URL: {full_url}")

        resp = requests.get(full_url, timeout=5)

        data = resp.json()

        # <<< CRITICAL DEBUGGING LINE >>>
        pprint.pprint(data)

        if resp.status_code != 200:
            print(
                f"DEBUG: HTTP Status Error: {resp.status_code}. Response Text: {resp.text[:150]}...")
            resp.raise_for_status()

        data = resp.json()

        # RSS2JSON uses 'items' array instead of 'articles'
        articles = data.get("items", [])

        # Check for RSS2JSON status, which uses 'ok' or 'error'
        api_status = data.get("status")
        print(
            f"DEBUG: RSS2JSON Status: {api_status}, Items found: {len(articles)}")

        if api_status == 'error':
            raise RuntimeError(
                f"RSS2JSON returned an error: {data.get('message')}")

        if not articles:
            raise RuntimeError("RSS API returned no articles in 'items'.")

        # Filter and process articles
        valid_articles = [
            a for a in articles
            # RSS titles usually don't have the " - Source" separator, so we remove that filter.
            # We also check for 'description' availability for the clue.
            if a.get('title') and a.get('description') and len(a['title'].split()) > 3
        ]

        article = random.choice(valid_articles)

        # Process the chosen article: title becomes the solution
        solution_phrase = article['title'].strip().upper()

        print(
            f"DEBUG: Articles remaining after filtering: {len(valid_articles)}")

        if not valid_articles:
            raise RuntimeError(
                "No suitable article found for Ernigram after filtering.")

        article = random.choice(valid_articles)

        # Process the chosen article: title becomes the solution, description becomes the clue
        solution_phrase = article['title'].strip().upper()

        # --- FIX IS HERE: Use BeautifulSoup to clean the clue ---

        # 1. Get the raw HTML string
        raw_clue_html = article['description'].strip()

        # 2. Use BeautifulSoup to parse the HTML and extract only the text
        soup = BeautifulSoup(raw_clue_html, 'html.parser')

        # get_text() extracts all text content, stripping all HTML tags
        clue = soup.get_text(separator=' ', strip=True)

        # 3. Limit the length for the final clue
        clue = clue[:120].strip() + "..."

        # Final return statement
        return {
            "solution_phrase": solution_phrase,
            "clue": clue,
            "date_to_be_used": date_to_be_used,  # Include date_to_be_used
        }

    except Exception as exc:
        print(f"[games.api_client] Error fetching Ernigram news: {exc}")
        return fallback_data
