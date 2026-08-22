-- Create Sequence for atomic Challan Number generation
CREATE SEQUENCE IF NOT EXISTS challan_number_seq START WITH 1 INCREMENT BY 1;

-- Synchronize sequence with highest existing challan number if any
DO $$
DECLARE
  max_num BIGINT;
BEGIN
  SELECT MAX(NULLIF(regexp_replace(challan_number, '\D', '', 'g'), '')::bigint)
  INTO max_num
  FROM challans;

  IF max_num IS NOT NULL THEN
    PERFORM setval('challan_number_seq', max_num + 1, false);
  END IF;
END $$;

-- Drop old single-column indexes where replaced by composite indexes
DROP INDEX IF EXISTS "customers_status_idx";
DROP INDEX IF EXISTS "stock_movements_productId_idx";
DROP INDEX IF EXISTS "stock_movements_type_idx";
DROP INDEX IF EXISTS "challans_customerId_idx";
DROP INDEX IF EXISTS "challans_status_idx";
DROP INDEX IF EXISTS "products_category_idx";

-- Create new enterprise composite indexes
CREATE INDEX "customers_status_createdAt_idx" ON "customers"("status", "createdAt");
CREATE INDEX "customers_businessName_idx" ON "customers"("businessName");
CREATE INDEX "customers_customerName_idx" ON "customers"("customerName");

CREATE INDEX "products_name_idx" ON "products"("name");
CREATE INDEX "products_category_currentStock_idx" ON "products"("category", "currentStock");

CREATE INDEX "stock_movements_productId_createdAt_idx" ON "stock_movements"("productId", "createdAt");
CREATE INDEX "stock_movements_type_createdAt_idx" ON "stock_movements"("type", "createdAt");
CREATE INDEX "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");

CREATE INDEX "challans_customerId_status_idx" ON "challans"("customerId", "status");
CREATE INDEX "challans_status_createdAt_idx" ON "challans"("status", "createdAt");
CREATE INDEX "challans_createdAt_idx" ON "challans"("createdAt");

