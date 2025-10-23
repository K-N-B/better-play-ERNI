import os
import google.generativeai as genai
from typing import Dict, List
import json
import re

# Configure Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')


class GeminiPuzzleGenerator:
    """Service for generating puzzles using Google Gemini API"""
    
    # ============================================
    # WORDLE GENERATION
    # ============================================
    @staticmethod
    def generate_wordle_word(difficulty: str) -> str:
        """
        Generate a 5-letter word for Wordle.
        
        Args:
            difficulty: 'easy' or 'hard'
        
        Returns:
            5-letter word in uppercase
        """
        if difficulty == 'easy':
            prompt = """Generate ONE common 5-letter English word suitable for Wordle (Easy difficulty).
            
            Requirements:
            - Must be exactly 5 letters
            - Common everyday word that most people know
            - Contains common letters (E, A, R, I, O, T, N, S)
            - No proper nouns, abbreviations, or plurals
            - Examples: HOUSE, WATER, BRAIN, HEART
            
            Return ONLY the word in uppercase, nothing else."""
        else:  # hard
            prompt = """Generate ONE challenging 5-letter English word suitable for Wordle (Hard difficulty).
            
            Requirements:
            - Must be exactly 5 letters
            - Less common or unusual word
            - May contain uncommon letters (Q, X, Z, J, K)
            - Can have repeated letters
            - No proper nouns or abbreviations
            - Examples: FJORD, JAZZY, QUIRK, WALTZ
            
            Return ONLY the word in uppercase, nothing else."""
        
        try:
            response = model.generate_content(prompt)
            word = response.text.strip().upper()
            
            # Validation
            word = re.sub(r'[^A-Z]', '', word)  # Remove non-letters
            if len(word) != 5:
                # Fallback words if AI fails
                fallback = {
                    'easy': ['HOUSE', 'BREAD', 'LIGHT', 'HAPPY', 'PLANT'],
                    'hard': ['FJORD', 'WALTZ', 'QUIRK', 'JAZZY', 'NYMPH']
                }
                import random
                word = random.choice(fallback[difficulty])
            
            return word
        
        except Exception as e:
            print(f"[GeminiService] Error generating Wordle word: {e}")
            # Fallback
            fallback = {'easy': 'HOUSE', 'hard': 'FJORD'}
            return fallback[difficulty]
    
    @staticmethod
    def generate_wordle_hints(word: str) -> Dict[str, str]:
        """
        Generate 3 progressive hints for a Wordle word.
        
        Args:
            word: The solution word
        
        Returns:
            Dictionary with hint_1, hint_2, hint_3
        """
        prompt = f"""Generate 3 progressive hints for the Wordle word: {word}

        Requirements:
        - Hint 1: Very vague (e.g., category or general concept)
        - Hint 2: More specific (e.g., definition or context)
        - Hint 3: Almost gives it away (e.g., synonym or very clear description)
        
        Return as JSON format:
        {{
            "hint_1": "...",
            "hint_2": "...",
            "hint_3": "..."
        }}
        
        Return ONLY the JSON, nothing else."""
        
        try:
            response = model.generate_content(prompt)
            hints_text = response.text.strip()
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', hints_text, re.DOTALL)
            if json_match:
                hints = json.loads(json_match.group())
                return hints
            else:
                raise ValueError("No JSON found in response")
        
        except Exception as e:
            print(f"[GeminiService] Error generating hints: {e}")
            # Fallback generic hints
            return {
                "hint_1": f"This is a {len(word)}-letter word.",
                "hint_2": f"The word starts with '{word[0]}'.",
                "hint_3": f"The word contains the letters: {', '.join(sorted(set(word)))}."
            }
    
    # ============================================
    # SUDOKU GENERATION
    # ============================================
    @staticmethod
    def generate_sudoku_puzzle(difficulty: str) -> Dict[str, str]:
        """
        Generate a Sudoku puzzle.
        
        Args:
            difficulty: 'easy' or 'hard'
        
        Returns:
            Dictionary with 'puzzle_string' and 'solution_string'
        """
        clues_count = 40 if difficulty == 'easy' else 25
        
        prompt = f"""Generate a valid 9x9 Sudoku puzzle with approximately {clues_count} clues.

        Requirements:
        - Must be a valid Sudoku puzzle (one unique solution)
        - Return puzzle as 81 characters (rows concatenated, use 0 for empty cells)
        - Also return the complete solution
        
        Return as JSON format:
        {{
            "puzzle": "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
            "solution": "534678912672195348198342567859761423426853791713924856961537284287419635345286179"
        }}
        
        Return ONLY the JSON, nothing else."""
        
        try:
            response = model.generate_content(prompt)
            data_text = response.text.strip()
            
            # Extract JSON
            json_match = re.search(r'\{.*\}', data_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                return {
                    'puzzle_string': data['puzzle'],
                    'solution_string': data['solution']
                }
            else:
                raise ValueError("No JSON found")
        
        except Exception as e:
            print(f"[GeminiService] Error generating Sudoku: {e}")
            # Fallback puzzle (known valid puzzle)
            fallback = {
                'easy': {
                    'puzzle_string': '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
                    'solution_string': '534678912672195348198342567859761423426853791713924856961537284287419635345286179'
                },
                'hard': {
                    'puzzle_string': '800000000003600000070090200050007000000045700000100030001000068008500010090000400',
                    'solution_string': '812753649943682175675491283154237896369845721287169534521974368438526917796318452'
                }
            }
            return fallback[difficulty]
    
    # ============================================
    # ERNIGRAM GENERATION
    # ============================================
    @staticmethod
    def generate_ernigram_phrase(difficulty: str) -> Dict[str, str]:
        """
        Generate an ERNIgram phrase (company culture/values hangman).
        
        Args:
            difficulty: 'easy' or 'hard'
        
        Returns:
            Dictionary with 'solution_phrase' and 'clue'
        """
        if difficulty == 'easy':
            prompt = """Generate a phrase related to workplace culture, teamwork, or professional values (Easy difficulty).
            
            Requirements:
            - 2-4 words (15-25 characters total including spaces)
            - Common workplace concepts everyone knows
            - Examples: "TEAM COLLABORATION", "WORK LIFE BALANCE", "CONTINUOUS LEARNING"
            - Also generate a helpful clue
            
            Return as JSON:
            {{
                "phrase": "TEAM COLLABORATION",
                "clue": "Working together towards a common goal"
            }}
            
            Return ONLY the JSON, nothing else."""
        else:  # hard
            prompt = """Generate a challenging phrase related to workplace culture or company values (Hard difficulty).
            
            Requirements:
            - 3-5 words (25-40 characters total including spaces)
            - Less common or specific concepts
            - Can use industry jargon
            - Examples: "AGILE METHODOLOGY", "DIGITAL TRANSFORMATION", "STAKEHOLDER ENGAGEMENT"
            - Also generate a cryptic clue
            
            Return as JSON:
            {{
                "phrase": "DIGITAL TRANSFORMATION",
                "clue": "Modernizing processes through technology"
            }}
            
            Return ONLY the JSON, nothing else."""
        
        try:
            response = model.generate_content(prompt)
            data_text = response.text.strip()
            
            # Extract JSON
            json_match = re.search(r'\{.*\}', data_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                return {
                    'solution_phrase': data['phrase'].upper(),
                    'clue': data['clue']
                }
            else:
                raise ValueError("No JSON found")
        
        except Exception as e:
            print(f"[GeminiService] Error generating ERNIgram: {e}")
            # Fallback phrases
            fallback = {
                'easy': {
                    'solution_phrase': 'TEAM COLLABORATION',
                    'clue': 'Working together towards a common goal'
                },
                'hard': {
                    'solution_phrase': 'DIGITAL TRANSFORMATION',
                    'clue': 'Modernizing business through technology adoption'
                }
            }
            return fallback[difficulty]
    
    # ============================================
    # BATCH GENERATION (For Daily Cron Job)
    # ============================================
    @classmethod
    def generate_all_daily_puzzles(cls, puzzle_date) -> List[Dict]:
        """
        Generate all puzzles for a given date.
        
        Returns:
            List of puzzle dictionaries ready for database insertion
        """
        puzzles = []
        
        # Generate Wordle (Easy + Hard)
        for difficulty in ['easy', 'hard']:
            word = cls.generate_wordle_word(difficulty)
            hints = cls.generate_wordle_hints(word)
            
            puzzles.append({
                'puzzle_type': 'wordle',
                'difficulty': difficulty,
                'puzzle_date': puzzle_date,
                'solution_word': word,
                'hints': hints
            })
        
        # Generate Sudoku (Easy + Hard)
        for difficulty in ['easy', 'hard']:
            sudoku_data = cls.generate_sudoku_puzzle(difficulty)
            
            puzzles.append({
                'puzzle_type': 'sudoku',
                'difficulty': difficulty,
                'puzzle_date': puzzle_date,
                'puzzle_string': sudoku_data['puzzle_string'],
                'solution_string': sudoku_data['solution_string'],
                'hints': {}  # Sudoku doesn't need hints
            })
        
        # Generate ERNIgram (Easy + Hard)
        for difficulty in ['easy', 'hard']:
            ernigram_data = cls.generate_ernigram_phrase(difficulty)
            
            puzzles.append({
                'puzzle_type': 'ernigram',
                'difficulty': difficulty,
                'puzzle_date': puzzle_date,
                'solution_phrase': ernigram_data['solution_phrase'],
                'clue': ernigram_data['clue'],
                'hints': {}  # ERNIgram uses clue instead of hints
            })
        
        return puzzles