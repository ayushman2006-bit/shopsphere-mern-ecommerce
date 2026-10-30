import { test, expect } from '@playwright/test';
import { CUSTOMER, loginAsCustomer, logout } from './helpers';

test.describe('Authentication and access control', () => {
  test('invalid credentials show a clear error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(CUSTOMER.email);
    await page.getByLabel('Password', { exact: true }).fill('WrongPassword123');
    await page.getByRole('button', { name: /^Log in$/ }).click();

    await expect(page.getByText('Invalid email or password').first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('protected routes redirect to login and return afterwards', async ({ page }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Log in to ShopSphere' })).toBeVisible();

    await page.getByLabel('Email address').fill(CUSTOMER.email);
    await page.getByLabel('Password', { exact: true }).fill(CUSTOMER.password);
    await page.getByRole('button', { name: /^Log in$/ }).click();

    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByRole('heading', { name: 'My orders' })).toBeVisible();
  });

  test('customer can log in, open the account menu and log out', async ({ page }) => {
    await loginAsCustomer(page);

    await page.getByRole('button', { name: 'Account menu' }).click();
    const accountMenu = page.getByRole('banner');
    await expect(accountMenu.getByText(CUSTOMER.email)).toBeVisible();
    await expect(accountMenu.getByRole('link', { name: 'My profile', exact: true })).toBeVisible();
    await expect(accountMenu.getByRole('link', { name: 'My orders', exact: true })).toBeVisible();
    await expect(accountMenu.getByRole('link', { name: 'Wishlist', exact: true }).last()).toBeVisible();

    await accountMenu.getByRole('link', { name: 'My profile', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'My profile' })).toBeVisible();
    await expect(page.getByText(CUSTOMER.email)).toBeVisible();

    await logout(page);
    await expect(page.getByRole('banner').getByRole('link', { name: 'Log in', exact: true })).toBeVisible();
  });

  test('new customer can register and is signed in automatically', async ({ page }) => {
    const email = `qa.${Date.now()}@shopsphere.test`;

    await page.goto('/register');
    await page.getByLabel('Full name').fill('QA Test Customer');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel(/Phone number/).fill('9000012345');
    await page.getByLabel('Password', { exact: true }).fill('Test@12345');
    await page.getByLabel('Confirm password').fill('Test@12345');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /Create account/ }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible();
    await page.getByRole('button', { name: 'Account menu' }).click();
    await expect(page.getByText(email)).toBeVisible();
    await logout(page);
  });

  test('customers cannot open the admin area', async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('You need an administrator account to open that page.')).toBeVisible();
  });
});
