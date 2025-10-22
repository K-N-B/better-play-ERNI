import openai # We will still use the 'openai' library, but point it to Groq
import os
import json

from openai import OpenAI # Import the new OpenAI client

class WordleGeneratorAI:
    # Groq offers several models, "llama3-8b-8192" or "mixtral-8x7b-32768" are good choices.
    # We'll use llama3-8b-8192 as a default.
    def __init__(self, api_key=None, model_name="llama-3.3-70b-versatile"): # <--- Changed default model to a Groq one
        if api_key is None:
            # Load the GROQ_API_KEY environment variable
            self.api_key = os.getenv("GROQ_API_KEY")
            if not self.api_key:
                raise ValueError("GROQ_API_KEY not found in environment variables.")
        else:
            self.api_key = api_key
        
        # Initialize the OpenAI client, but point its base_url to Groq's API endpoint
        self.client = OpenAI(
            api_key=self.api_key, 
            base_url="https://api.groq.com/openai/v1" # <--- THIS IS THE CRUCIAL CHANGE for Groq
        )
        self.model_name = model_name

    def generate_wordle_puzzle_data(self, difficulty="easy", existing_words=[]):
        """
        Generates a Wordle puzzle (word, hints, theme, definition) using an LLM via Groq.
        """
        
        prompt = f"""
        Generate a {difficulty} difficulty Wordle puzzle.
        The puzzle must include:
        1. A 5-letter English word.
        2. Three distinct hints for the word.
        3. A one-word theme that the word relates to.
        4. A concise definition of the word.
        
        Ensure the word is common enough for Wordle, but not overly obscure, especially for 'easy' difficulty.
        Avoid words that are proper nouns, abbreviations, or offensive.
        The output must be a JSON object with the following keys: "word", "hints" (a list of strings), "theme", "definition".
        
        Example JSON output:
        {{
            "word": "CRANE",
            "hints": ["A large bird with long legs and neck.", "A machine used for lifting heavy objects.", "To stretch out one's neck to see something."],
            "theme": "Bird",
            "definition": "A large, long-necked, and long-legged bird, or a type of machine used for lifting heavy objects."
        }}

        Current difficulty: {difficulty}
        {f"Exclude these words from consideration: {', '.join(existing_words)}" if existing_words else ""}
        """

        try:
            # print(f"DEBUG: Using Groq model: {self.model_name}")
            # print(f"DEBUG: Connecting to Groq API at: {self.client.base_url}")
            
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that generates Wordle puzzles. Output only the JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500,
                response_format={"type": "json_object"} # Groq supports this!
            )
            
            content = response.choices[0].message.content
            puzzle_data = json.loads(content)
            
            # Basic validation
            if not isinstance(puzzle_data, dict) or \
               not all(k in puzzle_data for k in ["word", "hints", "theme", "definition"]) or \
               not isinstance(puzzle_data["hints"], list) or \
               len(puzzle_data["word"]) != 5:
                raise ValueError("Generated puzzle data is not in the expected format or word is not 5 letters.")
            
            puzzle_data["word"] = puzzle_data["word"].upper()

            return puzzle_data

        except openai.APIStatusError as e:
            print(f"Groq API Status Error: {e.status_code} - {e.response.text}") # Print .text for details
            return None
        except openai.APIConnectionError as e:
            print(f"Groq API Connection Error: {e}")
            return None
        except openai.RateLimitError as e: # Groq also has rate limits, though usually very generous
            print(f"Groq Rate Limit Error: {e}")
            return None
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            import traceback
            traceback.print_exc()
            return None