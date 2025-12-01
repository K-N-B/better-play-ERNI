import { test, expect } from '@playwright/test';

test.describe('Shop Purchasing Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 0. Debugging
    page.on('console', msg => {
        if (msg.type() === 'error') console.log(`[Browser Error]: "${msg.text()}"`);
    });
    page.on('pageerror', err => console.log(`[App Crash]: ${err.message}`));

    // 1. Mock Auth
    await page.route('**/auth/**', async route => {
       if (route.request().url().includes('logout')) return route.fulfill({ status: 200 });
       await route.fulfill({ 
           status: 200,
           contentType: 'application/json',
           json: { 
               authenticated: true, 
               user: { 
                   id: 1, 
                   username: 'TestUser', 
                   email: 'test@example.com',
                   current_points: 500, // Initial Points
                   profile_picture_url: null,
                   profile_complete: true,
                   department: { id: 1, name: 'Engineering' } 
               } 
           } 
       });
    });

    // 2. ✅ MOCK REWARD LIST (Matches RewardListView)
    // Matches /api/shop/rewards/ OR /api/shop/rewards?page=1
    await page.route(/.*\/api\/shop\/rewards.*/, async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            json: [
                { 
                    id: 1, 
                    name: "Cool Sticker", 
                    description: "A shiny laptop sticker", 
                    cost: 100, 
                    image: "/media/rewards/sticker.png", 
                    stock: 50, 
                    is_active: true,
                    max_claims_per_user: null
                }
            ]
        });
    });

    // 3. ✅ MOCK CLAIM ACTION (Matches ClaimRewardView)
    // Matches POST /api/shop/claim/1/
    await page.route(/.*\/api\/shop\/claim\/\d+\/?/, async route => {
        console.log(`>> ✅ MOCKING CLAIM RESPONSE FOR: ${route.request().url()}`);
        await route.fulfill({ 
            status: 200, 
            contentType: 'application/json',
            // Return exactly what your Django view returns
            json: { 
                success: true, 
                message: "Successfully claimed Cool Sticker!",
                remainingPoints: 400 
            } 
        });
    });

    // 4. Safe Fallback for other shop calls (like /claims/)
    await page.route('**/api/shop/**', async route => {
        const url = route.request().url();
        // Don't intercept rewards or claim calls here
        if (url.match(/rewards|claim/)) return route.fallback();
        
        await route.fulfill({ status: 200, json: [] }); 
    });
  });

  test('Buying an item updates the navbar points', async ({ page }) => {
    await page.goto('/shop');
    
    // Check page loaded
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 }); 
    await expect(page.getByText('Cool Sticker')).toBeVisible();
    await expect(page.locator('header').getByText('500')).toBeVisible();

    // --- Override Auth for AFTER purchase ---
    // Even though your backend returns 'remainingPoints', your frontend might still 
    // rely on 'refreshUser()' to update the global context. We mock this to be safe.
    await page.route('**/auth/**', async route => {
       if (route.request().url().includes('logout')) return route.fulfill({ status: 200 });
       await route.fulfill({ 
           status: 200,
           contentType: 'application/json',
           json: { 
               authenticated: true, 
               user: { 
                   id: 1, 
                   current_points: 400, // 500 - 100 = 400
                   username: 'TestUser',
                   email: 'test@example.com',
                   profile_picture_url: null,
                   profile_complete: true,
                   department: { id: 1, name: 'Engineering' }
               } 
           } 
       });
    });

    // Click Buy
    await page.getByRole('button', { name: /Purchase|Buy|100/i }).first().click({ force: true });

    // Verify Success Message
    await expect(page.getByText(/Successfully claimed/i)).toBeVisible({ timeout: 10000 });

    // Verify Points Update
    await expect(page.locator('header').getByText('400')).toBeVisible({ timeout: 10000 });
  });
});