# import pytest
# from datetime import date
# from rest_framework.test import APIClient
# from rest_framework import status
# from games.models import WordlePuzzle, SudokuPuzzle, ErnigramPuzzle, DailyPuzzle


# @pytest.fixture
# def api_client():
#     return APIClient()


# @pytest.fixture
# def setup_daily_puzzle(db):
#     """Creates a full set of puzzles linked to a DailyPuzzle."""
#     wordle_easy = WordlePuzzle.objects.create(solution_word="APPLE", difficulty="EASY")
#     wordle_hard = WordlePuzzle.objects.create(solution_word="BANANA", difficulty="HARD")
#     sudoku = SudokuPuzzle.objects.create(
#         solution_string="1" * 81,
#         puzzle_string_easy="0" * 81,
#         puzzle_string_hard="0" * 81,
#         date_to_be_used=date.today(),
#     )
#     ernigram = ErnigramPuzzle.objects.create(
#         solution_phrase="HELLO WORLD", clue="Common greeting", date_to_be_used=date.today()
#     )
#     daily = DailyPuzzle.objects.create(
#         wordle_easy=wordle_easy,
#         wordle_hard=wordle_hard,
#         sudoku=sudoku,
#         ernigram=ernigram,
#         date=date.today(),
#     )
#     return daily


# # ---------------------------
# # DAILY PUZZLE RETRIEVAL TESTS
# # ---------------------------


# @pytest.mark.django_db
# def test_get_daily_puzzle_success(api_client, setup_daily_puzzle):
#     """Should return the existing daily puzzle for today's date."""
#     response = api_client.get("/api/games/daily/")
#     assert response.status_code == status.HTTP_200_OK
#     data = response.json()
#     assert "wordle_easy" in data
#     assert data["wordle_easy"]["solution_word"] == "APPLE"
#     assert data["wordle_hard"]["solution_word"] == "BANANA"
#     assert data["sudoku"]["solution_string"] == "1" * 81


# @pytest.mark.django_db
# def test_get_daily_puzzle_with_query_param(api_client, setup_daily_puzzle):
#     """Should retrieve daily puzzle using ?date=YYYY-MM-DD"""
#     target_date = setup_daily_puzzle.date
#     response = api_client.get(f"/api/games/daily/?date={target_date}")
#     assert response.status_code == status.HTTP_200_OK
#     assert response.json()["ernigram"]["solution_phrase"] == "HELLO WORLD"


# @pytest.mark.django_db
# def test_get_daily_puzzle_not_found(api_client):
#     """Should return 404 if no puzzles exist for given date."""
#     response = api_client.get("/api/games/daily/?date=2025-01-01")
#     assert response.status_code == status.HTTP_404_NOT_FOUND
#     assert "not found" in response.json()["detail"].lower()


# @pytest.mark.django_db
# def test_get_daily_puzzle_invalid_date_format(api_client):
#     """Should return 400 if invalid date format is passed."""
#     response = api_client.get("/api/games/daily/?date=invalid-date")
#     assert response.status_code == status.HTTP_400_BAD_REQUEST
#     assert "invalid date format" in response.json()["detail"].lower()


# # ---------------------------
# # MOCK DAILY PUZZLE GENERATION TESTS
# # ---------------------------


# @pytest.mark.django_db
# def test_mock_generate_puzzles_success(monkeypatch, api_client):
#     """Should create a new daily puzzle successfully."""
#     from games.models import DailyPuzzle

#     # Mock generate_daily_puzzles() to return a dummy object
#     def mock_generate(date):
#         wordle_easy = WordlePuzzle.objects.create(solution_word="TEST", difficulty="EASY")
#         wordle_hard = WordlePuzzle.objects.create(solution_word="HARDY", difficulty="HARD")
#         sudoku = SudokuPuzzle.objects.create(
#             solution_string="1" * 81,
#             puzzle_string_easy="0" * 81,
#             puzzle_string_hard="0" * 81,
#             date_to_be_used=date,
#         )
#         ernigram = ErnigramPuzzle.objects.create(
#             solution_phrase="HELLO MOCK", clue="Mock clue", date_to_be_used=date
#         )
#         return DailyPuzzle.objects.create(
#             wordle_easy=wordle_easy,
#             wordle_hard=wordle_hard,
#             sudoku=sudoku,
#             ernigram=ernigram,
#             date=date,
#         )

#     monkeypatch.setattr("games.views.generate_daily_puzzles", mock_generate)

#     test_date = "2025-05-05"
#     response = api_client.post("/api/games/mock-generate/", {"date": test_date}, format="json")

#     assert response.status_code == status.HTTP_201_CREATED
#     data = response.json()
#     assert data["wordle_easy"]["solution_word"] == "TEST"
#     assert data["ernigram"]["solution_phrase"] == "HELLO MOCK"


# @pytest.mark.django_db
# def test_mock_generate_puzzles_missing_date(api_client):
#     """Should return 400 if date not provided."""
#     response = api_client.post("/api/games/mock-generate/", {}, format="json")
#     assert response.status_code == status.HTTP_400_BAD_REQUEST
#     assert "date is required" in response.json()["detail"].lower()


# @pytest.mark.django_db
# def test_mock_generate_puzzles_invalid_date(api_client):
#     """Should return 400 if invalid date format."""
#     response = api_client.post("/api/games/mock-generate/", {"date": "invalid"}, format="json")
#     assert response.status_code == status.HTTP_400_BAD_REQUEST


# @pytest.mark.django_db
# def test_mock_generate_puzzles_already_exists(api_client, setup_daily_puzzle):
#     """Should return 409 if puzzle for that date already exists."""
#     response = api_client.post(
#         "/api/games/mock-generate/", {"date": str(setup_daily_puzzle.date)}, format="json"
#     )
#     assert response.status_code == status.HTTP_409_CONFLICT
#     assert "already exist" in response.json()["detail"].lower()


# @pytest.mark.django_db
# def test_mock_generate_puzzles_internal_error(monkeypatch, api_client):
#     """Should handle unexpected errors in generation gracefully."""

#     def raise_error(date):
#         raise Exception("Unexpected generation error")

#     monkeypatch.setattr("games.views.generate_daily_puzzles", raise_error)

#     response = api_client.post("/api/games/mock-generate/", {"date": "2025-05-10"}, format="json")
#     assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
#     assert "error generating puzzles" in response.json()["detail"].lower()
