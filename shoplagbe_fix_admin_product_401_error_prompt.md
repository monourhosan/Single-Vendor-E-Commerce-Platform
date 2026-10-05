# Google Antigravity IDE Prompt

# Fix Next.js Admin Product Creation 401 Unauthorized Error

## Role

You are a senior full-stack debugging engineer.

You are working on the existing ShopLagbe e-commerce project.

A recent Admin Product Management implementation introduced an
authentication issue.

Your task is to diagnose and fix the problem completely.

Do not hide the error. Do not bypass authentication. Do not remove
authorization checks.

Fix the root cause.

------------------------------------------------------------------------

# Current Error

Frontend error:

    AxiosError: Request failed with status code 401

Location:

    frontend/services/product.ts

    createProduct()

    line around:

    await apiClient.post('/admin/products', data)

The frontend is successfully sending the request, but Laravel API
rejects it as unauthorized.

------------------------------------------------------------------------

# Objective

Fix the complete authentication flow between:

Next.js Admin Dashboard

↓

Axios API Client

↓

Laravel 13 API

↓

Sanctum Authentication Middleware

↓

Admin Product Controller

After fixing:

Admin should be able to:

-   Create product
-   Update product
-   Delete product
-   Manage inventory

without receiving 401 errors.

------------------------------------------------------------------------

# Debugging Requirements

Before changing code:

Analyze:

1.  Next.js authentication implementation
2.  Axios client configuration
3.  Stored authentication token
4.  Laravel Sanctum configuration
5.  API middleware
6.  Admin routes
7.  Login response
8.  User role validation

Do not guess.

Trace the complete request lifecycle.

------------------------------------------------------------------------

# Frontend Investigation

Check:

    frontend/services/api.ts

Verify:

-   Axios base URL
-   Authorization header injection
-   Token storage
-   Cookie handling
-   Request interceptors

Expected behavior:

Every admin API request should include:

    Authorization: Bearer {token}

Example:

    POST /api/admin/products

    Headers:

    Authorization: Bearer eyJ...
    Content-Type: multipart/form-data

------------------------------------------------------------------------

# Fix Axios Client

Ensure Axios interceptor exists.

Example logic:

Before request:

1.  Read authentication token.
2.  Attach Bearer token.
3.  Send request.

Do not hardcode tokens.

Use existing auth system.

------------------------------------------------------------------------

# Check Login Flow

Inspect:

    frontend/services/auth*
    frontend/hooks/useAuth*
    frontend/context/*

Verify:

After admin login:

-   Token is returned from Laravel.
-   Token is stored correctly.
-   User data is stored.
-   Admin session survives page refresh.

If missing:

Implement proper token persistence.

------------------------------------------------------------------------

# Laravel Backend Investigation

Check:

    routes/api.php

Find:

    admin/products

Verify middleware.

Expected:

    auth:sanctum

Example:

``` php
Route::middleware([
    'auth:sanctum',
    'admin'
])
->prefix('admin')
->group(function(){

    Route::post('/products', ...);

});
```

------------------------------------------------------------------------

# Sanctum Configuration

Verify:

    config/sanctum.php

Check:

-   token authentication
-   guards
-   stateful domains if using cookies

------------------------------------------------------------------------

# Admin Middleware

Check:

    app/Http/Middleware/

Verify admin middleware:

-   correctly checks authenticated user
-   does not reject valid admins
-   returns proper response

Expected:

Admin user:

    role = admin

can access:

    /api/admin/*

------------------------------------------------------------------------

# Product Upload Issue Check

The request uses:

    FormData

because products contain images.

Verify:

Frontend:

``` typescript
apiClient.post(
 '/admin/products',
 formData,
 {
 headers:{
  'Content-Type':'multipart/form-data'
 }
 }
)
```

Backend:

Verify:

    StoreProductRequest.php

accepts:

-   multipart data
-   image upload
-   fields correctly

Important:

Do not manually overwrite the multipart boundary header incorrectly.

Axios should manage it.

------------------------------------------------------------------------

# API Response Handling

Improve error handling.

Axios should capture:

401:

    Unauthorized - login required

403:

    Admin permission required

422:

    Validation error

500:

    Server error

Display meaningful messages.

------------------------------------------------------------------------

# Test Complete Flow

After fixing:

## Test 1

Login as admin.

Example:

    admin@shoplagbe.com

Confirm token generated.

## Test 2

Open:

    /admin/products/create

## Test 3

Submit:

-   Name
-   SKU
-   Price
-   Stock
-   Image

## Test 4

Confirm:

Request:

    POST /api/admin/products

Response:

    201 Created

Product appears in:

    /admin/products

------------------------------------------------------------------------

# Required Code Quality

Do not:

-   disable middleware
-   make routes public
-   remove Sanctum
-   hardcode tokens
-   skip authorization

Implement:

-   secure authentication
-   proper token handling
-   clean Axios architecture
-   Laravel-standard authorization

------------------------------------------------------------------------

# Final Deliverables

After completion:

1.  Fixed Next.js authentication request flow
2.  Fixed Laravel Sanctum authentication
3.  Working admin product creation
4.  Working image upload
5.  Working product CRUD authorization
6.  Improved API error handling

# Final Instruction

Implement the fix directly inside the existing ShopLagbe project.

Do not provide only an explanation.

Find the root cause, modify the required files, and make the Admin
Product creation flow fully functional.
