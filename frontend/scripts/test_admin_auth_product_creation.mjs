// test_admin_auth_product_creation.mjs
// End-to-end verification of Admin Authentication and Product Creation flow
import assert from 'assert';

const API_BASE = process.env.API_BASE_URL || 'http://127.0.0.1:8000/api';

console.log(`\n============================================================`);
console.log(`  ShopLagbe - Admin Product Creation & Auth Verification`);
console.log(`  Target Backend: ${API_BASE}`);
console.log(`============================================================\n`);

async function runVerification() {
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    return async () => {
      try {
        await fn();
        console.log(`  [PASS] ${name}`);
        passed++;
      } catch (err) {
        console.error(`  [FAIL] ${name}: ${err.message}`);
        failed++;
      }
    };
  }

  // 1. Verify unauthenticated request to /admin/products is rejected with 401
  await test('Rejection of unauthenticated product creation request with 401', async () => {
    const res = await fetch(`${API_BASE}/admin/products`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Unauthorized Product', price: 100 }),
    });

    assert.strictEqual(res.status, 401, `Expected status 401 but got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, false, 'Expected success to be false');
  })();

  // 2. Verify invalid / mock token is rejected with 401
  await test('Rejection of mock/fake token with 401 Unauthorized', async () => {
    const res = await fetch(`${API_BASE}/admin/products`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer mock_admin_token_999999999',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Mock Token Product', price: 100 }),
    });

    assert.strictEqual(res.status, 401, `Expected status 401 but got ${res.status}`);
  })();

  // 3. Admin Login generating real Sanctum token
  let adminToken = '';
  await test('Admin login (admin@shoplagbe.com) generates valid Sanctum token', async () => {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@shoplagbe.com',
        password: 'admin123456',
      }),
    });

    assert.strictEqual(res.status, 200, `Expected status 200 but got ${res.status}`);
    const body = await res.json();
    assert.strictEqual(body.success, true, 'Expected success to be true');
    assert.ok(body.token, 'Expected token to be returned');
    assert.strictEqual(body.user?.role, 'admin', 'Expected role to be admin');
    adminToken = body.token;
  })();

  // 4. Product Creation via Multipart FormData with Bearer token
  let createdProductId = null;
  const testSku = `TEST-PROD-${Date.now()}`;
  await test('Admin creates product via FormData with Bearer token (201 Created)', async () => {
    const formData = new FormData();
    formData.append('name', 'Sony Alpha 7 IV Full-Frame Camera');
    formData.append('sku', testSku);
    formData.append('description', '33MP full-frame Exmor R back-illuminated CMOS sensor with 4K 60p recording.');
    formData.append('price', '265000.00');
    formData.append('stock_quantity', '12');
    formData.append('status', 'active');

    // Create a 1x1 transparent PNG blob for image upload test
    const dummyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const binaryData = Buffer.from(dummyPngBase64, 'base64');
    const imageBlob = new Blob([binaryData], { type: 'image/png' });
    formData.append('image_file', imageBlob, 'sony_a7iv.png');

    const res = await fetch(`${API_BASE}/admin/products`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        // Note: Do NOT pass manual Content-Type header so fetch/boundary works automatically
      },
      body: formData,
    });

    const body = await res.json();
    assert.strictEqual(res.status, 201, `Expected status 201 but got ${res.status}. Body: ${JSON.stringify(body)}`);
    assert.strictEqual(body.success, true, 'Expected success: true');
    assert.ok(body.data?.id, 'Expected product id to be returned');
    assert.strictEqual(body.data?.sku, testSku, 'Expected matching SKU');
    assert.strictEqual(Number(body.data?.price), 265000, 'Expected matching price');
    assert.strictEqual(body.data?.stock_quantity, 12, 'Expected matching stock');
    createdProductId = body.data.id;
  })();

  // 5. Verification product appears in admin product catalog
  await test('Created product appears in GET /api/admin/products list', async () => {
    const res = await fetch(`${API_BASE}/admin/products?search=${encodeURIComponent(testSku)}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    assert.strictEqual(res.status, 200, `Expected status 200 but got ${res.status}`);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    const found = body.data.find((p) => p.sku === testSku);
    assert.ok(found, `Expected product with SKU ${testSku} in listing`);
  })();

  // 6. Update Product
  await test('Admin updates product pricing and stock (PUT /api/admin/products/:id)', async () => {
    assert.ok(createdProductId, 'Product ID must be defined');

    const res = await fetch(`${API_BASE}/admin/products/${createdProductId}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Sony Alpha 7 IV Full-Frame Camera (Updated Edition)',
        sku: testSku,
        price: 275000.00,
        stock_quantity: 15,
        status: 'active',
      }),
    });

    assert.strictEqual(res.status, 200, `Expected status 200 but got ${res.status}`);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(Number(body.data?.price), 275000);
  })();

  // 7. Inventory adjustment
  await test('Admin adds stock via inventory management endpoint', async () => {
    assert.ok(createdProductId, 'Product ID must be defined');

    const res = await fetch(`${API_BASE}/admin/products/${createdProductId}/inventory/add`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quantity: 5,
        reason: 'Restocking shipment arrived',
      }),
    });

    assert.strictEqual(res.status, 200, `Expected status 200 but got ${res.status}`);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data?.stock_quantity, 20); // 15 + 5 = 20
  })();

  // 8. Safe delete product
  await test('Admin deletes product (DELETE /api/admin/products/:id)', async () => {
    assert.ok(createdProductId, 'Product ID must be defined');

    const res = await fetch(`${API_BASE}/admin/products/${createdProductId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    assert.strictEqual(res.status, 200, `Expected status 200 but got ${res.status}`);
    const body = await res.json();
    assert.strictEqual(body.success, true);
  })();

  // 9. Session termination (Logout)
  await test('Admin logout invalidates Sanctum session', async () => {
    const res = await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    assert.strictEqual(res.status, 200, `Expected status 200 but got ${res.status}`);
  })();

  console.log(`\n============================================================`);
  console.log(`  VERIFICATION SUMMARY:`);
  console.log(`  Total Checks: ${passed + failed}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification();
