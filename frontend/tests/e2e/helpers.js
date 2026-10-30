import { expect } from '@playwright/test';

export const CUSTOMER = {
  email: 'customer@shopsphere.com',
  password: 'Customer@123',
  name: 'Alex Morgan',
};

export const ADMIN = {
  email: 'admin@shopsphere.com',
  password: 'Admin@12345',
  name: 'Store Administrator',
};

/**
 * Small fetch wrapper that runs inside the page so the same JWT and Vite proxy
 * used by the app are reused for test setup/cleanup.
 */
export const api = (page, path, options = {}) =>
  page.evaluate(
    async ({ path, options }) => {
      const token = localStorage.getItem('shopsphere_token');
      const response = await fetch(`/api${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {}),
        },
      });
      const text = await response.text();
      let body = text;
      try {
        body = JSON.parse(text);
      } catch {
        // Keep plain-text responses as-is.
      }
      return { ok: response.ok, status: response.status, body };
    },
    { path, options }
  );

export const clearCart = async (page) => {
  const result = await api(page, '/cart', { method: 'DELETE' });
  expect(result.ok, `Could not clear cart: ${JSON.stringify(result.body)}`).toBeTruthy();
};

export const clearWishlist = async (page) => {
  const list = await api(page, '/wishlist');
  expect(list.ok, `Could not load wishlist: ${JSON.stringify(list.body)}`).toBeTruthy();
  const products = list.body?.wishlist?.products || [];
  for (const product of products) {
    const result = await api(page, `/wishlist/${product._id}`, { method: 'DELETE' });
    expect(result.ok, `Could not clear wishlist item: ${JSON.stringify(result.body)}`).toBeTruthy();
  }
};

export const loginAsCustomer = async (page) => {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(CUSTOMER.email);
  await page.getByLabel('Password', { exact: true }).fill(CUSTOMER.password);
  await page.getByRole('button', { name: /^Log in$/ }).click();
  await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
};

export const loginAsAdmin = async (page) => {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(ADMIN.email);
  await page.getByLabel('Password', { exact: true }).fill(ADMIN.password);
  await page.getByRole('button', { name: /^Log in$/ }).click();
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
};

export const openProduct = async (page, name) => {
  await page.goto(`/products?keyword=${encodeURIComponent(name)}`);
  await page.getByRole('link', { name, exact: true }).first().click();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
};

export const logout = async (page) => {
  const logoutButton = page.getByRole('button', { name: /Log out/ });
  // The account menu may already be open when a test asserts its contents.
  if (!(await logoutButton.isVisible())) {
    await page.getByRole('button', { name: 'Account menu' }).click();
  }
  await logoutButton.click();
  await expect(page.getByRole('banner').getByRole('link', { name: 'Log in', exact: true })).toBeVisible();
};
