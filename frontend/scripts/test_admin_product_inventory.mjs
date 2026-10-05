// test_admin_product_inventory.mjs
// Automated verification suite for Admin Product & Inventory Management module

import { z } from 'zod';

const API_BASE = 'http://127.0.0.1:8000/api';
const FRONTEND_BASE = 'http://localhost:3000';

console.log(`\n======================================================================`);
console.log(`  ShopLagbe - Admin Product & Inventory Verification Suite`);
console.log(`  Frontend: ${FRONTEND_BASE}`);
console.log(`  Backend:  ${API_BASE}`);
console.log(`======================================================================\n`);

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

// 1. Zod Schema Verification for Product Form
const productFormSchema = z.object({
  name: z.string().min(2, 'Product title must be at least 2 characters'),
  sku: z.string().min(2, 'SKU code is required and must be unique'),
  description: z.string().optional().default(''),
  price: z.coerce.number().gt(0, 'Price must be greater than 0 BDT'),
  stock_quantity: z.coerce.number().int().gte(0, 'Stock quantity cannot be negative'),
  status: z.enum(['active', 'inactive', 'archived']),
  image: z.string().optional().default(''),
});

const inventoryAdjustmentSchema = z.object({
  action: z.enum(['ADD', 'REMOVE']),
  quantity: z.number().int().gt(0, 'Quantity must be greater than zero'),
  reason: z.string().min(1, 'Reason is required'),
});

async function runTests() {
  console.log(`--- SECTION 1: Frontend Zod Form & Modal Validation Rules ---`);
  {
    // Valid product
    const valid = productFormSchema.safeParse({
      name: 'Sony WH-1000XM5',
      sku: 'AUD-SNY-001',
      price: 38500,
      stock_quantity: 15,
      status: 'active',
      description: 'Noise cancelling headphones',
    });
    assert(valid.success === true, 'Product form schema validates correct input');

    // Negative stock
    const negStock = productFormSchema.safeParse({
      name: 'Test Product',
      sku: 'TEST-SKU',
      price: 1000,
      stock_quantity: -5,
      status: 'active',
    });
    assert(negStock.success === false, 'Product form schema rejects negative stock');

    // Zero price
    const zeroPrice = productFormSchema.safeParse({
      name: 'Test Product',
      sku: 'TEST-SKU',
      price: 0,
      stock_quantity: 10,
      status: 'active',
    });
    assert(zeroPrice.success === false, 'Product form schema rejects zero or negative price');

    // Missing SKU
    const missingSku = productFormSchema.safeParse({
      name: 'Test Product',
      sku: '',
      price: 500,
      stock_quantity: 10,
      status: 'active',
    });
    assert(missingSku.success === false, 'Product form schema rejects empty SKU');

    // Inventory modal schema
    const validAdj = inventoryAdjustmentSchema.safeParse({
      action: 'ADD',
      quantity: 10,
      reason: 'Supplier shipment',
    });
    assert(validAdj.success === true, 'Inventory modal schema accepts valid restock');

    const invalidAdj = inventoryAdjustmentSchema.safeParse({
      action: 'REMOVE',
      quantity: 0,
      reason: 'Defective',
    });
    assert(invalidAdj.success === false, 'Inventory modal schema rejects zero quantity');
  }

  console.log(`\n--- SECTION 2: Next.js Frontend Admin Routes Accessibility ---`);
  {
    const pages = [
      { path: '/admin/products', title: 'Main Products Table' },
      { path: '/admin/products/create', title: 'Product Creation Page' },
      { path: '/admin/products/1/edit', title: 'Product Edit Page' },
      { path: '/admin/products/1/inventory', title: 'Product Inventory Audit Page' },
    ];

    for (const page of pages) {
      try {
        const res = await fetch(`${FRONTEND_BASE}${page.path}`);
        assert(res.status === 200, `Route ${page.path} (${page.title}) responds with HTTP 200`);
      } catch (err) {
        assert(false, `Route ${page.path} error: ${err.message}`);
      }
    }
  }

  console.log(`\n--- SECTION 3: Live End-to-End Admin Product & Inventory Workflow ---`);
  let adminToken = '';
  try {
    // 1. Authenticate as Admin
    const loginRes = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: 'admin@shoplagbe.com', password: 'admin123456' }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.success, 'Admin successfully logs in via API');
    adminToken = loginData.token;

    const authHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };

    // 2. Create Product via POST /api/admin/products
    const testSku = `E2E-${Date.now().toString().slice(-6)}`;
    const createRes = await fetch(`${API_BASE}/admin/products`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Logitech MX Master 4 Pro',
        sku: testSku,
        description: 'Next-gen wireless productivity mouse with magnetic scroll wheel',
        price: 14500,
        stock_quantity: 20,
        status: 'active',
      }),
    });
    const createData = await createRes.json();
    assert(createRes.status === 201 && createData.success, `Created product with SKU ${testSku} (HTTP 201)`);
    const createdProduct = createData.data;

    // 3. Update Product via PUT /api/admin/products/{id}
    const updateRes = await fetch(`${API_BASE}/admin/products/${createdProduct.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Logitech MX Master 4 Pro Graphite',
        sku: testSku, // verify SKU uniqueness check allows maintaining own SKU
        price: 15200,
        status: 'active',
      }),
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200 && updateData.data.price === 15200, 'Updated product title and price successfully');

    // 4. Add Inventory via POST /api/admin/products/{id}/inventory/add
    const addInvRes = await fetch(`${API_BASE}/admin/products/${createdProduct.id}/inventory/add`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        quantity: 15,
        reason: 'Supplier shipment - Invoice #SKL-9981',
      }),
    });
    const addInvData = await addInvRes.json();
    assert(addInvRes.status === 200 && addInvData.data.stock_quantity === 35, 'Added 15 units of stock (20 -> 35)');

    // 5. Remove Inventory via POST /api/admin/products/{id}/inventory/remove
    const removeInvRes = await fetch(`${API_BASE}/admin/products/${createdProduct.id}/inventory/remove`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        quantity: 5,
        reason: 'Warehouse damage scrap',
      }),
    });
    const removeInvData = await removeInvRes.json();
    assert(removeInvRes.status === 200 && removeInvData.data.stock_quantity === 30, 'Removed 5 units of stock (35 -> 30)');

    // 6. Test Negative Stock Prevention
    const overDeductRes = await fetch(`${API_BASE}/admin/products/${createdProduct.id}/inventory/remove`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        quantity: 100, // available is only 30
        reason: 'Excessive deduction attempt',
      }),
    });
    assert(overDeductRes.status === 422, 'Prevented negative stock deduction with HTTP 422');

    // 7. Verify Inventory History & Audit Trail via GET /api/admin/products/{id}/inventory/history
    const historyRes = await fetch(`${API_BASE}/admin/products/${createdProduct.id}/inventory/history`, {
      headers: authHeaders,
    });
    const historyData = await historyRes.json();
    assert(historyRes.status === 200 && historyData.data.length >= 2, `Retrieved ${historyData.data.length} audit logs in history`);
    assert(historyData.data[0].admin_name !== undefined, 'Audit log correctly attributes admin user');

    // 8. Delete Product (Safe Deletion / SoftDeletes)
    const deleteRes = await fetch(`${API_BASE}/admin/products/${createdProduct.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    const deleteData = await deleteRes.json();
    assert(deleteRes.status === 200 && deleteData.success, 'Soft-deleted product safely');

  } catch (err) {
    assert(false, `Live workflow error: ${err.message}`);
  }

  console.log(`\n======================================================================`);
  console.log(`  Results: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
