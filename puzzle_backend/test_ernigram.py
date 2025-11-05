import json
import os
import random
from rapidfuzz import fuzz
from unittest.mock import MagicMock
from typing import List, Dict, Set, Optional
import re  # Add this to your imports at the top of the file
import string  # Add this to your imports at the top of the file
# --- MOCK & UTILITY SETUP ---

# Mock the Groq client for isolated testing (no API key needed)


class MockGroqClient:
    def __init__(self, responses: List[str]):
        # Reverse the list so pop() gives the responses in the correct order
        self.responses = responses[::-1]
        self.chat = MagicMock()
        self.chat.completions.create.side_effect = self._get_response

    def _get_response(self, *args, **kwargs):
        if not self.responses:
            raise Exception("Mock response list exhausted!")

        mock_message = MagicMock()
        mock_message.content = self.responses.pop()
        mock_choice = MagicMock()
        mock_choice.message = mock_message

        mock_response = MagicMock()
        mock_response.choices = [mock_choice]
        return mock_response

# --- GENERATOR CLASS ---


class ErnigramGeneratorAI:
    def __init__(self):
        # self.client = Groq(api_key=os.getenv("GROQ_API_KEY")) # Real client commented out
        self.client = None  # Placeholder for injection
        self.model = "meta-llama/llama-4-scout-17b-16e-instruct"
        self.used_titles = set()
        self.FUZZY_THRESHOLD = 80

    # --- generate_from_articles (RSS Logic) ---
    def generate_from_articles(self, articles: List[Dict], used_phrases: Set[str]) -> Dict:
        FUZZY_THRESHOLD = 90
        MAX_ATTEMPTS = 5

        available_articles = [
            article for article in articles
            if article.get('title', '').upper() not in used_phrases
        ]

        if not available_articles:
            return {"solution_phrase": "NO UNIQUE ARTICLES AVAILABLE", "clue": "...", "employee_source_id": None}

        exclusion_list = ", ".join(used_phrases)

        for attempt in range(1, MAX_ATTEMPTS + 1):
            print(f"🤖 RSS Attempt {attempt}: Selecting from {len(available_articles)} filtered articles.")

            # --- PROMPT (Ensures 3-5 words for consistency) ---
            prompt = f"""
            You are a creative assistant that turns news headlines into puzzles.
            Given a list of available structured articles, pick one that is most interesting for a puzzle.

            **CRITICAL RULE 1: The generated 'solution_phrase' must be UNIQUE. DO NOT generate any phrase that is an exact match or extremely similar to phrases listed in the EXCLUSION LIST below.**
            **CRITICAL RULE 2: Create a short "solution_phrase" that is a concise 3–5 word summary written in UPPERCASE. Phrases of only two words are forbidden.**
            **EXCLUSION LIST (Phrases to avoid):** {exclusion_list or "NONE"}
            
            Here are the *available* articles:
            {json.dumps(available_articles, indent=2)}
            
            Return strict JSON format: {{"solution_phrase": "...", "clue": "..."}}
            """
            # --- END PROMPT ---

            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You generate subtle clues for puzzle headlines. Respond only with the required JSON object."},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=1.2,
                    max_tokens=500,
                    response_format={"type": "json_object"},
                )

                raw_json = response.choices[0].message.content
                result = json.loads(raw_json)
                phrase = result.get("solution_phrase", "").upper().strip()
                clue = result.get("clue", "No clue provided.").strip()
                source_block_num = result.get("source_block_number")

                if not phrase:
                    raise ValueError("AI returned JSON missing solution_phrase.")

                # --- DEBUG ADDED HERE ---
                cleaned_phrase = phrase.translate(str.maketrans('', '', string.punctuation))
                normalized_phrase = ' '.join(cleaned_phrase.split())
                word_count = len(normalized_phrase.split())

                # Keeping the print statement for validation (it will now show 6)
                print(f"DEBUG: Calculated Count: {word_count}. Phrase: '{phrase}'")
                # -------------------------

                # --- PROGRAMMATIC WORD COUNT CHECK ---
                # word_count = len(phrase.split())
                if not (3 <= word_count <= 5):
                    print(f"❌ Phrase '{phrase}' failed word count check ({word_count} words). Must be 3-5 words. Retrying...")
                    continue
                # -------------------------------------
                print(f"🤖 AI generated phrase '{phrase}' from source block #{source_block_num or 'Unknown'}.")

                is_unique_by_fuzzy_check = True
                for used_phrase in used_phrases:
                    similarity_score = fuzz.token_sort_ratio(phrase, used_phrase)
                    if similarity_score >= FUZZY_THRESHOLD:
                        is_unique_by_fuzzy_check = False
                        print(f"❌ Phrase '{phrase}' (Score: {similarity_score}) is too similar to used phrase '{used_phrase}'.")
                        break

                if is_unique_by_fuzzy_check:
                    print(f"✅ Unique phrase found from RSS source: {phrase}")
                    # Use 'None' for the ID key to be consistent with the main scheduler's return structure
                    return {"solution_phrase": phrase, "clue": result["clue"].strip(), "employee_source_id": None}
                else:
                    continue

            except (json.JSONDecodeError, ValueError) as e:
                print(f"⚠️ Data/JSON error on attempt {attempt}: {e}. Retrying...")
                continue
            except Exception as e:
                print(f"⚠️ Groq API failure on attempt {attempt}: {e}")
                continue

        return {"solution_phrase": "RSS UNIQUE GENERATION FAILED", "clue": "The AI could not generate a unique phrase...", "employee_source_id": None}

    # --- generate_from_raw_text (CSV Logic - FINAL VERSION) ---
    def generate_from_raw_text(self, raw_text_list: List[str], used_phrases: Set[str], dominant_theme: Optional[str] = None) -> Dict:
        if not raw_text_list:
            return {"solution_phrase": "NO RAW DATA PROVIDED", "clue": "...", "employee_source_id": None}

        indexed_texts = [
            f"--- BLOCK {i+1} ---\n{text}"
            for i, text in enumerate(raw_text_list)
        ]

        exclusion_list = ", ".join(used_phrases)
        MAX_ATTEMPTS = 5
        FUZZY_THRESHOLD = 80

        # NOTE: attempted_block_indices logic has been permanently removed

        theme_constraint = ""
        if dominant_theme:
            theme_constraint = f"**ULTRA CRITICAL RULE: The dominant theme '{dominant_theme}' has been used too often recently. You MUST select a block of text that is NOT about this theme.**"

        for attempt in range(1, MAX_ATTEMPTS + 1):

            available_blocks = indexed_texts  # Use the full list for every attempt
            print(f"🤖 CSV Attempt {attempt}: Selecting from {len(available_blocks)} remaining blocks.")

            prompt = f"""
            You are a puzzle assistant. Your task is to generate a puzzle based *ONLY* on the provided text blocks.

            **EXAMPLES OF DESIRED OUTPUT:**

            Input Text Block 1: "Our latest project focuses on implementing a scalable cloud solution for data analytics. We are using Kubernetes and serverless functions for efficiency."
            Desired Output 1:
            ```json
            {{
                "solution_phrase": "SCALABLE CLOUD SOLUTION",
                "clue": "This involves efficient remote computing infrastructure.",
                "source_block_number": 1
            }}

            Input Text Block 1: We recently celebrated the launch of a new product that utilizes generative AI to create personalized marketing content for all our customers."
            Desired Output 2:
            ```json
            {{
                "solution_phrase": "PERSONALIZED MARKETING CONTENT",
                "clue": "AI helps create tailored advertisements.",
                "source_block_number": 2
            }}

           **CRITICAL RULES:**
            - **RULE 1: Strict Adherence to Word Count is MANDATORY.** The 'solution_phrase' MUST be composed of **EXACTLY 3, 4, or 5 words**. Phrases with fewer than 3 words or more than 5 words are absolutely forbidden. For example, "EXAMPLE THREE WORD" is acceptable, but "EXAMPLE" or "EXAMPLE FOUR WORD PHRASE" are not.
            - **RULE 2: ABSOLUTE UNIQUENESS REQUIRED.** The generated 'solution_phrase' MUST NOT be an exact match or be highly similar (e.g., sharing key concepts or more than 70% token overlap) to ANY phrase provided in the EXCLUSION LIST below. If a phrase from the input text block closely matches an exclusion list item, you MUST select a different block or a different phrase from the same block that avoids the match.
            **EXCLUSION LIST:** {exclusion_list or "NONE"}
            - **RULE 3: Source Relevance.** YOU MUST BASE YOUR 'solution_phrase' DIRECTLY ON THE CONTENT OF THE SELECTED BLOCK.
            - {theme_constraint}

            **AVAILABLE TEXT BLOCKS:**
            {json.dumps(available_blocks, indent=2)}
            
            **YOUR RESPONSE FORMAT:**
            Return a strict JSON object with three keys: "solution_phrase", "clue", and "source_block_number".
            **YOUR RESPONSE MUST BE IN THE FOLLOWING STRICT JSON FORMAT:**
            ```json
            {{
                "solution_phrase": "A 3-5 WORD PHRASE IN UPPERCASE",
                "clue": "A short, helpful clue related to the phrase.",
                "source_block_number": NUMBER_OF_THE_SELECTED_BLOCK
            }}
            """

            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "system", "content": "You are a puzzle generator that strictly follows instructions. Your only output is the required JSON object."}, {"role": "user", "content": prompt}],
                    temperature=1.2,
                    max_tokens=500,
                    response_format={"type": "json_object"},
                )

                raw_json = response.choices[0].message.content
                result = json.loads(raw_json)
                phrase = result.get("solution_phrase", "").upper().strip()
                clue = result.get("clue", "No clue provided.").strip()
                source_block_num = result.get("source_block_number")

                if not phrase:
                    raise ValueError("AI response did not contain a 'solution_phrase' key.")

                # --- PROGRAMMATIC WORD COUNT CHECK ---
                word_count = len(phrase.split())
                if not (3 <= word_count <= 5):
                    print(f"❌ Phrase '{phrase}' failed word count check ({word_count} words). Must be 3-5 words.")
                    continue
                # -------------------------------------

                print(f"🤖 AI generated phrase '{phrase}' from source block #{source_block_num or 'Unknown'}.")

                is_unique = True
                for used_phrase in used_phrases:
                    if fuzz.token_sort_ratio(phrase, used_phrase) >= FUZZY_THRESHOLD:
                        print(f"❌ Phrase '{phrase}' is too similar to used phrase '{used_phrase}'.")
                        is_unique = False
                        break

                if is_unique:
                    print(f"✅ Unique phrase found: {phrase}")
                    # Use 'None' for the ID key to be consistent with the main scheduler's return structure
                    return {"solution_phrase": phrase, "clue": clue, "employee_source_id": None}
                else:
                    continue

            except (json.JSONDecodeError, ValueError) as e:
                print(f"⚠️ Data/JSON error on attempt {attempt}: {e}. Retrying...")
                continue
            except Exception as e:
                print(f"⚠️ Groq API failure on attempt {attempt}: {e}")
                continue

        return {
            "solution_phrase": "NO UNIQUE PUZZLE AVAILABLE",
            "clue": "The AI could not generate a unique phrase after multiple attempts from the available text.",
            "employee_source_id": None
        }

    # --- generate_from_employee_data ---
    def generate_from_employee_data(self, employee_data: List[Dict], used_phrases: Set[str]) -> Dict:
        available = [e for e in employee_data if e['phrase'] not in used_phrases]
        selected = random.choice(available) if available else None

        if not selected:
            raise ValueError("All employee names have been used as Ernigram solutions.")

        fixed_clue = "Guess the ERNI employee"

        # CRITICAL: Returns the ID (PK)
        return {
            "solution_phrase": selected['phrase'],
            "clue": fixed_clue,
            "employee_source_id": selected['id']
        }

# --- TEST DATA AND EXECUTION ---


# Mock data for testing generate_from_raw_text
MOCK_RAW_TEXTS = [
    "Our latest project focuses on implementing a scalable cloud solution for data analytics. We are using Kubernetes and serverless functions for efficiency.",  # Block 1
    "We recently celebrated the launch of a new product that utilizes generative AI to create personalized marketing content for all our customers.",  # Block 2
    "The engineering department migrated all legacy applications to a modern microservices architecture, dramatically reducing latency and operational costs.",  # Block 3
    "A detailed study found that adopting new security protocols led to a 40% reduction in cyber risks and improved overall system trust and compliance.",  # Block 4
    "We are launching an initiative to train all staff in essential programming skills, focusing on Python and machine learning fundamentals.",  # Block 5
]

# Simulate previously used phrases
MOCK_USED_PHRASES = {
    "DATA ANALYTICS",
    "SECURITY PROTOCOL REVIEWS",  # Will cause fuzzy failure on Attempt 2
    "MACHINE LEARNING FUNDAMENTALS",
}

# Sequence of mock JSON responses from the AI
MOCK_GROQ_RESPONSES = [
    # Attempt 1: Fails Word Count (2 words) -> CLOUD SOLUTIONS
    '{"solution_phrase": "CLOUD SOLUTIONS", "clue": "This is about remote computing power. It handles all the information storage and processing.", "source_block_number": 1}',

    # Attempt 2: Passes Word Count (3 words), Fails Fuzzy Check (similar to 'SECURITY PROTOCOL REVIEWS')
    '{"solution_phrase": "SECURITY PROTOCOL REVIEWS", "clue": "This new policy reduces digital risk across all platforms.", "source_block_number": 4}',

    # Attempt 3: Fails Word Count (6 words) -> MIGRATING LEGACY...
    '{"solution_phrase": "MIGRATING LEGACY APPLICATIONS TO MICROSERVICES", "clue": "The team changed how older software was deployed.", "source_block_number": 3}',

    # Attempt 4: SUCCESS! (Passes all checks: 4 words and unique)
    '{"solution_phrase": "PERSONALISED MARKETING CONTENT GENERATOR", "clue": "This new tool uses artificial intelligence to make targeted ads.", "source_block_number": 2}',

    # Fallback response (should not be reached)
    '{"solution_phrase": "FALLBACK SUCCESS", "clue": "...", "source_block_number": 5}',
]


def run_mock_test():
    """Runs the test scenario for generate_from_raw_text."""
    ai_generator = ErnigramGeneratorAI()
    ai_generator.client = MockGroqClient(MOCK_GROQ_RESPONSES)  # Inject the mock client

    print("--- Starting MOCK Test Execution ---")

    # Execute the function under test
    result = ai_generator.generate_from_raw_text(
        raw_text_list=MOCK_RAW_TEXTS,
        used_phrases=MOCK_USED_PHRASES,
        dominant_theme="DIGITAL TRANSFORMATION"
    )

    print("\n--- Test Complete ---")
    print("Final Result:")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    run_mock_test()
