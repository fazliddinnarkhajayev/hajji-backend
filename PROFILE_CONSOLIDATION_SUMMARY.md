# Profile API Consolidation Summary

**Date:** April 3, 2026  
**Status:** ✅ Consolidated into Pilgrims Table

---

## Changes Made

### 1. ❌ Removed Separate Profile Tables
- Deleted migrations for `profiles` table (016_create_profiles_table.ts)
- Deleted migrations for `profile_settings` table (017_create_profile_settings_table.ts)
- Migrations now marked as no-op (deprecated)

### 2. ✅ Updated Pilgrims Table
Modified migration `011_create_pilgrims_table.ts` to include all profile data:

**New Fields Added:**
- `first_name` - First name of pilgrim
- `last_name` - Last name of pilgrim
- `middle_name` - Middle name (optional)
- `avatar_url` - Profile picture URL
- `region` - Text region name  
- `district` - Text district name
- `language` - Language preference (uz, ru, en)
- `notifications_enabled` - Toggle notifications
- `elderly_mode` - Elderly mode setting
- `theme` - UI theme preference (auto, light, dark, etc.)

### 3. 📁 Moved Profile Module to Mobile
- Consolidated profile module to: `src/mobile/modules/profile/`
- Updated to use **pilgrims table** instead of separate profile tables
- All endpoints now under `/mobile/profile` prefix

### 4. 🗂 File Structure
```
src/modules/mobile/modules/profile/
├── profile.controller.ts      # Updated with all endpoints
├── profile.service.ts         # Full business logic
├── profile.dao.ts             # Pilgrims table access
├── profile.module.ts          # Module definition
└── profile.interface.ts       # Updated interfaces
```

---

## API Endpoints

All endpoints accessible via `/mobile/profile`:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/mobile/profile` | Get user profile |
| GET | `/mobile/profile/settings` | Get profile settings |
| PUT | `/mobile/profile/language` | Update language |
| PUT | `/mobile/profile/notifications` | Toggle notifications |
| PUT | `/mobile/profile/me` | Update full profile |
| POST | `/mobile/profile/avatar` | Update avatar URL |

---

## Database Schema

### pilgrims table (Updated)

```sql
CREATE TABLE pilgrims (
  id UUID PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,           -- Original
  first_name VARCHAR(100),                   -- NEW: Profile field
  last_name VARCHAR(100),                    -- NEW: Profile field
  middle_name VARCHAR(100),                  -- NEW: Profile field
  phone VARCHAR(20),                         -- NEW: Profile field
  email VARCHAR(255),                        -- NEW: Profile field
  avatar_url TEXT,                           -- NEW: Profile field
  country_id UUID,                           -- Original
  region_id UUID,                            -- Original
  region VARCHAR(100),                       -- NEW: Text region
  district_id UUID,                          -- Original
  district VARCHAR(100),                     -- NEW: Text district
  language VARCHAR(10) DEFAULT 'uz',         -- NEW: Profile field
  user_id UUID NOT NULL UNIQUE,              -- Original
  status VARCHAR(50) DEFAULT 'ACTIVE',       -- Original
  is_blocked BOOLEAN DEFAULT false,          -- Original
  blocked_at TIMESTAMP,                      -- Original
  notifications_enabled BOOLEAN DEFAULT true, -- NEW: Settings field
  elderly_mode BOOLEAN DEFAULT false,        -- NEW: Settings field
  theme VARCHAR(20) DEFAULT 'auto',          -- NEW: Settings field
  created_at TIMESTAMP DEFAULT NOW(),        -- Original
  created_by_id UUID,                        -- Original
  updated_at TIMESTAMP DEFAULT NOW(),        -- Original
  updated_by_id UUID,                        -- Original
  is_deleted BOOLEAN DEFAULT false           -- Original
);
```

---

## Benefits

✅ **Single Source of Truth** - All pilgrim data in one table
✅ **Simplified Queries** - No need for joins to get profile data
✅ **Better Performance** - Single table access pattern
✅ **Easier Maintenance** - One table to manage
✅ **Mobile-Focused** - Profile API is part of mobile module

---

## Authentication

All endpoints require:
```
Authorization: Bearer {accessToken}
```

Supports multiple user ID formats in token:
- `sub` - JWT subject
- `user_id` - Explicit user ID
- `id` - Generic ID field

---

## Validation Rules

| Field | Rule | Error |
|-------|------|-------|
| language | Must be uz\|ru\|en | 400 Bad Request |
| email | Must be unique | 400 Email already in use |
| phone | Must be unique | 400 Phone already in use |
| first_name | 2-100 chars | 400 Validation error |
| last_name | 2-100 chars | 400 Validation error |

---

## Migration Instructions

### Step 1: Update Database
```bash
# Database will auto-migrate to new schema
npm run migrate:latest
```

### Step 2: Verify Schema
```bash
# Check pilgrims table has new columns
psql -d your_db -c "\\d pilgrims"
```

### Step 3: Restart Backend
```bash
npm run start:dev
```

---

## Testing Endpoints

### Get Profile
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/mobile/profile
```

### Update Language
```bash
curl -X PUT -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"language":"ru"}' \
  http://localhost:3000/mobile/profile/language
```

### Toggle Notifications
```bash
curl -X PUT -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notifications_enabled":false}' \
  http://localhost:3000/mobile/profile/notifications
```

---

## Files Modified

✅ `src/core/database/migrations/011_create_pilgrims_table.ts` - Added profile fields
✅ `src/core/database/migrations/016_create_profiles_table.ts` - Marked as no-op
✅ `src/core/database/migrations/017_create_profile_settings_table.ts` - Marked as no-op
✅ `src/modules/mobile/modules/profile/profile.interface.ts` - Updated interfaces
✅ `src/modules/mobile/modules/profile/profile.dao.ts` - Updated to use pilgrims table
✅ `src/modules/mobile/modules/profile/profile.service.ts` - Full implementation
✅ `src/modules/mobile/modules/profile/profile.controller.ts` - All 6 endpoints
✅ `src/modules/modules.module.ts` - Removed separate ProfilesModule
✅ `src/shared/constants/table-names.ts` - Removed profile table names

---

## Response Format

All responses follow standard format:

**Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "first_name": "Ahmed",
    "last_name": "Hassan",
    "language": "uz",
    "notifications_enabled": true,
    ...
  }
}
```

**Error (400/401/404):**
```json
{
  "statusCode": 400,
  "message": "Error description"
}
```

---

## Notes

- Default language: `uz`
- Default notifications: enabled
- Default theme: `auto`
- All timestamps: ISO 8601 format
- Profile is tightly integrated with pilgrim record
- Each pilgrim has exactly one profile (one-to-one relationship)

---

**Backend Status:** ✅ Ready for Testing  
**Frontend Status:** 🔄 Ready for Integration
