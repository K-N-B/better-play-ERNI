# games/utils/word_selector.py
import random
from datetime import date
from pathlib import Path


class WordSelector:
    """Selects words for Wordle puzzles"""

    def __init__(self):
        # Path to word list file
        self.word_file = Path(__file__).parent.parent / 'data' / 'wordle_words.txt'
        self._words = None

    @property
    def words(self):
        """Lazy load word list"""
        if self._words is None:
            self._words = self._load_words()
        return self._words

    def _load_words(self):
        """Load words from file"""
        if not self.word_file.exists():
            raise FileNotFoundError(f"Word list not found at {self.word_file}")

        with open(self.word_file, 'r') as f:
            words = [line.strip().upper() for line in f if line.strip()]

        # Filter to only 5-letter words
        words = [w for w in words if len(w) == 5 and w.isalpha()]

        if not words:
            raise ValueError("No valid 5-letter words found in word list")

        return words

    def get_word_for_date(self, target_date: date) -> str:
        """
        Get a deterministic word for a specific date.
        Same date always returns same word (seeded random).
        """
        # Use date as seed for reproducibility
        seed = int(target_date.strftime('%Y%m%d'))
        random.seed(seed)

        word = random.choice(self.words)

        # Reset random seed
        random.seed()

        return word

    def get_random_word(self) -> str:
        """Get a truly random word (for testing)"""
        return random.choice(self.words)

    def is_valid_word(self, word: str) -> bool:
        """Check if a word is in the valid word list"""
        return word.upper() in self.words
