import { test, expect } from '@playwright/test';

test.describe('Wordle Gameplay Flow', () => {
  test('User can visit game page and type a guess', async ({ page }) => {
    // 1. Go to the page (update URL to your local dev URL)
    await page.goto('http://localhost:5173/game/wordle/1');

    // 2. Wait for game to load
    await expect(page.getByText('Wordle')).toBeVisible();

    // 3. Type "APPLE" using physical keyboard
    await page.keyboard.type('APPLE');
    
    // 4. Verify letters appear in the grid (assuming grid cells have accessible roles or classes)
    // You might need to add data-testid="tile-0-0" to your grid components for robust E2E
    await expect(page.getByText('A').first()).toBeVisible();

    // 5. Submit guess
    await page.keyboard.press('Enter');

    // 6. Check for feedback (e.g., if invalid word, an error toast appears)
    // await expect(page.getByText('Not a valid word')).toBeVisible(); 
  });
});