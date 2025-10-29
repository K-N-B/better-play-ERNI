# games/config.py

# WORDLE Configuration
WORDLE_EASY_BASE_POINT = 100
WORDLE_HARD_BASE_POINT = 200

WORDLE_EASY_TRY_LIMITS = 6
WORDLE_HARD_TRY_LIMITS = 6  # Max tries for easy and hard difficulties

WORDLE_EASY_TIME_LIMIT = 300000  # 5 minutes in milliseconds
WORDLE_HARD_TIME_LIMIT = 400000  # 7 minutes in milliseconds



# SUDOKU Configuration
SUDOKU_EASY_BASE_POINT = 200
SUDOKU_HARD_BASE_POINT = 400 

SUDOKU_EASY_TIME_LIMIT = 900000  # 15 minutes in milliseconds
SUDOKU_HARD_TIME_LIMIT = 1200000  # 20 minutes in milliseconds

SUDOKU_EASY_HINT_LIMIT = 5  # 5 hints max 
SUDOKU_HARD_HINT_LIMIT = 5  # 5 hints max 

SUDOKU_HINT_PENALTY = 20

#ERNIgram Configuration
ERNIGRAM_EASY_BASE_POINT = 150
ERNIGRAM_HARD_BASE_POINT = 300

ERNIGRAM_EASY_TIME_LIMIT = 300000  # 5 minutes in milliseconds
ERNIGRAM_HARD_TIME_LIMIT = 300000  # 5 minutes in milliseconds

ERNIGRAM_EASY_MISTAKE_LIMITS = 6
ERNIGRAM_HARD_MISTAKE_LIMITS = 4


# Sudoku API Configuration
SUDOKU_API_BASE_URL = "https://sudoku-api.vercel.app/api/dosuku"
DEFAULT_EASY_BLANKS = 40
DEFAULT_HARD_BLANKS = 55


NEWS_API_BASE_URL = "https://api.rss2json.com/v1/api.json"
NEWS_API_FEED_PARAM = "?rss_url=https%3A%2F%2Fwww.manilatimes.net%2Fnews%2Ffeed%2F"
