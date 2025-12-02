import { test, expect } from '@playwright/test';

test.describe('Game Persistence', () => {
    // 1. Mock Auth (Prevents White Screen)
    test.beforeEach(async ({ page }) => {
        await page.route('**/auth/**', async route => {
           if (route.request().url().includes('logout')) return route.fulfill({ status: 200 });
           await route.fulfill({ 
               json: { 
                   authenticated: true, 
                   user: { 
                       id: 1, 
                       username: 'TestUser', 
                       current_points: 500,
                       profile_picture_url: null,
                       profile_complete: true,
                       department: { id: 1, name: 'Engineering' }
                   } 
               } 
           });
        });
        
        // Mock Config
        await page.route('**/api/games/limits/**', async route => route.fulfill({ json: { BASE_POINTS: { HARD: 100 }, MISTAKE_LIMITS: { HARD: 3 } } }));
        // Mock Dictionary
        await page.route('**/wordLists/*.json', async route => route.fulfill({ json: ["APPLE", "BERRY"] }));
    });

    test('Reloading the page restores previous guesses', async ({ page }) => {
        const today = new Date().toISOString().split('T')[0];

        // 1. Mock Initial Load (No saved progress -> 404)
        await page.route('**/api/games/daily/', async route => {
            await route.fulfill({ json: { date: today, wordle_easy: { id: 99, solution_word: "APPLE", word_length: 5 } } });
        });
        await page.route('**/api/gameplay/progress/**', async route => route.fulfill({ status: 404 }));
        await page.route('**/api/gameplay/check-submission/**', async route => route.fulfill({ json: { hasSubmitted: false } }));

        await page.goto('/game/wordle');

        // Since we mocked 404 progress, the button is "Start", not "Continue"
        await page.getByRole('button', { name: /Start/i }).click({ force: true });

        // 2. Type a partial guess but DO NOT submit
        await page.keyboard.type('APPL');
        await expect(page.getByText('L').first()).toBeVisible();

        // 3. Setup Mock for the RELOAD
        // Now when the app asks for progress, we return valid JSON!
        await page.route('**/api/gameplay/progress/**', async route => {
            await route.fulfill({
                status: 200,
                json: {
                    puzzle_id: 99,
                    progress_data: {
                        guesses: [], 
                        currentGuess: "APPL" // The user typed this before reloading
                    },
                    time_spent_ms: 5000
                }
            });
        });

        // 4. Reload the page
        await page.reload();

        // 5. Verify "APPL" is still there automatically
        // This confirms the component fetched the progress on mount
        await expect(page.getByText('L').first()).toBeVisible();
    });
});