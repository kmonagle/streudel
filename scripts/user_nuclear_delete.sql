-- Nuclear Delete: Remove ALL data for a specific user
-- For OAuth provider IDs stored as TEXT (like Google OAuth IDs)

BEGIN;

-- Set the user ID to delete (as TEXT)
DO $$
DECLARE
    target_user_id TEXT := '117277055482599253864';  -- OAuth ID as TEXT
    rows_affected INTEGER;
BEGIN

    -- 1. Delete habit completions (references habits, tasks, and users)
    DELETE FROM habit_completions WHERE user_id = target_user_id;
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RAISE NOTICE 'Deleted % habit_completions', rows_affected;

    -- 2. Delete tasks (references goals)
    DELETE FROM tasks WHERE user_id = target_user_id;
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RAISE NOTICE 'Deleted % tasks', rows_affected;

    -- 3. Delete goals
    DELETE FROM goals WHERE user_id = target_user_id;
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RAISE NOTICE 'Deleted % goals', rows_affected;

    -- 4. Delete habits
    DELETE FROM habits WHERE user_id = target_user_id;
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RAISE NOTICE 'Deleted % habits', rows_affected;

    -- 5. Delete countdowns
    DELETE FROM countdowns WHERE user_id = target_user_id;
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RAISE NOTICE 'Deleted % countdowns', rows_affected;

    -- 6. Delete captures
    DELETE FROM captures WHERE user_id = target_user_id;
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RAISE NOTICE 'Deleted % captures', rows_affected;

    -- 7. Delete user settings
    DELETE FROM user_settings WHERE user_id = target_user_id;
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RAISE NOTICE 'Deleted % user_settings', rows_affected;

    -- 8. Delete today sort events
    DELETE FROM today_sort_events WHERE user_id = target_user_id;
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RAISE NOTICE 'Deleted % today_sort_events', rows_affected;

    -- 9. Delete sessions (if you want to log them out everywhere)
    DELETE FROM sessions WHERE sess::jsonb->>'passport' LIKE '%"user":"' || target_user_id || '"%';
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RAISE NOTICE 'Deleted % sessions', rows_affected;

    -- 10. OPTIONAL: Delete the user record itself
    -- Uncomment the line below if you want to remove the user account too
    -- DELETE FROM users WHERE id = target_user_id;
    -- GET DIAGNOSTICS rows_affected = ROW_COUNT;
    -- RAISE NOTICE 'Deleted % users', rows_affected;

    RAISE NOTICE 'Successfully deleted all data for user %', target_user_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error occurred: %', SQLERRM;
        RAISE;
END $$;

COMMIT;
