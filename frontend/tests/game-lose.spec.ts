import { test, expect } from '@playwright/test';

test.describe('Game Loss Scenario', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Mock Auth
    await page.route('**/auth/**', async route => {
        if (route.request().url().includes('logout')) return route.fulfill({ status: 200 });
        await route.fulfill({ 
            json: { 
                authenticated: true, 
                user: { 
                    id: 1, username: 'TestUser', current_points: 500,
                    profile_picture_url: null, profile_complete: true, department: { id: 1, name: 'Engineering' }
                } 
            } 
        });
    });

    // 2. Mock Daily Puzzle (Solution ZZZZZ)
    const today = new Date().toISOString().split('T')[0];
    await page.route('**/api/games/daily/', async route => {
        await route.fulfill({ json: { date: today, wordle_easy: { id: 99, solution_word: "ZZZZZ", word_length: 5 } } });
    });

    // 3. Mock Dictionary
    await page.route('**/wordLists/*.json', async route => route.fulfill({ json: ["APPLE", "ZZZZZ"] }));

    // 4. Mock Config & Logic
    await page.route('**/api/games/limits/**', async route => route.fulfill({ json: { BASE_POINTS: { EASY: 50 }, MISTAKE_LIMITS: { EASY: 6 } } }));
    await page.route('**/api/gameplay/check-submission/**', async route => route.fulfill({ json: { hasSubmitted: false } }));
    await page.route('**/api/gameplay/progress/**', async route => route.fulfill({ status: 404 }));
    await page.route('**/api/gameplay/save/**', async route => route.fulfill({ json: { success: true } }));
  });

  test('Losing a game shows failure modal and keeps points static', async ({ page }) => {
    await page.route('**/api/gameplay/submit/**', async route => {
        await route.fulfill({ 
            json: { status: 'LOST', points_awarded: 0, message: 'Puzzle Failed!' } 
        });
    });

    await page.goto('/game/wordle');
    await page.getByRole('button', { name: /Start/i }).click({ force: true });
    
    // Ensure game board is ready
    await expect(page.getByText(/difficulty/i)).toBeVisible();

    // --- THE LOOP ---
    for (let i = 0; i < 6; i++) {
        await page.keyboard.type('APPLE');
        
        // ✅ NEW SELECTOR STRATEGY
        // 1. We verify the letter appears in the MAIN area (ignoring the "Menu")
        // 2. We use { exact: true } so 'E' doesn't match words like 'ENTER' or 'SCORE'
        await expect(page.locator('main').getByText('E', { exact: true }).first()).toBeVisible({ timeout: 2000 });

        // Click Enter
        await page.getByRole('button', { name: /Enter|↵/i }).click({ force: true });

        // Wait for animation
        await page.waitForTimeout(3000); 
    }

    // Expect Failure Modal
    await expect(page.getByText(/Failed|Game Over|Luck/i)).toBeVisible({ timeout: 10000 });

    // Verify Points are STILL 500
    await expect(page.locator('header').getByText('500')).toBeVisible();
  });
});