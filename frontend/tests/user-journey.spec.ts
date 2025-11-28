import { test, expect } from '@playwright/test';

test.describe('Critical User Journey', () => {
  
  test.beforeEach(async ({ page }) => {
    
    // --- Date Helper (Local Time) ---
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    console.log('Test Date:', today);

    // 1. Auth Mock
    // We use a broad wildcard to catch all auth requests
    await page.route('**/auth/**', async route => {
      const url = route.request().url();
      if (url.includes('logout')) {
        await route.fulfill({ status: 200 });
        return;
      }
      await route.fulfill({ 
        status: 200,
        json: { 
          authenticated: true, 
          user: { 
            id: 1, 
            username: 'TestUser', 
            email: 'test@erni.com', 
            profile_picture_url: null,
            profile_complete: true,
            department: { id: 1, name: 'Engineering' },
            current_points: 500
          }
        } 
      });
    });

    // 2. Dashboard Mock
    await page.route('**/api/activity-hub/**', async route => {
      await route.fulfill({ 
        json: { 
          online_users: [{ id: 2, username: 'Colleague Bob', profile_picture_url: null }],
          recent_activity: [] 
        } 
      });
    });

    // 3. Game Config Mock
    await page.route('**/api/games/limits/**', async route => {
      await route.fulfill({ 
        json: { 
          BASE_POINTS: { HARD: 100, EASY: 50 }, 
          TIME_LIMITS_MS: { HARD: 600000, EASY: 600000 },
          MISTAKE_LIMITS: { HARD: 3, EASY: 5 }
        } 
      });
    });

    // 4. Heartbeat Mock
    await page.route('**/api/heartbeat/', async route => {
      await route.fulfill({ status: 200 });
    });

    // --- 5. Daily Puzzles Mock (CRITICAL FIX) ---
    // Used '**' to match any domain/port. Added the required 'date' field.
    await page.route('**/api/games/daily/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          date: today, // ✅ REQUIRED by GamePage to check submissions
          wordle_easy: {
             id: 99,
             date_to_be_used: today,
             solution_word: "APPLE",
             word_length: 5,
          },
          wordle_hard: {
             id: 100,
             date_to_be_used: today,
             solution_word: "APPLE",
             word_length: 5,
          },
          sudoku: null,
          ernigram: null
        }
      });
    });

    // 6. Wordle Logic Mocks
    await page.route('**/api/gameplay/check-submission/**', async route => {
      await route.fulfill({ json: { hasSubmitted: false } });
    });
    await page.route('**/api/gameplay/progress/**', async route => {
       // Return null (404) for saved attempt so it doesn't auto-resume
       await route.fulfill({ status: 404 }); 
    });
    await page.route('**/api/gameplay/save/**', async route => {
      await route.fulfill({ json: { success: true } });
    });
    await page.route('**/api/gameplay/submit/**', async route => {
      await route.fulfill({ 
        json: { 
          points_awarded: 150, 
          submission_id: 99, 
          message: 'Great Job!',
          current_streak: 5 
        } 
      });
    });
    
    // 7. Dictionary
    await page.route('**/wordLists/*.json', async route => {
      await route.fulfill({ json: ["APPLE", "BERRY", "CHERRY"] });
    });
  });

  test('User can view dashboard, see colleagues, and play Wordle', async ({ page }) => {
    // 1. Visit Home
    await page.goto('/');

    // 2. Verify Dashboard
    // Wait for loading to finish is critical for stability
    await expect(page.getByText("Loading...")).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Who's Online")).toBeVisible();
    await expect(page.getByText("Colleague Bob")).toBeVisible(); 

    // 3. Navigate to Wordle
    // Scope to 'main' to avoid clicking navbar links
    await page.getByRole('main').getByRole('link', { name: /Wordle/i }).click();
    
    await page.waitForURL('**/game/wordle');

    // 4. Wait for Intro Screen
    // If this fails, the "Puzzle Not Available" screen likely appeared instead.
    await expect(page.getByText(/How to play/i)).toBeVisible({ timeout: 10000 });

    // 5. Start Game (Easy Mode by default)
    // Force click to ensure we bypass any potential overlay issues
    await page.getByRole('button', { name: /Start/i }).click({ force: true });

    // 6. Verify Game Board Loaded
    // The "difficulty" badge appears on the game board
    await expect(page.getByText(/difficulty/i)).toBeVisible({ timeout: 10000 });

    // 7. Play the Game
    await page.keyboard.type('APPLE');
    // Verify letter 'A' is visible on the grid
    await expect(page.getByText('A').first()).toBeVisible();

    // 8. Submit Guess
    await page.keyboard.press('Enter');

    // 9. Handle Win Scenario (Results Modal)
    await expect(page.getByText('150')).toBeVisible({ timeout: 10000 });
    
    // 10. Return to Dashboard
    await page.getByRole('button', { name: /Return to Home/i }).first().click();
    await expect(page.getByText("Who's Online")).toBeVisible();
  });
});