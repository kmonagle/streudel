-- Drop all food-related tables
-- Run this to permanently remove recipe/shopping functionality from the database

BEGIN;

-- Drop tables in order (dependent tables first)
DROP TABLE IF EXISTS recipe_queue CASCADE;
DROP TABLE IF EXISTS shopping_lists CASCADE;
DROP TABLE IF EXISTS ingredient_categories CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;

-- Verify tables are gone
DO $$
BEGIN
    RAISE NOTICE 'Food-related tables have been dropped';
END $$;

COMMIT;
