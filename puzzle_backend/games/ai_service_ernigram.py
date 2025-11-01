import os
import json
from groq import Groq
import csv
from rapidfuzz import fuzz
from random import random

# Assuming you have imported your CSV helper function and the main logic:
# from your_other_file import fetch_raw_csv_data, generate_ernigram_puzzle_data


# --- CSV-based version of fetch_used_solution_phrases ---
# --- NEW HELPER FUNCTION FOR CSV ---


def fetch_raw_csv_data(file_path="ERNI_Content.csv", text_column_index=0):
    """
    Reads all text from a specified column index in a local CSV file
    that is assumed to have NO HEADER.

    Returns: A list of raw text strings, one for each row.
    """
    raw_texts = []
    try:
        with open(file_path, mode="r", newline="", encoding="utf-8") as file:
            # Using csv.reader for files without a header row
            reader = csv.reader(file)

            # Iterate through each row (which is a list of column values)
            for row in reader:
                # Check if the row is not empty and has the required column index
                if len(row) > text_column_index:
                    text = row[text_column_index].strip()  # Access by index
                    if text:
                        raw_texts.append(text)
        print(f"📁 Successfully read {len(raw_texts)} raw text entries from CSV.")
    except FileNotFoundError:
        print(f"⚠️ Error: CSV file not found at {file_path}. Please check the path.")
    except IndexError:
        print(
            f"⚠️ Error: CSV row is too short. It does not have data at column index {text_column_index}."
        )
    except Exception as e:
        print(f"⚠️ Error reading CSV: {e}")

    return raw_texts


# --- END NEW HELPER FUNCTION ---


class ErnigramGeneratorAI:
    def __init__(self):
        # The key is read from the environment variables (e.g., .env file or shell export)
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        # Using a model with a larger context window and better reasoning
        self.model = "meta-llama/llama-4-scout-17b-16e-instruct"
        # New: A set to store the titles of articles already used.
        self.used_titles = set()

        # The key is read from the environment variables (e.g., .env file or shell export)
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY")) 
        # Using a model with a larger context window and better reasoning
        self.model = "meta-llama/llama-4-scout-17b-16e-instruct" 
        # New: A set to store the titles of articles already used.
        self.used_titles = set()

    # --- FULLY IMPLEMENTED METHOD FOR STRUCTURED DATA (RSS/News) ---
    def generate_from_articles(self, articles, used_phrases):

        # Define the fuzziness threshold (Adjust this value based on desired strictness)
        FUZZY_THRESHOLD = 90  # 100 = exact match; 90 = very similar
        MAX_ATTEMPTS = 5

        # 1. INITIAL FILTER: Filter out articles whose exact title was used as a solution phrase
        available_articles = [
            article for article in articles if article.get("title", "").upper() not in used_phrases
        ]

        if not available_articles:
            print("🛑 All initial RSS articles have titles matching historical solution phrases.")
            return {
                "solution_phrase": "NO UNIQUE ARTICLES AVAILABLE",
                "clue": "All structured article titles have been previously used as solutions.",
            }

        exclusion_list = ", ".join(used_phrases)

        for attempt in range(1, MAX_ATTEMPTS + 1):
            print(
                f"🤖 Attempt {attempt}: Selecting from {len(available_articles)} filtered articles."
            )

            prompt = f"""
            You are a creative assistant that turns news headlines into puzzles.
            Given a list of available structured articles, pick one that is most interesting for a puzzle.
            **CRITICAL RULE 1: The generated 'solution_phrase' must be UNIQUE. DO NOT generate any phrase that is an exact match or extremely similar to phrases listed in the EXCLUSION LIST below.**
            **CRITICAL RULE 2: Choose a headline that offers the best blend of relevance and novelty.**
            **EXCLUSION LIST (Phrases to avoid):** {exclusion_list or "NONE"}
            Then respond with:
            1. Create a short "solution_phrase" — a concise 3–5 word summary inspired by the chosen article/headline, written in UPPERCASE.
            - Must NOT include punctuation or symbols.
            2. Create a "clue" — a two-sentence hint that:
            - Relates to the story naturally.
            - Does NOT reuse any words from the title or the solution phrase.
            Return strict JSON format:
            {{
                "solution_phrase": "...",
                "clue": "..."
            }}
            Here are the *available* articles:
            {json.dumps(available_articles, indent=2)}
            """

            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You generate subtle clues for puzzle headlines. Respond only with the required JSON object.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=1.2,
                    max_tokens=250,
                    response_format={"type": "json_object"},
                )

                raw_json = response.choices[0].message.content
                result = json.loads(raw_json)
                phrase = result["solution_phrase"].upper().strip()

                # --- FUZZY UNIQUENESS CHECK ---
                is_unique_by_fuzzy_check = True
                for used_phrase in used_phrases:
                    # Use token_sort_ratio for robust comparison (ignores word order/spacing)
                    similarity_score = fuzz.token_sort_ratio(phrase, used_phrase)

                    if similarity_score >= FUZZY_THRESHOLD:
                        is_unique_by_fuzzy_check = False
                        print(
                            f"❌ Phrase '{phrase}' (Score: {similarity_score}) is too similar to used phrase '{used_phrase}'."
                        )
                        break
                # -----------------------------

                # 4. Final check for uniqueness (Fuzzy check passed)
                if is_unique_by_fuzzy_check:
                    print(f"✅ Unique phrase found from RSS source: {phrase}")
                    return {"solution_phrase": phrase, "clue": result["clue"].strip()}

                else:
                    # If fuzzy match failed, the phrase is too similar, so we retry.
                    continue

            except Exception as e:
                print(f"⚠️ Groq API failure on attempt {attempt}: {e}")
                # Log the error and continue to the next attempt.
                continue

        # 5. Fallback if the loop finishes without a unique phrase
        return {
            "solution_phrase": "RSS UNIQUE GENERATION FAILED",
            "clue": "The AI could not generate a unique phrase from the RSS articles after multiple attempts.",
        }

    # --- NEW METHOD FOR RAW CSV DATA ---
    def generate_from_raw_text(
        self, raw_text_list, used_phrases, dominant_theme=None
    ):  # <--- ACCEPT HISTORY
        if not raw_text_list:
            # ... (Return NO RAW DATA) ...
            return {"solution_phrase": "NO RAW DATA PROVIDED", "clue": "..."}

        # Combine text blocks with an index for easy reference in the prompt
        indexed_texts = [f"--- BLOCK {i+1} ---\n{text}" for i, text in enumerate(raw_text_list)]
        # input_text = "\n\n".join(indexed_texts)

        # 1. Prepare exclusion list for the AI (for its first choice)
        exclusion_list = ", ".join(used_phrases)

        # 2. Define the retry loop and the list of blocks we've already tried
        MAX_ATTEMPTS = 5
        attempted_blocks = set()

        theme_constraint = ""
        if dominant_theme:
            theme_constraint = f"""
            **ULTRA CRITICAL RULE: The dominant theme '{dominant_theme}' has been used too often recently. You MUST select a block of text that is NOT about this theme, or generate a phrase that does NOT use those specific words.**
            """
        FUZZY_THRESHOLD = 80

        for attempt in range(1, MAX_ATTEMPTS + 1):

            # 3. Create a list of blocks that are still available to the AI
            available_blocks = [
                block for i, block in enumerate(indexed_texts) if i + 1 not in attempted_blocks
            ]

            if not available_blocks:
                print("🛑 All available raw texts have been exhausted.")
                break  # Exit the loop if nothing is left

            print(f"🤖 Attempt {attempt}: Selecting from {len(available_blocks)} remaining blocks.")

            prompt = f"""
            You are a puzzle assistant. Your goal is to select ONE text block from the available list, summarize it, and create a unique puzzle.
            **CRITICAL RULE 1: The generated 'solution_phrase' must be UNIQUE. DO NOT generate any of the phrases listed in the EXCLUSION LIST below.**
            **CRITICAL RULE 2: If a generated phrase is deemed too common (like 'DIGITAL TRANSFORMATION'), choose a more specific phrase or a different block of text on the NEXT attempt.**
            **EXCLUSION LIST:** {exclusion_list or "NONE"}

            {theme_constraint}

            **AVAILABLE TEXT BLOCKS:**
            {json.dumps(available_blocks, indent=2)}
            Generate the puzzle based on the SELECTED block:
            A. Create a short "solution_phrase" — a concise 3–5 word summary inspired by the selected text, written in UPPERCASE.
            - MUST NOT be a generic summary of the entire industry (e.g., avoid using 'DIGITAL TRANSFORMATION' or 'TECHNOLOGICAL CHANGE' as the main subject).
            - Instead, focus on a **SPECIFIC ACTION, BENEFIT, or RESULT** mentioned in the text (e.g., 'DRIVING BUSINESS SUCCESS' or 'TAILORED SOFTWARE SOLUTIONS').
            - Must NOT include punctuation or symbols...
            B. Create a "clue" — a two-sentence hint that:
            - Relates to the content...
            - Does NOT reuse any words...
            Return strict JSON format: {{"solution_phrase": "...", "clue": "..."}}
            """

            try:
                response = self.client.chat.completions.create(
                    # ... (API call parameters: model, messages, temperature, max_tokens, response_format) ...
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a puzzle generator. Your only output is the required JSON object.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=1.2,
                    max_tokens=350,
                    response_format={"type": "json_object"},
                )

                raw_json = response.choices[0].message.content
                result = json.loads(raw_json)
                phrase = result["solution_phrase"].upper().strip()

                # --- NEW FUZZY CHECK LOGIC ---
                is_unique_by_fuzzy_check = True

                # Check against every used phrase in the history
                for used_phrase in used_phrases:
                    # Use token_sort_ratio for robust comparison (ignores word order)
                    similarity_score = fuzz.token_sort_ratio(phrase, used_phrase)

                    if similarity_score >= FUZZY_THRESHOLD:
                        is_unique_by_fuzzy_check = False
                        print(
                            f"❌ Phrase '{phrase}' (Score: {similarity_score}) is too similar to used phrase '{used_phrase}'."
                        )
                        break  # Found a conflict, no need to check other used phrases
                # -----------------------------
                # 4. Final check for uniqueness (Now includes the fuzzy check)
                if is_unique_by_fuzzy_check:
                    print(f"✅ Unique phrase found: {phrase}")
                    return {"solution_phrase": phrase, "clue": result["clue"].strip()}

                else:
                    # If it's not unique due to the fuzzy check, retry with a new block
                    print(f"❌ Phrase '{phrase}' is NOT unique (Fuzzy match failed). Retrying.")
                    continue  # Continue to the next attempt

            except Exception as e:
                print(f"⚠️ Groq API failure on attempt {attempt}: {e}")
                # Log the error and continue to the next attempt or break.
                continue

        # 5. Fallback if the loop finishes without a unique phrase
        return {
            "solution_phrase": "NO UNIQUE PUZZLE AVAILABLE",
            "clue": "The AI could not generate a unique phrase after multiple attempts.",
        }

    def generate_from_employee_data(self, employee_data, used_phrases):
        """
        Generates an Ernigram puzzle based on an employee image source.
        Returns: solution_phrase (Name), clue (Fixed), and employee_image_path.
        """
        
        # 1. Select a random employee whose name hasn't been used (based on 'phrase')
        available = [e for e in employee_data if e['phrase'] not in used_phrases]
        
        if not available:
            # Fallback if all employee names have been used
            raise ValueError("All employee names have been used as Ernigram solutions.")
            
        selected = random.choice(available)
        
        # 2. Define the fixed clue as per the requirement
        fixed_clue = "Better ask employee" # Matches your sample output!
        
        return {
            "solution_phrase": selected['phrase'],
            "clue": fixed_clue, 
            # The image path/reference stored in the database's ImageField
            "employee_image_path": selected['image_filename']
        }
# --- END OF CLASS ---
