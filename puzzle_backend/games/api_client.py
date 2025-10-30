# games/api_client.py
import pprint  # Add 'import pprint' at the top of api_client.py
import requests
import random
from .config import SUDOKU_API_BASE_URL, DEFAULT_EASY_BLANKS, DEFAULT_HARD_BLANKS

from .config import NEWS_API_BASE_URL, NEWS_API_FEED_PARAM
from bs4 import BeautifulSoup
import pprint

from .ai_service_ernigram import fetch_raw_csv_data, ErnigramGeneratorAI
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
    current_blanks = [i for i, ch in enumerate(arr) if ch == "0"]
    non_blank_indices = [i for i, ch in enumerate(arr) if ch != "0"]

    # how many additional blanks we need
    blanks_needed = max(0, blanks_target - len(current_blanks))
    if blanks_needed > 0 and non_blank_indices:
        # sample indices to blank
        to_blank = random.sample(
            non_blank_indices, min(blanks_needed, len(non_blank_indices))
        )
        for idx in to_blank:
            arr[idx] = "0"
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
            base_puzzle_string, DEFAULT_EASY_BLANKS
        )
        puzzle_string_hard = _make_variant_from_base(
            base_puzzle_string, DEFAULT_HARD_BLANKS
        )

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
        clue_text = BeautifulSoup(desc_html, "html.parser").get_text(" ", strip=True)
        if title and clue_text:
            valid_articles.append({"title": title, "description": clue_text})
    return valid_articles[:10]


def fetch_used_solution_phrases():
    """Fetches all solution phrases already used in the database."""
    # Assuming ErnigramPuzzle.objects.values_list() returns a queryset of tuples
    # and we want the unique phrase strings.
    # Note: Using .upper() assumes the stored phrases are in UPPERCASE.
    return set(ErnigramPuzzle.objects.values_list("solution_phrase", flat=True).all())


def find_dominant_theme(used_phrases):
    """Identifies the most common word/phrase segment in the recent history."""
    if not used_phrases:
        return None

    # Analyze history based on your themes (e.g., all UPPERCASE phrases)
    theme_counts = {}
    for phrase in used_phrases:
        if "DIGITAL TRANSFORMATION" in phrase.upper():
            theme_counts["DIGITAL TRANSFORMATION"] = (
                theme_counts.get("DIGITAL TRANSFORMATION", 0) + 1
            )

    # Example: If 'DIGITAL TRANSFORMATION' has appeared 3 or more times
    if theme_counts.get("DIGITAL TRANSFORMATION", 0) >= 3:
        return "DIGITAL TRANSFORMATION"
    return None


def generate_ernigram_puzzle_data(date_to_be_used):
    fallback_data = {
        "solution_phrase": "PYTHON PROGRAMMING",
        "clue": "General purpose language",
    }

    # --- CONFIGURATION FOR CSV ---
    CSV_FILE_PATH = "games/ERNI_Content.csv"
    RAW_TEXT_COLUMN_INDEX = 0
    # -----------------------------

    try:
        # 1. FETCH ALL DATA SOURCES

        # Source A: Structured Articles (RSS/News API)
        print("📰 Fetching structured news articles...")
        structured_articles = fetch_cleaned_news_articles()

        # Source B: Raw Text (CSV)
        print(f"📁 Fetching raw data from {CSV_FILE_PATH}...")
        raw_csv_texts = fetch_raw_csv_data(
            file_path=CSV_FILE_PATH, text_column_index=RAW_TEXT_COLUMN_INDEX
        )

        # 2. DETERMINE AVAILABLE SOURCES
        available_sources = []
        if structured_articles:
            available_sources.append("RSS")
        if raw_csv_texts:
            available_sources.append("CSV")

        if not available_sources:
            print("🛑 ERROR: No valid data available from RSS or CSV.")
            return fallback_data

        # 3. RANDOMLY SELECT THE SOURCE FOR TODAY'S PUZZLE
        # This is where randomization is implemented
        selected_source = random.choice(available_sources)
        print(f"🎲 Randomly selected source for today: {selected_source}")

        # 4. GET GLOBAL HISTORY AND DOMINANT THEME
        used_phrases = fetch_used_solution_phrases()
        dominant_theme = find_dominant_theme(used_phrases)

        # 5. INSTANTIATE AI AND ROUTE DATA
        ai = ErnigramGeneratorAI()

        if selected_source == "RSS":
            # --- RSS/STRUCTURED DATA PATH ---
            print("🤖 Routing structured articles to AI for selection...")
            # Note: The AI MUST handle the uniqueness check internally or the articles
            # should be pre-filtered using the initial approach. For simplicity,
            # we rely on the AI's internal logic for now.
            result = ai.generate_from_articles(structured_articles, used_phrases)

        elif selected_source == "CSV":
            # --- CSV/RAW TEXT DATA PATH ---
            print("🤖 Routing raw CSV text to AI for generation...")
            # Pass raw texts, used phrases, and the dominant theme constraint
            result = ai.generate_from_raw_text(
                raw_csv_texts, used_phrases, dominant_theme
            )

        # 6. RETURN RESULT
        print(f"✅ Generated phrase: {result.get('solution_phrase')}")
        return result

    except Exception as e:
        print(f"[games.services] Ernigram generation failed: {e}")
        return fallback_data
