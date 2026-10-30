import { test, expect } from '@playwright/test';
import { CUSTOMER, loginAsAdmin } from './helpers';

const ADMIN_ADDRESS = {
  fullName: 'Alex Morgan',
  phone: '9876543210',
  street: '42 QA Residency, 5th Cross',
  city: 'Bengaluru',
  state: 'Karnataka',
  postalCode: '560001',
};

const createCustomerOrder = async (request, productKeyword = 'Atomic Habits') => {
  const login = await request.post('/api/auth/login', {
    data: { email: CUSTOMER.email, password: CUSTOMER.password },
  });
  expect(login.ok(), 'Customer login for order setup failed').toBeTruthy();
  const { token } = await login.json();
  const headers = { Authorization: `Bearer ${token}` };

  await request.delete('/api/cart', { headers });

  const productsResponse = await request.get(`/api/products?keyword=${encodeURIComponent(productKeyword)}`);
  expect(productsResponse.ok(), 'Product lookup for order setup failed').toBeTruthy();
  const { products } = await productsResponse.json();
  expect(products.length, `No product matched "${productKeyword}"`).toBeGreaterThan(0);

  const addResponse = await request.post('/api/cart', {
    headers,
    data: { productId: products[0]._id, quantity: 1 },
  });
  expect(addResponse.ok(), 'Adding a product to the cart for order setup failed').toBeTruthy();

  const orderResponse = await request.post('/api/orders', {
    headers,
    data: { shippingAddress: ADMIN_ADDRESS, paymentMethod: 'COD' },
  });
  expect(orderResponse.ok(), 'Creating the order for admin setup failed').toBeTruthy();
  const { order } = await orderResponse.json();
  return order;
};

test.describe('Admin dashboard and management', () => {
  test('dashboard shows live statistics, chart, best sellers and recent orders', async ({ page }) => {
    await loginAsAdmin(page);

    await expect(page.getByText('Live store overview')).toBeVisible();
    for (const label of ['Total revenue', 'Total orders', 'Customers', 'Products']) {
      await expect(page.getByRole('main').getByText(label, { exact: true })).toBeVisible();
    }

    await expect(page.getByRole('heading', { name: 'Sales overview' })).toBeVisible();
    await expect(page.getByText('Revenue in period')).toBeVisible();
    await page.getByRole('button', { name: '30 days', exact: true }).click();
    await expect(page.getByText('Revenue in period')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Best sellers' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent orders' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Low stock' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Catalogue mix' })).toBeVisible();

    const recentRow = page.locator('tbody tr').filter({ hasText: 'SS-' }).first();
    await expect(recentRow).toBeVisible();
    await recentRow.getByRole('link').click();
    await expect(page).toHaveURL(/\/admin\/orders\?keyword=SS-/);
    await expect(page.getByRole('heading', { level: 1, name: 'Orders', exact: true })).toBeVisible();
    await expect(page.getByText(/matching the current view/)).toBeVisible();

    await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard', exact: true })).toBeVisible();
  });

  test('admin can create, edit, restock and delete a product', async ({ page }) => {
    const productName = `QA Test Product ${Date.now()}`;

    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Products', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Products', exact: true })).toBeVisible();
    await expect(page.getByLabel('Filter by category').locator('option', { hasText: 'Electronics' })).toHaveCount(1);

    await page.getByRole('button', { name: 'Add product' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Add a product' })).toBeVisible();

    await dialog.getByLabel('Product name').fill(productName);
    await dialog.getByLabel('Short description').fill('A product created by the automated QA suite.');
    await dialog.getByLabel('Full description').fill('This product verifies that administrators can create, edit, restock and delete catalogue entries.');
    await dialog.locator('select').selectOption({ label: 'Electronics' });
    await dialog.getByLabel('Brand').fill('QA Labs');
    await dialog.getByLabel('Regular price (₹)').fill('1500');
    await dialog.getByLabel(/Discount price/).fill('1200');
    await dialog.getByLabel('Stock quantity').fill('7');
    await dialog.getByLabel('Highlights').fill('Created by QA\nExercises the full admin product flow');
    await dialog.getByLabel('Image URLs').fill('/uploads/seed/p01-1.jpg');

    await dialog.getByRole('button', { name: 'Create product' }).click();
    await expect(page.getByText('Product created')).toBeVisible();

    const search = page.getByPlaceholder('Search by product name, brand or description…');
    await search.fill(productName);
    await page.getByRole('button', { name: 'Search', exact: true }).click();

    const row = page.locator('tr').filter({ hasText: productName });
    await expect(row).toBeVisible();
    await expect(row.getByText('In stock', { exact: true })).toBeVisible();
    await expect(row.getByText('QA Labs', { exact: false })).toBeVisible();

    // Edit the product.
    await row.getByRole('button', { name: `Edit ${productName}` }).click();
    const editDialog = page.getByRole('dialog');
    await expect(editDialog.getByRole('heading', { name: 'Edit product' })).toBeVisible();
    await editDialog.getByLabel('Stock quantity').fill('9');
    await editDialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Product updated')).toBeVisible();

    // Restock through the dedicated stock dialog.
    const updatedRow = page.locator('tr').filter({ hasText: productName });
    await updatedRow.getByTitle('Set stock').click();
    const stockDialog = page.getByRole('dialog');
    await expect(stockDialog.getByRole('heading', { name: 'Update stock' })).toBeVisible();
    await stockDialog.getByLabel('Available units').fill('3');
    await stockDialog.getByRole('button', { name: 'Save stock' }).click();
    await expect(page.getByText('Stock updated')).toBeVisible();
    await expect(updatedRow.getByText('Low stock', { exact: true })).toBeVisible();

    // Delete the product and confirm the filtered list is empty.
    await updatedRow.getByRole('button', { name: `Delete ${productName}` }).click();
    const deleteDialog = page.getByRole('dialog');
    await expect(deleteDialog.getByRole('heading', { name: 'Delete this product?' })).toBeVisible();
    await deleteDialog.getByRole('button', { name: 'Delete product' }).click();
    await expect(page.getByText('Product deleted')).toBeVisible();
    await expect(page.getByText('No products match those filters')).toBeVisible();
  });

  test('admin can create and delete an empty category but not one with products', async ({ page }) => {
    const categoryName = `QA Category ${Date.now()}`;

    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Categories', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Categories', exact: true })).toBeVisible();

    // Seeded categories that contain products are protected from deletion.
    await expect(page.getByRole('button', { name: 'Delete Electronics' })).toBeDisabled();

    await page.getByRole('button', { name: 'Add category' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Add a category' })).toBeVisible();
    await dialog.getByLabel('Category name').fill(categoryName);
    await dialog.getByLabel('Description').fill('A temporary category created by the automated QA suite.');
    await dialog.getByRole('button', { name: 'Create category' }).click();
    await expect(page.getByText('Category created')).toBeVisible();

    const search = page.getByPlaceholder('Search categories by name or description…');
    await search.fill(categoryName);
    const card = page.locator('article').filter({ hasText: categoryName });
    await expect(card).toBeVisible();
    await expect(card.getByText('0 products')).toBeVisible();

    await card.getByRole('button', { name: `Delete ${categoryName}` }).click();
    const deleteDialog = page.getByRole('dialog');
    await expect(deleteDialog.getByRole('heading', { name: 'Delete this category?' })).toBeVisible();
    await deleteDialog.getByRole('button', { name: 'Delete category' }).click();
    await expect(page.getByText('Category deleted')).toBeVisible();
    await expect(page.getByText('No categories match that search')).toBeVisible();
  });

  test('admin can inspect an order and advance then cancel its fulfilment', async ({ page, request }) => {
    const order = await createCustomerOrder(request);

    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Orders', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Orders', exact: true })).toBeVisible();

    await page.getByPlaceholder('Search by order number or customer name…').fill(order.orderNumber);
    await page.getByRole('button', { name: 'Search', exact: true }).click();

    const row = page.locator('tr').filter({ hasText: order.orderNumber });
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: /View/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: `Order ${order.orderNumber}` })).toBeVisible();
    for (const heading of ['Items', 'Shipping address', 'Payment summary', 'Status timeline', 'Update fulfilment status']) {
      await expect(dialog.getByRole('heading', { name: heading })).toBeVisible();
    }
    await expect(dialog.getByText('Cash on delivery')).toBeVisible();

    await dialog.getByRole('button', { name: 'Mark as Processing' }).click();
    await dialog.getByLabel(/Note/).fill('Confirmed by the automated QA suite');
    await dialog.getByRole('button', { name: 'Confirm Processing' }).click();
    await expect(page.getByText('Order marked as Processing')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Mark as Shipped' })).toBeVisible();

    await dialog.getByRole('button', { name: 'Cancel order' }).click();
    await dialog.getByRole('button', { name: 'Confirm Cancelled' }).click();
    await expect(page.getByText('Order marked as Cancelled')).toBeVisible();
    await expect(dialog.getByText('This order is cancelled and cannot move to another status.')).toBeVisible();

    await dialog.getByRole('button', { name: 'Close', exact: true }).last().click();
    await page.getByLabel('Filter by order status').selectOption('Cancelled');
    await expect(page).toHaveURL(/status=Cancelled/);
    await expect(page.locator('tr').filter({ hasText: order.orderNumber })).toBeVisible();
  });

  test('admin can manage account roles and block or unblock a customer', async ({ page, request }) => {
    const email = `qa.role.${Date.now()}@shopsphere.test`;
    const password = 'Test@12345';

    let account = await request.post('/api/auth/register', {
      data: { name: 'QA Role User', email, password, phone: '9000011111' },
    });
    if (!account.ok()) {
      account = await request.post('/api/auth/login', { data: { email, password } });
    }
    expect(account.ok(), 'Could not prepare the QA role account').toBeTruthy();

    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Customers', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Customers', exact: true })).toBeVisible();

    await page.getByPlaceholder('Search by name or email…').fill(email);
    await page.getByRole('button', { name: 'Search', exact: true }).click();

    const row = page.locator('tr').filter({ hasText: email });
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: /View/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'QA Role User' })).toBeVisible();
    for (const heading of ['Contact', 'Saved address', 'Recent orders', 'Access management']) {
      await expect(dialog.getByRole('heading', { name: heading })).toBeVisible();
    }

    // Promote and demote the account.
    await dialog.getByLabel('Account role').selectOption('admin');
    await dialog.getByRole('button', { name: 'Update role' }).click();
    await expect(page.getByText('Role updated to admin')).toBeVisible();
    await expect(dialog.getByText('Administrator', { exact: true }).first()).toBeVisible();

    await dialog.getByLabel('Account role').selectOption('customer');
    await dialog.getByRole('button', { name: 'Update role' }).click();
    await expect(page.getByText('Role updated to customer')).toBeVisible();

    // Block the account, then unblock it again.
    await dialog.getByRole('button', { name: 'Block account' }).click();
    const blockDialog = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'Block this account?' }) });
    await expect(blockDialog).toBeVisible();
    await blockDialog.getByRole('button', { name: 'Block account' }).click();
    await expect(page.getByText('User blocked')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Unblock account' })).toBeVisible();

    await dialog.getByRole('button', { name: 'Unblock account' }).click();
    const unblockDialog = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'Unblock this account?' }) });
    await expect(unblockDialog).toBeVisible();
    await unblockDialog.getByRole('button', { name: 'Unblock account' }).click();
    await expect(page.getByText('User unblocked')).toBeVisible();

    // Self-protection: administrators cannot block themselves or change their own role.
    await dialog.getByRole('button', { name: 'Close', exact: true }).last().click();
    await page.getByPlaceholder('Search by name or email…').fill('admin@shopsphere.com');
    await page.getByRole('button', { name: 'Search', exact: true }).click();

    const selfRow = page.locator('tr').filter({ hasText: 'admin@shopsphere.com' });
    await expect(selfRow).toBeVisible();
    await selfRow.getByRole('button', { name: /View/ }).click();

    const selfDialog = page.getByRole('dialog');
    await expect(selfDialog.getByRole('heading', { name: 'Store Administrator' })).toBeVisible();
    await expect(
      selfDialog.getByText('You cannot block your own account or change your own role. Ask another administrator to make changes.')
    ).toBeVisible();
    await expect(selfDialog.getByRole('button', { name: /Block account|Unblock account/ })).toHaveCount(0);
  });
});
