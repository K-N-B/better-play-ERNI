# games/services/ai_puzzle_generator.py
import anthropic
import json
import os
from django.conf import settings
from datetime import datetime


class AIPuzzleGenerator:
    """Generate puzzles using Claude AI"""
    
    def __init__(self):
        self.client = anthropic.Anthropic(
            api_key=settings.ANTHROPIC_API_KEY
        )
    
    def generate_wordle_puzzle(self, difficulty='easy', theme=None):
        """
        Generate a Wordle puzzle with AI
        
        Args:
            difficulty: 'easy' or 'hard'
            theme: Optional theme like 'Nature', 'Technology', 'Food'
        
        Returns:
            dict with puzzle data
        """
        
        # Define themes by day of week if not specified
        if not theme:
            day_of_week = datetime.now().weekday()
            themes = [
                'Nature', 'Technology', 'Food', 'Travel', 
                'Sports', 'Science', 'Arts'
            ]
            theme = themes[day_of_week]
        
        # Customize prompt based on difficulty
        if difficulty == 'easy':
            word_instruction = "common, everyday 5-letter English word that most people know"
            hint_style = "straightforward and clear"
        else:
            word_instruction = "more challenging 5-letter English word that requires broader vocabulary"
            hint_style = "clever and require more thinking"
        
        prompt = f"""Generate a daily Wordle puzzle with these specifications:

REQUIREMENTS:
- Difficulty level: {difficulty}
- Theme: {theme}
- Word must be exactly 5 letters
- Word must be a {word_instruction}
- Word must be a real English word (no proper nouns, abbreviations, or slang)
- Provide exactly 3 progressive hints
- Hints should be {hint_style}

HINT PROGRESSION:
- Hint 1: Broad contextual clue (most subtle)
- Hint 2: More specific clue (narrows it down)
- Hint 3: Very specific or reveals a letter position

Return ONLY valid JSON in this exact format:
{{
  "word": "CRANE",
  "theme": "{theme}",
  "difficulty": "{difficulty}",
  "hints": [
    "First hint here - broad context",
    "Second hint here - more specific",
    "Third hint here - very specific or letter reveal"
  ],
  "definition": "Short definition of the word",
  "example_sentence": "Example sentence using the word naturally"
}}

IMPORTANT: 
- Return ONLY the JSON object, no other text
- Word must be uppercase
- All hints must be helpful but not give away the answer immediately
"""
        
        try:
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            # Extract JSON from response
            response_text = message.content[0].text
            
            # Parse JSON
            puzzle_data = json.loads(response_text)
            
            # Validate the response
            if not self._validate_wordle_puzzle(puzzle_data):
                raise ValueError("Invalid puzzle data from AI")
            
            # Add metadata
            puzzle_data['ai_metadata'] = {
                'model': 'claude-3-5-sonnet',
                'generated_at': datetime.now().isoformat(),
                'tokens_used': message.usage.input_tokens + message.usage.output_tokens
            }
            
            return puzzle_data
            
        except json.JSONDecodeError as e:
            print(f"Failed to parse AI response as JSON: {e}")
            print(f"Response was: {response_text}")
            return self._fallback_puzzle(difficulty, theme)
        
        except Exception as e:
            print(f"Error generating puzzle: {e}")
            return self._fallback_puzzle(difficulty, theme)
    
    def _validate_wordle_puzzle(self, puzzle_data):
        """Validate puzzle data structure"""
        required_fields = ['word', 'hints', 'definition', 'theme']
        
        # Check all required fields exist
        if not all(field in puzzle_data for field in required_fields):
            return False
        
        # Check word is 5 letters and uppercase
        if len(puzzle_data['word']) != 5 or not puzzle_data['word'].isupper():
            return False
        
        # Check exactly 3 hints
        if len(puzzle_data['hints']) != 3:
            return False
        
        # Check all hints are non-empty strings
        if not all(isinstance(hint, str) and hint for hint in puzzle_data['hints']):
            return False
        
        return True
    
    def _fallback_puzzle(self, difficulty, theme):
        """Fallback puzzles if AI generation fails"""
        easy_puzzles = [
            {
                "word": "CRANE",
                "theme": "Nature",
                "difficulty": "easy",
                "hints": [
                    "A large bird often seen near water",
                    "Also the name of a construction machine that lifts heavy objects",
                    "Starts with C and ends with E"
                ],
                "definition": "A tall bird with long legs and neck, or a machine for lifting",
                "example_sentence": "The CRANE stood majestically at the water's edge."
            },
            {
                "word": "BEACH",
                "theme": "Nature",
                "difficulty": "easy",
                "hints": [
                    "A popular vacation destination by the water",
                    "Sandy shore where waves meet the land",
                    "Contains the letters B, E, A, C, H"
                ],
                "definition": "A pebbly or sandy shore by the ocean or lake",
                "example_sentence": "We spent the day relaxing at the BEACH."
            }
        ]
        
        hard_puzzles = [
            {
                "word": "FJORD",
                "theme": "Nature",
                "difficulty": "hard",
                "hints": [
                    "A geographical feature common in Scandinavia",
                    "A narrow inlet of the sea between high cliffs",
                    "Starts with F, has a J in the middle"
                ],
                "definition": "A long, narrow inlet with steep sides created by glacial erosion",
                "example_sentence": "The boat sailed through the deep FJORD."
            }
        ]
        
        puzzles = easy_puzzles if difficulty == 'easy' else hard_puzzles
        puzzle = puzzles[0]  # Use first fallback
        
        puzzle['ai_metadata'] = {
            'model': 'fallback',
            'generated_at': datetime.now().isoformat(),
            'is_fallback': True
        }
        
        return puzzle
    
    def generate_hint(self, puzzle_word, hint_level, existing_guesses=None):
        """
        Generate a dynamic hint based on current game state
        
        Args:
            puzzle_word: The answer word
            hint_level: 1, 2, or 3
            existing_guesses: List of guesses made so far
        
        Returns:
            str: Generated hint
        """
        
        context = ""
        if existing_guesses:
            context = f"\nUser's guesses so far: {', '.join(existing_guesses)}"
        
        hint_instructions = {
            1: "Give a broad, contextual clue about the word's meaning or category",
            2: "Give a more specific clue, perhaps about word structure or usage",
            3: "Give a very specific clue or reveal the position of one letter"
        }
        
        prompt = f"""Generate a hint for a Wordle puzzle.

Target word: {puzzle_word}
Hint level: {hint_level} (progressively more specific)
Instruction: {hint_instructions[hint_level]}
{context}

Return ONLY the hint text, nothing else. Make it helpful but not too easy.
"""
        
        try:
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=150,
                messages=[{"role": "user", "content": prompt}]
            )
            
            hint = message.content[0].text.strip()
            return hint
            
        except Exception as e:
            print(f"Error generating hint: {e}")
            # Fallback hints
            fallback_hints = [
                f"This word is {len(puzzle_word)} letters long",
                f"The word contains the letter '{puzzle_word[2]}'",
                f"The first letter is '{puzzle_word[0]}'"
            ]
            return fallback_hints[hint_level - 1]


# Singleton instance
puzzle_generator = AIPuzzleGenerator()