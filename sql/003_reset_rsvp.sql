-- ============================================================================
-- Nepal Elections 2026 - Reset RSVP Counts
-- Run after seeding to ensure rsvp_count starts at 0
-- ============================================================================

-- Reset all event RSVP counts to 0
UPDATE events SET rsvp_count = 0;

-- Clear any stale RSVP records (if re-seeding)
TRUNCATE rsvps RESTART IDENTITY CASCADE;

-- Verify
SELECT 'Events reset:' as status, COUNT(*) as count FROM events WHERE rsvp_count = 0;
SELECT 'RSVPs cleared:' as status, COUNT(*) as count FROM rsvps;

-- ============================================================================
-- RESET COMPLETE
-- ============================================================================
