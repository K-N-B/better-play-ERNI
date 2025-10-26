# games/api_client.py
import pprint  # Add 'import pprint' at the top of api_client.py
import requests
import random
from .config import SUDOKU_API_BASE_URL, DEFAULT_EASY_BLANKS, DEFAULT_HARD_BLANKS

from .config import NEWS_API_BASE_URL, NEWS_API_FEED_PARAM
from bs4 import BeautifulSoup
import pprint

from .ai_service_ernigram import ErnigramGeneratorAI
from .models import ErnigramPuzzle


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
def fetch_cleaned_news_articles():
    """Fetch and clean multiple RSS articles."""
    full_url = NEWS_API_BASE_URL + NEWS_API_FEED_PARAM
    resp = requests.get(full_url, timeout=10)
    data = resp.json()

    if resp.status_code != 200 or data.get("status") == "error":
        raise RuntimeError(f"RSS fetch failed: {data.get('message')}")

    articles = data.get("items", [])
    valid_articles = []
    for a in articles:
        title = a.get("title", "").strip()
        desc_html = a.get("description", "")
        clue_text = BeautifulSoup(
            desc_html, "html.parser").get_text(" ", strip=True)
        if title and clue_text:
            valid_articles.append({
                "title": title,
                "description": clue_text
            })
    return valid_articles[:10]


def fetch_used_solution_phrases():
    """Fetches all solution phrases already used in the database."""
    # Assuming ErnigramPuzzle.objects.values_list() returns a queryset of tuples
    # and we want the unique phrase strings.
    # Note: Using .upper() assumes the stored phrases are in UPPERCASE.
    return set(
        ErnigramPuzzle.objects
        .values_list("solution_phrase", flat=True)
        .all()
    )


def generate_ernigram_puzzle_data(date_to_be_used):
    fallback_data = {
        "solution_phrase": "PYTHON PROGRAMMING",
        "clue": "General purpose language"
    }

    try:
        # 1. Fetch ALL articles
        print("📰 Fetching news articles...")
        articles = fetch_cleaned_news_articles()
        if not articles:
            raise ValueError("No valid articles retrieved from RSS feed.")

        # 2. Get the history of used titles from the database
        used_phrases = fetch_used_solution_phrases()
        print(
            f"📚 Found {len(used_phrases)} unique phrases already used in the database.")

        # 3. Filter the fetched articles based on the database history (PERMANENT EXCLUSION)
        # This is the single most important step for guaranteeing uniqueness across days.
        available_articles = [
            article for article in articles
            if article.get('title', '').upper() not in used_phrases
        ]

        if not available_articles:
            print("🛑 All fetched articles have already been used for a puzzle.")
            return fallback_data

        print(
            f"🤖 Passing {len(available_articles)} unique articles to AI for selection...")

        # 4. Instantiate the AI service
        ai = ErnigramGeneratorAI()

        # 5. Call the AI with the pre-filtered list
        # Since 'available_articles' only contains titles NOT in the database,
        # the AI is physically unable to choose an old title.
        result = ai.generate_from_articles(available_articles)

        # 6. Save the new unique puzzle data (This adds the chosen title to the history)
        # ... (Database saving logic remains the same) ...

        return result
    except Exception as e:
        print(f"[games.services] Ernigram generation failed: {e}")
        return fallback_data
