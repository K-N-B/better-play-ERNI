# /games/services.py
import datetime
import os
import json
import csv
import random
from datetime import timedelta
from django.utils import timezone
from django.core.exceptions import ImproperlyConfigured, FieldError
from rapidfuzz import fuzz
from groq import Groq 
from django.db import connection

# Django Models and External I/O
from .models import WordlePuzzle, SudokuPuzzle, ErnigramPuzzle, DailyPuzzle, EmployeeImageSource
from .api_client import generate_sudoku_puzzle_data, fetch_cleaned_news_articles 


# --- Configuration ---
CSV_FILE_PATH = "games/ERNI_Content.csv" 
RAW_TEXT_COLUMN_INDEX = 0 
FUZZY_THRESHOLD = 80


# ----------------------------------------------------------------------
# A. WORDLE GENERATOR AI
# ----------------------------------------------------------------------

class WordleGeneratorAI:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ImproperlyConfigured("GROQ_API_KEY environment variable not set.")

        self.client = Groq(api_key=self.api_key)
        self.model_name = "llama-3.3-70b-versatile"

    def generate_wordle_puzzle_data(self, difficulty, existing_words=None):
        if existing_words is None:
            existing_words = []

        if difficulty == "EASY":
            min_length = max_length = 5
        else: # HARD
            min_length, max_length = 6, 10

        prompt = f"""
        You are a precise assistant that generates English words for a Wordle-style puzzle.

        RULES:
        1. Generate a single English word between {min_length} and {max_length} letters long.
        2. The word must be a valid, common English word (no proper nouns, abbreviations, or offensive terms).
        3. The word must be in ALL UPPERCASE letters.
        4. The word must NOT be any of these existing words: {', '.join(existing_words) or 'None'}.
        5. Respond in strict JSON format with one key only: "word".
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are an assistant that generates valid Wordle words in JSON format."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.9,
                max_tokens=100,
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
            puzzle_data = json.loads(content)
            word = puzzle_data.get("word", "").strip().upper()

            if not (min_length <= len(word) <= max_length):
                raise ValueError(f"Generated word length {len(word)} not within range {min_length}-{max_length}")

            return {"word": word}

        except Exception as e:
            return None

# --- MODIFIED FUNCTION: Adds client-side duplicate check ---
def _generate_unique_wordle_data(ai_generator, difficulty, existing_words):
    max_retries = 3
    
    for attempt in range(max_retries):
        print(f"Generating '{difficulty}' Wordle puzzle using AI (Attempt {attempt + 1}/{max_retries})...")
        
        puzzle_data = ai_generator.generate_wordle_puzzle_data(
            difficulty=difficulty,
            existing_words=existing_words
        )
        
        # 1. Validate data structure and required key
        if puzzle_data and puzzle_data.get('word'):
            word = puzzle_data['word']
            
            # 2. CRITICAL FIX: Reject Duplicates (Addresses Repetition Issue)
            if word in existing_words:
                print(f"❌ AI returned duplicate word '{word}'. Retrying attempt {attempt + 1}...")
                continue
            
            print(f"✓ AI generation successful for '{difficulty}' puzzle.")
            return {
                "solution_word": word, 
                "difficulty": difficulty
            }
        
        print(f"⚠ AI generation failed (invalid data returned) on attempt {attempt + 1}. Retrying...")
    
    raise Exception(
        f"AI failed to generate a valid puzzle for difficulty '{difficulty}' after {max_retries} attempts.")


# ----------------------------------------------------------------------
# B. ERNIGRAM GENERATOR AI AND HELPERS
# ----------------------------------------------------------------------

def fetch_raw_csv_data(file_path=CSV_FILE_PATH, text_column_index=RAW_TEXT_COLUMN_INDEX):
    raw_texts = []
    try:
        with open(file_path, mode='r', newline='', encoding='utf-8') as file:
            reader = csv.reader(file) 
            for row in reader:
                if len(row) > text_column_index:
                    text = row[text_column_index].strip()
                    if text:
                        raw_texts.append(text)
        print(f"📁 Successfully read {len(raw_texts)} raw text entries from CSV.")
    except Exception as e:
        print(f"⚠️ Error reading CSV: {e}")
    return raw_texts

def fetch_used_solution_phrases():
    return set(
        ErnigramPuzzle.objects
        .values_list("solution_phrase", flat=True)
        .all()
    )

def find_dominant_theme(used_phrases):
    if not used_phrases: return None
    theme_counts = {}
    for phrase in used_phrases:
        if "DIGITAL TRANSFORMATION" in phrase.upper(): 
            theme_counts["DIGITAL TRANSFORMATION"] = theme_counts.get("DIGITAL TRANSFORMATION", 0) + 1
    if theme_counts.get("DIGITAL TRANSFORMATION", 0) >= 3:
        return "DIGITAL TRANSFORMATION"
    return None

# --- MODIFIED FUNCTION: Now includes the primary key ('id') ---
def fetch_employee_image_data():
    print("📸 Fetching employee image metadata from database...")
    
    # CRITICAL: Include 'id' to link the ForeignKey field correctly
    employee_data = EmployeeImageSource.objects.filter(is_available=True).values(
        'id', 'employee_name', 'clue_context', 'image_file' 
    )
    
    formatted_data = []
    for data in employee_data:
        formatted_data.append({
            "id": data['id'], # The ID of the EmployeeImageSource object
            "name": data['employee_name'],
            "phrase": data['employee_name'].upper(),
            "clue_context": data['clue_context'],
            "image_filename": data['image_file'],
        })
        
    return formatted_data


class ErnigramGeneratorAI:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY")) 
        self.model = "meta-llama/llama-4-scout-17b-16e-instruct" 
        self.used_titles = set()
        self.FUZZY_THRESHOLD = 80

    # --- generate_from_articles (RSS Logic) ---
    def generate_from_articles(self, articles, used_phrases): 
        FUZZY_THRESHOLD = 90
        MAX_ATTEMPTS = 5
        
        available_articles = [
            article for article in articles
            if article.get('title', '').upper() not in used_phrases
        ]
        
        if not available_articles:
            return { "solution_phrase": "NO UNIQUE ARTICLES AVAILABLE", "clue": "All structured article titles have been previously used as solutions.", "employee_image_path": None }

        exclusion_list = ", ".join(used_phrases)
        
        for attempt in range(1, MAX_ATTEMPTS + 1):
            print(f"🤖 Attempt {attempt}: Selecting from {len(available_articles)} filtered articles.")

            prompt = f"""
            You are a creative assistant that turns news headlines into puzzles.
            
            **CRITICAL RULE 1: The generated 'solution_phrase' must be UNIQUE. DO NOT generate any phrase that is an exact match or extremely similar to phrases listed in the EXCLUSION LIST below.**
            ... (Your full complex prompt here) ...
            
            Here are the *available* articles:
            {json.dumps(available_articles, indent=2)}
            """

            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You generate subtle clues for puzzle headlines. Respond only with the required JSON object."},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=1.2,
                    max_tokens=500, # CRITICAL FIX: Increased tokens
                    response_format={"type": "json_object"},
                )

                raw_json = response.choices[0].message.content
                
                # CRITICAL FIX: Defensive JSON Parsing
                result = json.loads(raw_json)
                phrase = result.get("solution_phrase", "").upper().strip()
                if not phrase:
                    raise ValueError("AI returned JSON missing solution_phrase.")
                # END Defensive Parsing

                is_unique_by_fuzzy_check = True
                for used_phrase in used_phrases:
                    similarity_score = fuzz.token_sort_ratio(phrase, used_phrase)
                    if similarity_score >= FUZZY_THRESHOLD:
                        is_unique_by_fuzzy_check = False
                        print(f"❌ Phrase '{phrase}' (Score: {similarity_score}) is too similar to used phrase '{used_phrase}'.")
                        break
                
                if is_unique_by_fuzzy_check:
                    print(f"✅ Unique phrase found from RSS source: {phrase}")
                    return { "solution_phrase": phrase, "clue": result["clue"].strip(), "employee_image_path": None }
                else:
                    continue 

            except (json.JSONDecodeError, ValueError) as e:
                print(f"⚠️ Data/JSON error on attempt {attempt}: {e}. Retrying...")
                continue 
            except Exception as e:
                print(f"⚠️ Groq API failure on attempt {attempt}: {e}")
                continue 

        return { "solution_phrase": "RSS UNIQUE GENERATION FAILED", "clue": "The AI could not generate a unique phrase...", "employee_image_path": None }

    # --- generate_from_raw_text (CSV Logic) ---
    def generate_from_raw_text(self, raw_text_list, used_phrases, dominant_theme=None):
        if not raw_text_list:
            return { "solution_phrase": "NO RAW DATA PROVIDED", "clue": "..." }

        # Format the text blocks with a persistent index for the AI to reference
        indexed_texts = [
            f"--- BLOCK {i+1} ---\n{text}" 
            for i, text in enumerate(raw_text_list)
        ]
        
        exclusion_list = ", ".join(used_phrases)
        MAX_ATTEMPTS = 5
        FUZZY_THRESHOLD = 80
        
        # This set will keep track of the block numbers we've tried that resulted in a non-unique phrase
        attempted_block_indices = set()

        theme_constraint = ""
        if dominant_theme:
            theme_constraint = f"**ULTRA CRITICAL RULE: The dominant theme '{dominant_theme}' has been used too often recently. You MUST select a block of text that is NOT about this theme.**"

        for attempt in range(1, MAX_ATTEMPTS + 1):
            
            # On each attempt, filter out the blocks that have already failed the uniqueness check
            available_blocks = [
                block for i, block in enumerate(indexed_texts) 
                if (i + 1) not in attempted_block_indices
            ]
            
            if not available_blocks:
                print("🛑 All available raw texts have been exhausted during uniqueness retries.")
                break # Exit the loop if nothing is left

            print(f"🤖 Attempt {attempt}: Selecting from {len(available_blocks)} remaining blocks.")
            
            prompt = f"""
            You are a puzzle assistant. Your task is to generate a puzzle based *ONLY* on the provided text blocks.

            **HERE IS YOUR TASK:**
            1.  **READ ALL** of the following text blocks provided under "AVAILABLE TEXT BLOCKS".
            2.  **SELECT EXACTLY ONE** block that you will use as the source for your puzzle.
            3.  **SUMMARIZE** the core idea, action, or outcome of your selected block into a short, 3-5 word "solution_phrase" in UPPERCASE.
            4.  Create a two-sentence "clue" that hints at the content of your selected block without using any words from the solution phrase.
            5.  Identify the block number you used (e.g., if you used "--- BLOCK 123 ---", the number is 123).

            **CRITICAL RULES:**
            -   **RULE 1: YOU MUST BASE YOUR 'solution_phrase' DIRECTLY ON THE CONTENT OF A BLOCK YOU SELECTED.** Do not invent a generic phrase. It must be a specific summary of a single block.
            -   **RULE 2:** The 'solution_phrase' must NOT be one of the phrases in the EXCLUSION LIST: {exclusion_list or "NONE"}
            -   **RULE 3: PROMOTE VARIETY.** On each attempt, try to summarize a block with a different core concept than your previous attempt. If you just summarized a block about 'engineering', find a block about 'business', 'design', or 'consulting' for the next attempt.
            -   {theme_constraint}

            **AVAILABLE TEXT BLOCKS:**
            {json.dumps(available_blocks, indent=2)}
            
            **YOUR RESPONSE FORMAT:**
            Return a strict JSON object with three keys: "solution_phrase", "clue", and "source_block_number".

            Example of a perfect response:
            {{
            "solution_phrase": "TAILORED SOFTWARE SOLUTIONS",
            "clue": "This service provides custom digital tools for specific business needs. The final product is built to precise client requirements.",
            "source_block_number": 42
            }}
            """

            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "system", "content": "You are a puzzle generator that strictly follows instructions. Your only output is the required JSON object."}, {"role": "user", "content": prompt}],
                    temperature=1.0,
                    max_tokens=500,
                    response_format={"type": "json_object"},
                )
                
                raw_json = response.choices[0].message.content
                result = json.loads(raw_json)
                
                # Use safe .get() to prevent crashes
                phrase = result.get("solution_phrase", "").upper().strip()
                clue = result.get("clue", "No clue provided.").strip()
                source_block_num = result.get("source_block_number")

                if not phrase:
                    raise ValueError("AI response did not contain a 'solution_phrase' key.")

                print(f"🤖 AI generated phrase '{phrase}' from source block #{source_block_num or 'Unknown'}.")
                
                is_unique = True
                for used_phrase in used_phrases:
                    if fuzz.token_sort_ratio(phrase, used_phrase) >= FUZZY_THRESHOLD:
                        print(f"❌ Phrase '{phrase}' is too similar to used phrase '{used_phrase}'.")
                        is_unique = False
                        # IMPORTANT: Add the failed block number to our set of attempted blocks
                        if isinstance(source_block_num, int):
                            attempted_block_indices.add(source_block_num)
                        break # No need to check other used phrases
                
                if is_unique:
                    print(f"✅ Unique phrase found: {phrase}")
                    # We don't need to return the source block number, but it was great for debugging.
                    return { "solution_phrase": phrase, "clue": clue, "employee_image_path": None }
                else:
                    # If not unique, the loop will continue to the next attempt with one less block available.
                    continue

            except (json.JSONDecodeError, ValueError) as e:
                print(f"⚠️ Data/JSON error on attempt {attempt}: {e}. Retrying...")
                continue 
            except Exception as e:
                print(f"⚠️ Groq API failure on attempt {attempt}: {e}")
                continue 

        # This is the final fallback if the loop finishes without a unique phrase
        return {
            "solution_phrase": "NO UNIQUE PUZZLE AVAILABLE",
            "clue": "The AI could not generate a unique phrase after multiple attempts from the available text."
        }


    # --- MODIFIED FUNCTION: Returns object ID instead of path ---
    def generate_from_employee_data(self, employee_data, used_phrases):
        available = [e for e in employee_data if e['phrase'] not in used_phrases]
        selected = random.choice(available) if available else None
        
        if not selected:
             raise ValueError("All employee names have been used as Ernigram solutions.")
            
        fixed_clue = "Better ask employee" 
        
        # CRITICAL CHANGE: Return the ID of the source object
        return {
            "solution_phrase": selected['phrase'],
            "clue": fixed_clue, 
            "employee_source_id": selected['id'] # Returns the ID (PK)
        }

# ----------------------------------------------------------------------
# C. MAIN SCHEDULER LOGIC
# ----------------------------------------------------------------------

def generate_ernigram_puzzle_data(date_to_be_used):
    """
    Orchestrates Ernigram puzzle generation by randomly selecting a source and
    intelligently falling back to other available sources upon failure.
    """
    print("\n--- Starting Randomized Ernigram Generation ---")

    # 1. PREPARE ALL DATA SOURCES AND HISTORY
    # It's efficient to gather all potential "ingredients" at once.
    all_structured_articles = fetch_cleaned_news_articles()
    all_employee_images = fetch_employee_image_data()
    all_raw_csv_texts = fetch_raw_csv_data()
    used_phrases = fetch_used_solution_phrases()
    dominant_theme = find_dominant_theme(used_phrases)

    # 2. BUILD THE LIST OF AVAILABLE SOURCES
    # Create a list of "tickets", where each ticket contains the name of the
    # source and the actual data it will use.
    available_sources = []
    if all_structured_articles:
        available_sources.append({"name": "RSS", "data": all_structured_articles})
    if all_employee_images:
        available_sources.append({"name": "EMPLOYEE", "data": all_employee_images})
    if all_raw_csv_texts:
        available_sources.append({"name": "CSV", "data": all_raw_csv_texts})

    # If no sources have any data, we can't proceed.
    if not available_sources:
        print("🚨 No data sources are available. Returning fallback.")
        return {
            "solution_phrase": "NO DATA SOURCES",
            "clue": "All potential data sources (RSS, CSV, Employee) are empty.",
            "employee_source_id": None
        }

    # 3. SHUFFLE THE SOURCES FOR RANDOMNESS
    # This is the key to the randomness you wanted.
    random.shuffle(available_sources)
    print(f"Randomized source order: {[source['name'] for source in available_sources]}")

    # Instantiate the AI generator once to be used by any source that needs it.
    ai = ErnigramGeneratorAI()

    # 4. THE FALLBACK LOOP: TRY EACH SOURCE IN THE RANDOMIZED ORDER
    for source in available_sources:
        source_name = source["name"]
        source_data = source["data"]  # This is the actual list of articles, employees, etc.
        
        print(f"➡️ Trying randomly selected source: {source_name}...")
        result = {}
        try:
            # Route to the correct generation method based on the source's name
            if source_name == "EMPLOYEE":
                result = ai.generate_from_employee_data(source_data, used_phrases)
            elif source_name == "RSS":
                result = ai.generate_from_articles(source_data, used_phrases)
            elif source_name == "CSV":
                result = ai.generate_from_raw_text(source_data, used_phrases, dominant_theme)
            
            # --- CRITICAL QUALITY CHECK ---
            # After trying a source, we MUST validate its output before accepting it.
            generated_phrase = result.get('solution_phrase', '').upper()
            failure_keywords = ["NO UNIQUE", "FAILED", "NO DATA", "NOT IMPLEMENTED"]

            if generated_phrase and not any(keyword in generated_phrase for keyword in failure_keywords):
                print(f"✅ Success! Generated puzzle from '{source_name}': '{generated_phrase}'")
                # A valid puzzle was generated. Return it immediately and exit the function.
                return result
            else:
                # This source FAILED to produce a valid phrase.
                # Log it and let the loop continue to the next available source.
                print(f"❌ Source '{source_name}' failed. Reason: '{generated_phrase}'. Trying next source...")

        except Exception as e:
            # This catches any unexpected crashes within a generation method (like a ValueError).
            print(f"❌ Source '{source_name}' crashed with an exception: {e}. Trying next source...")
            continue # Go to the next source in the shuffled list

    # 5. FINAL FALLBACK
    # This code is only ever reached if the 'for' loop finishes without a single success.
    print("🚨 All available data sources were tried and failed to generate a unique puzzle.")
    return {
        "solution_phrase": "ALL SOURCES FAILED",
        "clue": "Every available data source was attempted without success.",
        "employee_source_id": None
    }


# --- Wordle Helper (uses corrected logic above) ---
# (The code for _generate_unique_wordle_data is included above, before generate_ernigram_puzzle_data)


def generate_daily_puzzles(target_date: datetime.date = None) -> DailyPuzzle:
    """
    Generates a full set of daily puzzles for the target date.
    """
    if target_date is None:
        target_date = timezone.now().date()
    print(f"Generating daily puzzles for date: {target_date}")

    # 1. Initialize the AI service
    ai_generator = WordleGeneratorAI()

    # 2. Fetch recent words to avoid repetition
    thirty_days_ago = target_date - timedelta(days=30)
    existing_words = list(
        WordlePuzzle.objects.filter(
            date_to_be_used__gte=thirty_days_ago
        ).values_list('solution_word', flat=True)
    )
    existing_words = [word.upper() for word in existing_words if word]

    # 3. Generate individual puzzle data
    wordle_easy_data = _generate_unique_wordle_data(
        ai_generator, 'EASY', existing_words)
    if wordle_easy_data.get('solution_word'):
        existing_words.append(wordle_easy_data['solution_word'])
    wordle_hard_data = _generate_unique_wordle_data(
        ai_generator, 'HARD', existing_words)

    sudoku_data = generate_sudoku_puzzle_data(target_date) # From api_client.py
    ernigram_data = generate_ernigram_puzzle_data(target_date) # From local func above


    connection.close()
    # 4. Create/Get the puzzle objects in the database
    
    # Wordle Easy/Hard updates
    wordle_easy, _ = WordlePuzzle.objects.update_or_create(
        date_to_be_used=target_date,
        difficulty=wordle_easy_data['difficulty'],
        defaults=wordle_easy_data
    )
    wordle_hard, _ = WordlePuzzle.objects.update_or_create( 
        date_to_be_used=target_date,
        difficulty=wordle_hard_data['difficulty'],
        defaults=wordle_hard_data
    )

    # Sudoku
    sudoku_data.pop("date_to_be_used", None)
    sudoku, created = SudokuPuzzle.objects.get_or_create(
        date_to_be_used=target_date, defaults=sudoku_data)

    # Ernigram (CRITICAL FOREIGN KEY ASSIGNMENT FIX)
    
    # We retrieve the source ID if it was generated (employee puzzle)
    employee_source_id = ernigram_data.pop("employee_source_id", None) 
    
    # The image path is technically still needed for non-employee puzzles if you ever need a file reference
    employee_image_path = ernigram_data.pop("employee_image_path", None) 

    # Prepare defaults dictionary
    ernigram_defaults = {
        "solution_phrase": ernigram_data['solution_phrase'],
        "clue": ernigram_data['clue'],
    }
    
    # CRITICAL FIX: Assign the ID to the correct ForeignKey field name
    if employee_source_id is not None:
        ernigram_defaults['employee_source_id'] = employee_source_id 

    # Create the Ernigram puzzle
    ernigram, _ = ErnigramPuzzle.objects.get_or_create(
        date_to_be_used=target_date, 
        defaults=ernigram_defaults
    )

    # 5. Link them all in the DailyPuzzle object
    daily_puzzle_set, created = DailyPuzzle.objects.get_or_create(
        date=target_date,
        defaults={
            "wordle_easy": wordle_easy,
            "wordle_hard": wordle_hard,
            "sudoku": sudoku,
            "ernigram": ernigram
        }
    )

    if created:
        print(f"🎉 Successfully completed Daily Puzzle Set for {target_date}!")
    else:
        print(f"⚠️ Daily Puzzle Set for {target_date} was already complete.")

    return daily_puzzle_set