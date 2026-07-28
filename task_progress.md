# BOM (Bill of Materials) Integration - Menu Management + Stock Management

## Completed Implementation:

### 1. Database (Prisma Schema)
- [x] Added `InventoryItem` model (name, sku, category, unit, currentStock, minThreshold)
- [x] Added `RecipeItem` model (inventoryId, productId, quantityNeeded) with unique composite constraint
- [x] Added `UnitOfMeasure` enum (GRAM, KILOGRAM, MILLILITER, LITER, PIECE, PACK, BOX, BOTTLE, CUP, BAG)
- [x] Added `recipeItems` relation to `Product` model
- [x] Migrated database and seeded 15 inventory items

### 2. Backend API
- [x] **`GET /api/products`** - Returns products with full `recipeItems` array including inventory details
- [x] **`POST /api/products`** - Accepts `ingredients: [{ inventoryId, quantityNeeded }]` payload, validates all stock_ids exist
- [x] **`PUT /api/products`** - Accepts `ingredients` array, deletes old recipe items and creates new ones
- [x] **`GET /api/inventory/list`** - Lightweight endpoint for dropdown options (returns id, name, sku, unit, currentStock)
- [x] **`PATCH /api/inventory`** - Restock endpoint with precise stock calculation
- [x] **`DELETE /api/inventory`** - Blocked if item is linked to active recipe (Menu Management protection)

### 3. Frontend - Menu Management (Products Page)
- [x] **Recipe / Ingredients Section** in Add/Edit modal
- [x] **"Add Ingredient" button** to dynamically add ingredient rows
- [x] **Searchable dropdown** for each ingredient - fetches inventory items from `/api/inventory/list`
- [x] **Real-time search filter** inside dropdown to quickly find inventory items
- [x] **Auto unit label** - displays base unit (g, ml, pcs, etc.) based on selected inventory item
- [x] **Quantity input** for takaran (amount needed per recipe)
- [x] **Delete button** per ingredient row (cross icon)
- [x] **Frontend validation** - prevents save if ingredient not selected or quantity <= 0
- [x] **Edit mode** loads existing recipe items perfectly from API response
- [x] **Product table** shows ingredient count badge (e.g., "3 bahan baku") when recipe exists
- [x] **Excludes already-selected** inventory items from other dropdown options

### 4. Frontend - Stock Management (Inventory Page)
- [x] Full CRUD table with search, restock, add/edit/delete modals
- [x] Low Stock / In Stock status badges based on minThreshold comparison
- [x] Kebab menu with Restock, Edit Item, Delete options
- [x] Restock modal with current stock display, quantity input, and live total preview

### 5. Navigation
- [x] Added "Stock Management" to Sidebar with box icon

### Build Verification
- [x] TypeScript compilation passes
- [x] All routes registered correctly
- [x] Seed data runs without errors