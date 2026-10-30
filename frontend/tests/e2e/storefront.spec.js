import { test, expect } from '@playwright/test';

test.describe('Storefront', () => {
  test('home page renders live sections and navigation', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Shop smarter/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Find your next favourite' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Featured this week' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'What everyone is buying' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'New arrivals' })).toBeVisible();

    // Live data: six categories and product cards from the API.
    await expect(page.locator('a[href^="/products?category="]').first()).toBeVisible();
    await expect(page.locator('article').first()).toBeVisible();

    // Primary hero CTA navigates into the catalogue.
    await page.getByRole('link', { name: /Shop the catalogue/ }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('heading', { name: 'All products', exact: true })).toBeVisible();
  });

  test('catalogue supports search, category filtering, sorting and pagination', async ({ page }) => {
    await page.goto('/products');

    await expect(page.getByRole('heading', { name: 'All products', exact: true })).toBeVisible();
    await expect(page.getByText(/Showing 12 of 35 results/)).toBeVisible();

    // Search
    const search = page.getByPlaceholder('Search the catalogue…');
    await search.fill('headphones');
    await search.press('Enter');
    await expect(page).toHaveURL(/keyword=headphones/);
    await expect(page.getByRole('heading', { name: /Results for/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Aurora ANC Wireless Headphones', exact: true }).first()).toBeVisible();

    // Clear the active chip
    await page.getByRole('button', { name: /Clear all/ }).first().click();
    await expect(page).toHaveURL(/\/products$/);

    // Category filter
    await page.getByRole('button', { name: /^Books/ }).click();
    await expect(page).toHaveURL(/category=books/);
    await expect(page.getByRole('heading', { name: 'Books', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Atomic Habits', exact: true }).first()).toBeVisible();

    // Sort control
    await page.getByLabel('Sort by').selectOption('price_asc');
    await expect(page).toHaveURL(/sort=price_asc/);
    await expect(page.getByRole('link', { name: 'Atomic Habits', exact: true }).first()).toBeVisible();

    // Remove the category chip so pagination is available again.
    await page.getByRole('button', { name: /^Books/ }).first().click();
    await expect(page.getByRole('navigation', { name: 'Pagination' })).toBeVisible();
    await page.getByRole('button', { name: '2', exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText(/Showing 12 of 35 results/)).toBeVisible();
  });

  test('product details gallery, wishlist prompt and add-to-cart work', async ({ page }) => {
    await page.goto('/products?keyword=Aurora');
    await page.getByRole('link', { name: 'Aurora ANC Wireless Headphones', exact: true }).first().click();

    await expect(page.getByRole('heading', { name: 'Aurora ANC Wireless Headphones', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View image 2' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add to cart', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Buy now', exact: true })).toBeVisible();

    // Gallery thumbnail switches the active image.
    const mainImage = page.getByRole('img', { name: 'Aurora ANC Wireless Headphones', exact: true });
    const initialSrc = await mainImage.getAttribute('src');
    await page.getByRole('button', { name: 'View image 2' }).click();
    await expect(mainImage).not.toHaveAttribute('src', initialSrc);

    // Guest wishlist clicks redirect to login.
    await page.getByRole('button', { name: 'Add to wishlist' }).first().click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Log in to ShopSphere' })).toBeVisible();

    // Continue as guest, add to cart and verify the cart page.
    await page.goto('/products?keyword=Aurora');
    await page.getByRole('link', { name: 'Aurora ANC Wireless Headphones', exact: true }).first().click();
    await page.getByRole('button', { name: 'Add to cart', exact: true }).first().click();
    await expect(page.getByText(/Aurora ANC Wireless Headphones added to cart/)).toBeVisible();
    await page.getByRole('link', { name: 'Cart', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Shopping cart/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Aurora ANC Wireless Headphones', exact: true }).first()).toBeVisible();
    await expect(page.getByText('Order summary')).toBeVisible();
  });

  test('unknown routes show the branded 404 page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await expect(page.getByRole('heading', { name: 'This aisle does not exist' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to home/ })).toBeVisible();
    await page.getByRole('link', { name: /Browse products/ }).click();
    await expect(page).toHaveURL(/\/products$/);
  });
});
