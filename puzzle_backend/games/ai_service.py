# # games/ai_service.py
# import os
# import json
# from groq import Groq  # Or from openai import OpenAI


# class WordleGeneratorAI:
#     def __init__(self):
#         self.api_key = os.getenv("GROQ_API_KEY")
#         if not self.api_key:
#             raise ValueError("GROQ_API_KEY environment variable not set.")

#         self.client = Groq(api_key=self.api_key)
#         self.model_name = "llama-3.3-70b-versatile"

#     def generate_wordle_puzzle_data(self, difficulty, existing_words=None):
#         """
#         Generate a single Wordle puzzle word based on difficulty.
#         EASY  -> Exactly 5 letters
#         HARD  -> Between 6 and 10 letters
#         """

#         if existing_words is None:
#             existing_words = []

#         # --- Word length rules ---
#         if difficulty == "EASY":
#             min_length = max_length = 5
#         else:  # HARD
#             min_length, max_length = 6, 10

#         # --- Build dynamic prompt ---
#         prompt = f"""
#         You are a precise assistant that generates English words for a Wordle-style puzzle.

#         RULES:
#         1. Generate a single English word between {min_length} and {max_length} letters long.
#         2. The word must be a valid, common English word (no proper nouns, abbreviations, or offensive terms).
#         3. The word must be in ALL UPPERCASE letters.
#         4. The word must NOT be any of these existing words: {', '.join(existing_words) if existing_words else 'None'}.
#         5. Respond in strict JSON format with one key only: "word".

#         Examples:
#         {{"word": "APPLE"}}  (for 5 letters)
#         {{"word": "CHALLENGE"}}  (for longer hard words)
#         """

#         try:
#             response = self.client.chat.completions.create(
#                 model=self.model_name,
#                 messages=[
#                     {"role": "system", "content": "You are an assistant that generates valid Wordle words in JSON format."},
#                     {"role": "user", "content": prompt},
#                 ],
#                 temperature=0.9,  # High for variety but not chaos
#                 max_tokens=100,
#                 response_format={"type": "json_object"}
#             )

#             content = response.choices[0].message.content
#             puzzle_data = json.loads(content)

#             word = puzzle_data.get("word", "").strip().upper()

#             # --- Validate the result ---
#             if not (min_length <= len(word) <= max_length):
#                 print(f"❌ Invalid word length: {word} ({len(word)} letters)")
#                 raise ValueError(
#                     f"Generated word length {len(word)} not within range {min_length}-{max_length}"
#                 )

#             print(f"✅ Generated word: {word} ({difficulty})")
#             return {"word": word}

#         except Exception as e:
#             print(f"⚠️ AI generation failed: {e}")
#             return None
