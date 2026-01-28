# ERNI Puzzle Platform

Welcome to the ERNI Puzzle Platform, a full-stack web application designed to foster community engagement through daily puzzles, challenges, and friendly competition.

## 🚀 Features

* **Authentication:** Secure Single Sign-On (SSO) for employees using Microsoft Azure AD.
* **New User Onboarding:** A one-time modal for new users to select their department, ensuring they are correctly placed on leaderboards.
* **Daily Games:** A set of daily puzzles that refresh automatically.
    * **Wordle:** Guess the daily word. Supports "Easy" (5-letter) and "Hard" (6+ letter) modes.
    * **Sudoku:** A classic logic puzzle. Supports "Easy" and "Hard" modes with different numbers of given cells.
    * **ERNIgram:** A "Hangman-style" game with where you'd have to guess either something about ERNI, some recent country news, or guess who?
* **Game Intro Screen:** A "How to Play" screen before each game, which allows for difficulty selection.
* **Scoring & Points:** Users earn points (`current_points`) for completing puzzles, which they can spend in the shop. A separate `total_points_alltime` is tracked for leaderboards.
* **Leaderboards:** View rankings by Individual or Department.
    * Filterable by `daily`, `weekly`, `monthly`, and `alltime`.
    * Features a responsive podium view for the top 3 players.
* **Challenges:** Players can challenge colleagues to beat their score on a specific puzzle. You can check your past and pending challenges on its dedicated page!
* **Community Hub:** The homepage features:
    * **Activity Feed:** A live feed of recent player puzzle completions.
    * **Who's Online:** A list of currently active users.
* **Reward Shop:** A shop where users can spend their `current_points` to claim rewards.
    * Supports item stock and claim limits per user.
    * Includes a claim history modal.
* **Admin Dashboard:** A custom website admin role (`is_admin`) for managing users and puzzle content. (The Django `/admin/` is also available for superusers).

---

## 💻 Tech Stack

* **Frontend:** React, TypeScript, Vite, Tailwind CSS
* **Backend:** Django, Django REST Framework, Python
* **Database:** PostgreSQL 
* **Authentication:** Custom Microsoft Azure AD (MSAL) flow with Django sessions.
* **Hosting:** Supabase (Database), Vercel (Frontend), Render (Database)

---

## 🛠️ Setup & Installation

### Backend Setup (`puzzle_backend`)

1.  **Prerequisites:**
    * Python (3.10+ recommended)
    * PostgreSQL (a running instance, e.g., on Supabase)
    * `pip` and `venv`

3.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    # Windows
    .\venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```

4.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Set up the Database:**
    * Create a PostgreSQL database (e.g., on Supabase).

6.  **Configure `.env` File:**
    * Create a `.env` file in the `puzzle_backend` root and add the following, filling in your credentials:
    ```dotenv
    # Django Secret Key (Generate a new one)
    DJANGO_SECRET_KEY='django-insecure-YOUR_RANDOM_SECRET_KEY'
    DEBUG=True

    # Supabase/PostgreSQL Database Credentials
    DB_NAME=postgres
    DB_USER=postgres.your_project_ref
    DB_PASSWORD=your_supabase_db_password
    DB_HOST=aws-0-region.pooler.supabase.com
    DB_PORT=6543

    # Azure AD App Registration Credentials
    AZURE_AD_CLIENT_ID="YOUR_AZURE_APP_CLIENT_ID"
    AZURE_AD_CLIENT_SECRET="YOUR_AZURE_APP_CLIENT_SECRET_VALUE"
    AZURE_AD_TENANT_ID="common" # or your specific tenant ID
    AZURE_AD_REDIRECT_URI="http://localhost:8000/auth/callback/" # Must match Azure App Reg
    ```

7.  **Run Migrations:**
    * This will create all the tables in your Supabase database.
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```

8.  **Create a Superuser:**
    * This account is for accessing the Django Admin (`/admin/`).
    ```bash
    python manage.py createsuperuser
    ```

9.  **Populate Initial Data:**
    * Run the server: `python manage.py runserver`
    * Go to `http://localhost:8000/admin/`.
    * Log in with your superuser credentials.
    * Go to the "Departments" section and add your company's departments (e.g., "Engineering", "Marketing").
    * Go to "Wordle Puzzles", "Sudoku Puzzles", etc. and add at least one of each.
    * Go to "Daily Puzzles" and create an entry for today, linking the puzzles you just created.
    * Go to "Rewards" and add items to the shop.
    * (Replace with instructions for running seeder)
      

10. **Run the Backend Server:**
    ```bash
    python manage.py runserver
    ```
    *The backend is now running at `http://localhost:8000`.*

---

### Frontend Setup (`frontend`)

1.  **Prerequisites:**
    * Node.js (LTS version, e.g., 18 or 20)
    * `npm`

2.  **Navigate to the frontend folder:**
    ```bash
    cd frontend
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Run the Frontend Server:**
    ```bash
    npm run dev
    ```
    *The frontend is now running at `http://localhost:5173` (or another port if 5173 is busy).*

---

## 📖 API Endpoints

All API endpoints require authentication (session cookie) unless marked as `AllowAny`.

### Auth & Users (`users/urls.py`)

* `GET /auth/login/` (AllowAny)
    * Initiates the MSAL login flow. Returns a Microsoft URL.
    * Called by: `loginPage.tsx`
* `GET /auth/callback/` (AllowAny)
    * The redirect URI that Microsoft calls *back*. Handles code exchange, logs user into Django, redirects to frontend.
    * Called by: Microsoft
* `GET /auth/check/` (IsAuthenticated)
    * Checks if the user has a valid session cookie. Returns full `UserProfile` data.
    * Called by: `authContext.tsx`
* `POST /auth/logout/` (IsAuthenticated)
    * Logs the user out of the Django session.
    * Called by: `authContext.tsx`
* `GET /api/departments/` (IsAuthenticated)
    * Returns a list of all `Department` objects (`[{"id": 1, "name": "Engineering"}, ...]`).
    * Called by: `firstTimeSetupModal.tsx`
* `POST /api/users/me/complete-profile/` (IsAuthenticated)
    * Sets the logged-in user's department and `profile_complete` flag.
    * Body: `{ "department_id": number }`
    * Called by: `firstTimeSetupModal.tsx`

### Games & Gameplay (`games/urls.py`, `gameplay/urls.py`)

* `GET /api/games/daily/` (IsAuthenticated)
    * Returns the `DailyPuzzleResponse` object with all nested puzzles for the day.
    * Called by: `gamePage.tsx`
* `GET /api/games/wordle/validate/` (IsAuthenticated)
    * Checks if a word is in the valid word list.
    * Params: `?word=HELLO`
    * Returns: `{ "is_valid": boolean }`
    * Called by: `wordleGame.tsx`
* `POST /api/submit-puzzle/` (IsAuthenticated)
    * Submits a completed game. Backend calculates score, creates `Submission`, updates points.
    * Body: `SubmissionData` (puzzle_id, puzzle_type, difficulty, time_taken_ms, tries)
    * Returns: `{ "score": number, "submissionId": number | null }`
    * Called by: `wordleGame.tsx`, `sudokuGame.tsx`, `ernigramGame.tsx`
* `GET /api/puzzle-attempt/` (IsAuthenticated)
    * Fetches the user's saved-game state for a specific puzzle.
    * Params: `?type=wordle`
    * Called by: `wordleGame.tsx`, etc.
* `POST /api/puzzle-attempt/save/` (IsAuthenticated)
    * Saves a user's in-progress game.
    * Body: `PuzzleAttemptData`
    * Called by: `wordleGame.tsx`, etc.
* `GET /api/submissions/today/` (IsAuthenticated)
    * Fetches all submissions for the current user for today.
    * Called by: `welcomeMessage.tsx`

### Challenges (`gameplay/urls.py`)

* `GET /api/users/` (IsAuthenticated)
    * Searches for users to challenge.
    * Params: `?search=gavin`
    * Called by: `challengeModal.tsx`
* `POST /api/challenges/` (IsAuthenticated)
    * Creates a new challenge.
    * Body: `CreateChallengeData`
    * Called by: `challengeModal.tsx`
* `GET /api/challenges/pending/` (IsAuthenticated)
    * Gets all challenges where the user is the recipient.
    * Called by: `notificationsBell.tsx`, `challengePage.tsx`
* `GET /api/challenges/completed/` (IsAuthenticated)
    * Gets the user's challenge history.
    * Called by: `challengePage.tsx`
* `POST /api/challenges/<id>/complete/` (IsAuthenticated)
    * Marks a challenge as complete after the recipient plays.
    * Body: `CompleteChallengeData`
    * Called by: `wordleGame.tsx`, etc.

### Leaderboards & Shop (`leaderboards/urls.py`, `shop/urls.py`)

* `GET /api/leaderboard/` (IsAuthenticated)
    * Gets pre-calculated leaderboard data.
    * Params: `?period=weekly&type=individual`
    * Called by: `leaderboardPage.tsx`, `leaderboardPreviewCard.tsx`
* `GET /api/shop/rewards/` (IsAuthenticated)
    * Returns a list of all active `RewardItem`s.
    * Called by: `shopPage.tsx`
* `POST /api/shop/claim/<id>/` (IsAuthenticated)
    * Attempts to claim a reward, deducting `current_points`.
    * Called by: `rewardCard.tsx`
* `GET /api/shop/claims/` (IsAuthenticated)
    * Returns a list of the user's past `ClaimedReward`s.
    * Called by: `shopHistoryModal.tsx`
* `GET /api/activity-hub/` (IsAuthenticated)
    * Returns `{ recent_activity: [...], online_users: [...] }`.
    * Called by: `activityFeed.tsx`, `whosOnline.tsx`
* `POST /api/heartbeat/` (IsAuthenticated)
    * Updates the user's `last_active` timestamp.
    * Called by: `whosOnline.tsx`

---

## 🧪 Quality & Testing

### Backend

* **Linting/Formatting:**
    ```bash
    # 1. Remove unused imports
    autoflake --in-place --recursive .

    # 2. Sort the remaining imports
    isort .

    # 3. Format everything else
    black .
    flake8 .
    ```
* **Running Tests:**
    ```bash
    pytest #run from root
    ```

### Frontend

* **Linting/Formatting:**
    ```bash
    npm run format
    npm run lint
    ```
* **Running Tests:**
    ```bash
    npm test
    ```

### Quality Gate (CI)

* A GitHub Actions workflow is defined in `.github/workflows/ci.yml`.
* This automatically runs all linters and tests for both frontend and backend on every pull request to the `main` branch.
* Branch protection rules in GitHub can be set to require these checks to pass before merging.

---

## Changelog

### v0.0.1 - November 13, 2025
* Initial deployment of website using Sprint 2 Progress


### v0.0.2 - November 19, 2025
* Bug fix for Sudoku's conflicting results, auto-submit, hints abuse, and grid alignment
* Fixes for other minor bugs
* Added distinguishable post game results modals for success and failure
* User interface responsiveness improvements
* Challenge modal shows list of users instead of having to search
* Improved challenges page
* Changelogs modal
* Improved Activity Feed
* Added points computation information on game pages

### v0.0.3 - November 20,2025
* Implementation of speed and fewer tries/mistakes bonus
* Bug fix for ERNIgram failing to submit/returning 0 points even on puzzle success
* Potential Score bars for Sudoku
* User interface responsiveness improvements
* Migration to ERNI entra

### v0.0.4 - December 12,2025
* Potential score bar for Wordle and ERNIgram
* Additional user roles and permissions for admin side
* Reward claims are now included in the activity feed!
* Improved Admin Dashboard
* Mobile responsive game components
* More bug fixes

### v0.0.5 - January 28,2026
* New Daily Log In bonus widget
* New About Us Page
* See the profile picture of who you can challenge
* Email notifications for 1 week or month inactivity
* Fixed bugs

---

![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-93%25-brightgreen)
![Code style](https://img.shields.io/badge/style-black-black)
[![Run Tests and Lint](https://github.com/K-N-B/better-play-ERNI/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/K-N-B/better-play-ERNI/actions/workflows/tests.yml)

