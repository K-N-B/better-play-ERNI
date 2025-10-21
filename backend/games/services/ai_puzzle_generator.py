"""
AI Puzzle Generator using Google Gemini API
Generates Wordle puzzles with themes and hints
"""

import google.generativeai as genai
import json
import re
from django.conf import settings
from typing import Dict, List


class AIPuzzleGenerator:
    """
    Generates puzzle content using Google Gemini AI.
    Supports multiple game types and difficulty levels.
    """
    
    def __init__(self):
        """Initialize Gemini API with key from settings"""
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not found in settings")
        
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-pro')
    
    def generate_wordle_puzzle(self, difficulty: str = 'easy') -> Dict:
        """
        Generate a Wordle puzzle with word, theme, and hints.
        
        Args:
            difficulty (str): 'easy' or 'hard'
            
        Returns:
            Dict: {
                'word': str (5-letter word),
                'theme': str (category/theme),
                'hints': List[str] (3 hints)
            }
        """
        
        # Create prompt based on difficulty
        if difficulty == 'easy':
            prompt = """Generate a Wordle puzzle with these requirements:

1. Choose a common 5-letter English word that most people know
2. The word should be something people use in everyday conversation
3. Avoid obscure, technical, or archaic words
4. Provide exactly 3 helpful hints
5. Include a fun theme or category

Format your response EXACTLY like this (no extra text):
{
    "word": "PLANT",
    "theme": "Nature and Gardening",
    "hints": [
        "A living organism that grows in soil",
        "Can be found in gardens and homes",
        "Needs water and sunlight to survive"
    ]
}

Requirements:
- Word must be EXACTLY 5 letters
- Word must be all UPPERCASE
- Word must be a common English word
- Provide EXACTLY 3 hints
- Hints should be clear and helpful
- Make hints progressively more specific
- Response must be valid JSON

Generate ONE puzzle now:"""
        
        else:  # hard
            prompt = """Generate a challenging Wordle puzzle with these requirements:

1. Choose a difficult 5-letter English word
2. The word should be uncommon but still valid
3. Consider words with unusual letter combinations
4. Provide exactly 3 challenging hints
5. Include an interesting theme

Format your response EXACTLY like this (no extra text):
{
    "word": "FJORD",
    "theme": "Geography and Nature",
    "hints": [
        "A narrow inlet of the sea between high cliffs",
        "Commonly found in Norway and Iceland",
        "Starts with F and has an unusual spelling"
    ]
}

Requirements:
- Word must be EXACTLY 5 letters
- Word must be all UPPERCASE
- Word must be a valid English word
- Provide EXACTLY 3 hints
- Hints should be challenging but fair
- Make hints progressively more specific
- Response must be valid JSON

Generate ONE puzzle now:"""
        
        try:
            # Generate content with Gemini
            response = self.model.generate_content(prompt)
            
            if not response or not response.text:
                raise ValueError("Empty response from Gemini API")
            
            # Extract JSON from response
            puzzle_data = self._parse_response(response.text)
            
            # Validate the puzzle
            self._validate_wordle_puzzle(puzzle_data)
            
            return puzzle_data
            
        except Exception as e:
            print(f"Error generating puzzle: {str(e)}")
            # Return fallback puzzle
            return self._get_fallback_puzzle(difficulty)
    
    def _parse_response(self, response_text: str) -> Dict:
        """
        Parse JSON response from Gemini API.
        Handles various response formats.
        
        Args:
            response_text (str): Raw response from API
            
        Returns:
            Dict: Parsed puzzle data
        """
        try:
            # Try to find JSON in response
            # Remove markdown code blocks if present
            cleaned = response_text.strip()
            
            # Remove ```json and ``` markers
            if cleaned.startswith('```json'):
                cleaned = cleaned[7:]
            if cleaned.startswith('```'):
                cleaned = cleaned[3:]
            if cleaned.endswith('```'):
                cleaned = cleaned[:-3]
            
            cleaned = cleaned.strip()
            
            # Find JSON object
            json_match = re.search(r'\{[\s\S]*\}', cleaned)
            if json_match:
                json_str = json_match.group(0)
                puzzle_data = json.loads(json_str)
                
                # Ensure word is uppercase
                if 'word' in puzzle_data:
                    puzzle_data['word'] = puzzle_data['word'].upper()
                
                return puzzle_data
            else:
                raise ValueError("No JSON object found in response")
                
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in response: {str(e)}")
    
    def _validate_wordle_puzzle(self, puzzle_data: Dict) -> None:
        """
        Validate puzzle data structure and content.
        
        Args:
            puzzle_data (Dict): Puzzle to validate
            
        Raises:
            ValueError: If puzzle is invalid
        """
        # Check required fields
        required_fields = ['word', 'theme', 'hints']
        for field in required_fields:
            if field not in puzzle_data:
                raise ValueError(f"Missing required field: {field}")
        
        # Validate word
        word = puzzle_data['word']
        if not isinstance(word, str):
            raise ValueError("Word must be a string")
        
        if len(word) != 5:
            raise ValueError(f"Word must be exactly 5 letters, got {len(word)}")
        
        if not word.isupper():
            raise ValueError("Word must be uppercase")
        
        if not word.isalpha():
            raise ValueError("Word must contain only letters")
        
        # Validate theme
        if not isinstance(puzzle_data['theme'], str):
            raise ValueError("Theme must be a string")
        
        if len(puzzle_data['theme']) < 3:
            raise ValueError("Theme too short")
        
        # Validate hints
        hints = puzzle_data['hints']
        if not isinstance(hints, list):
            raise ValueError("Hints must be a list")
        
        if len(hints) != 3:
            raise ValueError(f"Must have exactly 3 hints, got {len(hints)}")
        
        for i, hint in enumerate(hints):
            if not isinstance(hint, str):
                raise ValueError(f"Hint {i+1} must be a string")
            if len(hint) < 10:
                raise ValueError(f"Hint {i+1} too short")
    
    def _get_fallback_puzzle(self, difficulty: str) -> Dict:
        """
        Return a fallback puzzle if generation fails.
        
        Args:
            difficulty (str): 'easy' or 'hard'
            
        Returns:
            Dict: Fallback puzzle data
        """
        if difficulty == 'easy':
            return {
                'word': 'CRANE',
                'theme': 'Birds and Machinery',
                'hints': [
                    'A large bird often seen near water',
                    'Also a machine used in construction',
                    'Rhymes with "train" and starts with C'
                ]
            }
        else:
            return {
                'word': 'FJORD',
                'theme': 'Geography',
                'hints': [
                    'A narrow inlet of the sea between high cliffs',
                    'Common in Norway and Iceland',
                    'Starts with F and has unusual spelling'
                ]
            }
    
    def generate_hangman_puzzle(self, difficulty: str = 'easy') -> Dict:
        """
        Generate a Hangman puzzle (future implementation).
        
        Args:
            difficulty (str): 'easy', 'medium', or 'hard'
            
        Returns:
            Dict: Hangman puzzle data
        """
        # Placeholder for future implementation
        raise NotImplementedError("Hangman puzzle generation coming soon!")
    
    def generate_crossword_puzzle(self, size: str = '5x5') -> Dict:
        """
        Generate a Crossword puzzle (future implementation).
        
        Args:
            size (str): Grid size (e.g., '5x5', '7x7')
            
        Returns:
            Dict: Crossword puzzle data
        """
        # Placeholder for future implementation
        raise NotImplementedError("Crossword puzzle generation coming soon!")
    
    def test_connection(self) -> bool:
        """
        Test if Gemini API connection is working.
        
        Returns:
            bool: True if connection successful
        """
        try:
            response = self.model.generate_content("Say 'test' if you can read this.")
            return bool(response and response.text)
        except Exception as e:
            print(f"Connection test failed: {str(e)}")
            return False


# Convenience function for easy importing
def generate_daily_puzzle(game_type: str, difficulty: str) -> Dict:
    """
    Generate a daily puzzle for the specified game type.
    
    Args:
        game_type (str): Type of game ('wordle', 'hangman', etc.)
        difficulty (str): Difficulty level
        
    Returns:
        Dict: Puzzle data
    """
    generator = AIPuzzleGenerator()
    
    if game_type == 'wordle':
        return generator.generate_wordle_puzzle(difficulty)
    elif game_type == 'hangman':
        return generator.generate_hangman_puzzle(difficulty)
    elif game_type == 'crossword':
        return generator.generate_crossword_puzzle(difficulty)
    else:
        raise ValueError(f"Unknown game type: {game_type}")