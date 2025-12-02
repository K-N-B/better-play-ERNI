import { test, expect } from '@playwright/test';

test.describe('Critical User Journey', () => {
  
  test.beforeEach(async ({ page }) => {
    
    // --- Date Helper (Local Time) ---
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    console.log('Test Date:', today);

    // 1. Auth Mock (Initial State: 500 Points)
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
            current_points: 500 // <--- INITIAL POINTS
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

    // 5. Daily Puzzles Mock
    await page.route('**/api/games/daily/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          date: today,
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

    // --- ✅ NEW CHECK: Verify Initial Points ---
     await expect(page.getByText("Loading...")).not.toBeVisible({ timeout: 10000 });
    // We look for the exact text "500" in the navbar area
    let pointsBar = page.getByTestId('points-bar');
    await expect(pointsBar).toBeVisible();
    await expect(pointsBar).toContainText('500');

    // 2. Verify Dashboard
   
    await expect(page.getByText("Who's Online")).toBeVisible();
    await expect(page.getByText("Colleague Bob")).toBeVisible(); 

    // 3. Navigate to Wordle
    await page.getByRole('main').getByRole('link', { name: /Wordle/i }).click();
    await page.waitForURL('**/game/wordle');

    // 4. Wait for Intro Screen
    await expect(page.getByText(/How to play/i)).toBeVisible({ timeout: 10000 });

    // 5. Start Game
    await page.getByRole('button', { name: /Start/i }).click({ force: true });

    // 6. Verify Game Board Loaded
    await expect(page.getByText(/difficulty/i)).toBeVisible({ timeout: 10000 });

    // 7. Play the Game
    await page.keyboard.type('APPLE');
    await expect(page.getByText('A').first()).toBeVisible();

    // --- ✅ CRITICAL STEP: Override Auth Mock for Win State ---
    // Before we hit Enter, we tell Playwright: "If the app asks for the user again, return 650 points."
    // Playwright uses the most recently defined route handler.
    await page.route('**/auth/**', async route => {
        const url = route.request().url();
        if (url.includes('logout')) { await route.fulfill({ status: 200 }); return; }
        
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
              current_points: 650 // <--- UPDATED POINTS (500 + 150)
            }
          } 
        });
    });

    // 8. Submit Guess (Triggers the Win -> Triggers refetchUser)
    await page.keyboard.press('Enter');

    // 9. Handle Win Scenario (Results Modal)
    await expect(page.getByText('150')).toBeVisible({ timeout: 10000 });
    
    // 10. Return to Dashboard
    await page.getByRole('button', { name: /Return to Home/i }).first().click();
    await expect(page.getByText("Who's Online")).toBeVisible();

    // --- ✅ FINAL CHECK: Verify Updated Points ---
    // This confirms your context.refreshUser() worked!
    // The timeout allows the animation to finish counting up.
    pointsBar = page.getByTestId('points-bar');
    await expect(pointsBar).toBeVisible();
    await expect(pointsBar).toContainText('650');
  });
});