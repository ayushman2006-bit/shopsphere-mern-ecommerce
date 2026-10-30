import { test, expect } from '@playwright/test';
import {
  clearCart,
  clearWishlist,
  loginAsCustomer,
  openProduct,
} from './helpers';

const ADDRESS = {
  fullName: 'Alex Morgan',
  phone: '9876543210',
  street: '42 QA Residency, 5th Cross',
  city: 'Bengaluru',
  state: 'Karnataka',
  postalCode: '560001',
};

const orderNumberFrom = (text) => {
  const match = String(text).match(/SS-[A-Z0-9-]+/);
  expect(match, `Expected an order number in "${text}"`).not.toBeNull();
  return match[0];
};

const fillCheckoutAddress = async (page) => {
  await page.getByLabel('Full name').fill(ADDRESS.fullName);
  await page.getByLabel('Phone number').fill(ADDRESS.phone);
  await page.getByLabel('Street address').fill(ADDRESS.street);
  await page.getByLabel('City').fill(ADDRESS.city);
  await page.getByLabel('State').fill(ADDRESS.state);
  await page.getByLabel('PIN code').fill(ADDRESS.postalCode);
};

test.describe('Cart, checkout and order lifecycle', () => {
  test('customer can apply a coupon, pay online and cancel the order', async ({ page }) => {
    await loginAsCustomer(page);
    await clearCart(page);
    await clearWishlist(page);

    // Add a product from its details page.
    await openProduct(page, 'Aurora ANC Wireless Headphones');
    await page.getByRole('button', { name: 'Add to cart', exact: true }).first().click();
    await expect(page.getByText('Aurora ANC Wireless Headphones added to cart')).toBeVisible();

    await page.getByRole('link', { name: 'Cart', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Shopping cart/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Aurora ANC Wireless Headphones', exact: true }).first()).toBeVisible();

    // Quantity updates are persisted through the cart API.
    await page.getByRole('button', { name: 'Increase quantity' }).click();
    await expect(page.getByText('Subtotal (2 items)')).toBeVisible();

    await page.getByRole('button', { name: /Proceed to checkout/ }).click();
    await expect(page.getByRole('heading', { name: 'Secure checkout' })).toBeVisible();

    await fillCheckoutAddress(page);

    // Apply a server-validated coupon.
    await page.getByLabel('Coupon code').fill('SAVE10');
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(page.getByText('SAVE10 applied')).toBeVisible();
    await expect(page.getByText('Coupon discount')).toBeVisible();

    // Simulated online payment.
    await page.getByText('ShopSphere Pay (simulated)', { exact: true }).click();
    await expect(page.getByText(/simulated payment gateway/i)).toBeVisible();
    await page.getByRole('button', { name: /^Pay / }).click();

    await expect(page).toHaveURL(/\/order-confirmation\//);
    await expect(page.getByRole('heading', { name: 'Thank you for your order!' })).toBeVisible();
    await expect(page.getByText(/Your simulated payment was approved/)).toBeVisible();
    await expect(page.getByText(/Coupon \(SAVE10\)/)).toBeVisible();

    const confirmationText = await page.getByText(/has been placed successfully/).innerText();
    const orderNumber = orderNumberFrom(confirmationText);

    // The order is trackable and still cancellable while pending.
    await page.getByRole('link', { name: /Track this order/ }).click();
    await expect(page).toHaveURL(/\/orders\/[a-f0-9]{24}$/);
    await expect(page.getByRole('heading', { name: `Order ${orderNumber}` })).toBeVisible();
    await expect(page.getByText('Order tracking')).toBeVisible();
    await expect(page.getByText('Paid', { exact: true }).first()).toBeVisible();

    await page.getByRole('button', { name: /Cancel order/ }).click();
    const cancelDialog = page.getByRole('dialog');
    await expect(cancelDialog.getByRole('heading', { name: 'Cancel this order?' })).toBeVisible();
    await cancelDialog.getByLabel(/Reason/).fill('Ordered by the automated QA suite');
    await cancelDialog.getByRole('button', { name: 'Cancel order' }).click();

    await expect(page.getByText(/This order was cancelled/)).toBeVisible();
    await expect(page.getByText('Refunded', { exact: true }).first()).toBeVisible();

    // The cancelled order appears in the customer's history.
    await page.getByRole('link', { name: 'All orders' }).click();
    await expect(page.getByRole('heading', { name: 'My orders' })).toBeVisible();
    const historyCard = page.locator('article').filter({ hasText: orderNumber });
    await expect(historyCard).toBeVisible();
    await expect(historyCard.getByText('Cancelled', { exact: true })).toBeVisible();

    // Placing the order emptied the persisted cart.
    await page.getByRole('link', { name: 'Cart', exact: true }).click();
    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });

  test('cash-on-delivery order can be filtered, reordered and the cart cleared', async ({ page }) => {
    await loginAsCustomer(page);
    await clearCart(page);
    await clearWishlist(page);

    await openProduct(page, 'Atomic Habits');
    await page.getByRole('button', { name: 'Add to cart', exact: true }).first().click();
    await expect(page.getByText('Atomic Habits added to cart')).toBeVisible();
    await page.getByRole('link', { name: 'Cart', exact: true }).click();
    await page.getByRole('button', { name: /Proceed to checkout/ }).click();
    await expect(page.getByRole('heading', { name: 'Secure checkout' })).toBeVisible();

    await fillCheckoutAddress(page);
    await expect(page.getByText('Cash on delivery', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /^Place order/ }).click();

    await expect(page).toHaveURL(/\/order-confirmation\//);
    await expect(page.getByText(/You will pay in cash on delivery/)).toBeVisible();
    const confirmationText = await page.getByText(/has been placed successfully/).innerText();
    const orderNumber = orderNumberFrom(confirmationText);

    // Order history status filters.
    await page.goto('/orders');
    await expect(page.getByRole('heading', { name: 'My orders' })).toBeVisible();
    await expect(page.locator('article').filter({ hasText: orderNumber })).toBeVisible();

    await page.getByRole('button', { name: 'Pending', exact: true }).click();
    await expect(page).toHaveURL(/status=Pending/);
    await expect(page.locator('article').filter({ hasText: orderNumber })).toBeVisible();

    await page.getByRole('button', { name: 'Delivered', exact: true }).click();
    await expect(page).toHaveURL(/status=Delivered/);
    await expect(page.locator('article').filter({ hasText: orderNumber })).toHaveCount(0);

    await page.getByRole('button', { name: 'All', exact: true }).click();
    const historyCard = page.locator('article').filter({ hasText: orderNumber });
    await historyCard.getByRole('link', { name: /View details/ }).click();
    await expect(page.getByRole('heading', { name: `Order ${orderNumber}` })).toBeVisible();

    // Buy again repopulates the cart from the order snapshot.
    await page.getByRole('button', { name: /Buy again/ }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByRole('link', { name: 'Atomic Habits', exact: true }).first()).toBeVisible();

    // Clearing the cart requires confirmation.
    await page.getByRole('button', { name: 'Clear cart', exact: true }).click();
    const clearDialog = page.getByRole('dialog');
    await expect(clearDialog.getByRole('heading', { name: 'Clear your cart?' })).toBeVisible();
    await clearDialog.getByRole('button', { name: 'Clear cart' }).click();
    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });

  test('wishlist saves a product and moves it into the cart', async ({ page }) => {
    await loginAsCustomer(page);
    await clearCart(page);
    await clearWishlist(page);

    await openProduct(page, 'AeroBrew Precision Coffee Maker');
    await page.getByRole('button', { name: /Save to wishlist/ }).click();
    await expect(page.getByRole('button', { name: /Saved to wishlist/ })).toBeVisible();

    await page.getByLabel('Wishlist', { exact: true }).click();
    await expect(page.getByRole('heading', { name: /My wishlist/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'AeroBrew Precision Coffee Maker', exact: true }).first()).toBeVisible();

    await page.getByRole('button', { name: /Move to cart/ }).click();
    await expect(page.getByText('Moved to cart')).toBeVisible();
    await expect(page.getByText('Your wishlist is empty')).toBeVisible();

    await page.getByRole('link', { name: 'Cart', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Shopping cart/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'AeroBrew Precision Coffee Maker', exact: true }).first()).toBeVisible();
  });
});
