# Google Antigravity IDE Prompt

# Implement Complete Admin Product & Inventory Management System

## Role

You are a senior full-stack engineer working on the existing ShopLagbe
e-commerce project.

Implement a complete production-ready Admin Product and Inventory
Management module.

Do not create a new project.

Modify the existing application.

------------------------------------------------------------------------

# Objective

Inside:

    /admin/products

the admin must be able to:

-   Add new products
-   Edit products
-   Delete products
-   Add inventory
-   Remove inventory
-   Adjust stock
-   View inventory history
-   Search products
-   Filter products
-   Manage product status

------------------------------------------------------------------------

# Existing Stack

Frontend:

-   Next.js 15
-   TypeScript
-   App Router
-   Tailwind CSS
-   shadcn/ui
-   TanStack Query

Backend:

-   Laravel 13
-   PHP 8.4
-   PostgreSQL
-   Redis
-   Laravel Sanctum

------------------------------------------------------------------------

# Frontend Structure

Implement:

    frontend/app/admin/products/

    page.tsx

    create/page.tsx

    [id]/edit/page.tsx

    [id]/inventory/page.tsx

Components:

    components/admin/products/

    ProductTable.tsx
    ProductForm.tsx
    DeleteProductDialog.tsx
    InventoryModal.tsx
    InventoryHistoryTable.tsx
    StockBadge.tsx

------------------------------------------------------------------------

# Product Management

Admin Product Table must show:

-   Image
-   Name
-   SKU
-   Price
-   Stock
-   Status
-   Created date
-   Actions

Actions:

-   Edit
-   Delete
-   Inventory Management

------------------------------------------------------------------------

# Create Product

Route:

    /admin/products/create

Fields:

-   Name
-   SKU
-   Description
-   Price
-   Stock quantity
-   Status
-   Image

Validation:

Frontend:

-   React Hook Form
-   Zod

Backend:

Laravel Form Request.

Rules:

-   SKU unique
-   Price greater than zero
-   Stock cannot be negative

------------------------------------------------------------------------

# Edit Product

Admin can update:

-   Name
-   Description
-   Price
-   Image
-   Status

Protect SKU uniqueness.

------------------------------------------------------------------------

# Delete Product

Use safe deletion.

Implement Laravel:

    SoftDeletes

Before deletion consider:

-   Existing orders
-   Inventory history

------------------------------------------------------------------------

# Inventory Management

Route:

    /admin/products/{id}/inventory

Features:

-   Add stock
-   Remove stock
-   Adjust stock
-   Inventory history

------------------------------------------------------------------------

# Inventory Adjustment

Create modal:

Fields:

    Action:
    ADD / REMOVE

    Quantity

    Reason

Examples:

ADD:

-   Supplier shipment
-   New stock

REMOVE:

-   Damaged product
-   Manual correction

------------------------------------------------------------------------

# Inventory Rules

Never allow:

    stock_quantity < 0

Every inventory change must create an inventory log.

Store:

-   product_id
-   previous quantity
-   change quantity
-   new quantity
-   type
-   reason
-   admin id
-   timestamp

------------------------------------------------------------------------

# Laravel Backend Architecture

Follow Laravel conventions.

Controllers:

    app/Http/Controllers/Api/Admin/

Create:

    ProductController.php
    InventoryController.php

Methods:

    index()
    store()
    show()
    update()
    destroy()

    addInventory()
    removeInventory()
    history()

------------------------------------------------------------------------

# Form Requests

Create:

    app/Http/Requests/Admin/

Files:

    StoreProductRequest.php
    UpdateProductRequest.php
    InventoryAdjustmentRequest.php

------------------------------------------------------------------------

# Services

Business logic must not be inside controllers.

Create:

    app/Services/

    ProductService.php

    InventoryService.php

InventoryService handles:

-   stock increase
-   stock decrease
-   validation
-   inventory logs
-   transactions

------------------------------------------------------------------------

# Database Safety

Inventory updates must use:

    DB::transaction()

Flow:

    Lock product row

    Update stock

    Create inventory log

    Commit

Prevent:

-   race conditions
-   negative stock

------------------------------------------------------------------------

# API Endpoints

Products:

    GET /api/admin/products

    POST /api/admin/products

    PUT /api/admin/products/{id}

    DELETE /api/admin/products/{id}

Inventory:

    POST /api/admin/products/{id}/inventory/add

    POST /api/admin/products/{id}/inventory/remove

    GET /api/admin/products/{id}/inventory/history

Protect:

    auth:sanctum
    admin middleware

------------------------------------------------------------------------

# TanStack Query

Create hooks:

    hooks/admin/

    useProducts.ts
    useCreateProduct.ts
    useUpdateProduct.ts
    useDeleteProduct.ts
    useInventory.ts

Implement:

-   API calls
-   caching
-   invalidation
-   loading states
-   error handling

------------------------------------------------------------------------

# Image Upload

Implement:

Laravel storage:

    storage/app/public/products

Support:

-   upload
-   preview
-   replace image

------------------------------------------------------------------------

# UI Requirements

Use:

-   shadcn/ui
-   Tailwind CSS

Include:

-   Data tables
-   Pagination
-   Search
-   Filters
-   Dialog confirmations
-   Toast notifications
-   Loading skeletons
-   Empty states

------------------------------------------------------------------------

# Authorization

Only admin users can manage products.

Use:

-   Sanctum
-   Middleware
-   Policies

------------------------------------------------------------------------

# Testing

Backend tests:

-   Create product
-   Update product
-   Delete product
-   Add inventory
-   Remove inventory
-   Prevent negative stock
-   Inventory log creation

Frontend tests:

-   Product form
-   Inventory modal
-   Delete confirmation

------------------------------------------------------------------------

# Final Requirement

Implement directly inside ShopLagbe.

Do not create a tutorial.

Do not create mock functionality.

Do not leave placeholders.

Deliver a complete working Admin Product and Inventory Management
system.
