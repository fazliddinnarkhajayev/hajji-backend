# Profile DAO Removal - Architecture Update

**Date:** April 3, 2026  
**Status:** ✅ ProfileDao Removed - Using PilgrimsDao Instead

---

## Overview

The separate `ProfileDao` has been removed. The mobile profile module now directly uses `PilgrimsDao` from the shared layer, treating pilgrim records as user profiles.

---

## Changes Made

### 1. ✅ Updated `PilgrimsDao` (src/shared/dao/piligrims.dao.ts)

**Enhanced Pilgrim Interface:**
```typescript
export interface Pilgrim {
  id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  phone?: string;
  email?: string;
  avatar_url?: string;           // NEW
  region?: string;               // NEW (text)
  language?: string;             // NEW
  user_id: string;
  // ... existing fields ...
  notifications_enabled?: boolean; // NEW
  elderly_mode?: boolean;          // NEW
  theme?: string;                  // NEW
}
```

**New Methods Added:**
- `findByPhone(phone: string)` - Find pilgrim by phone number
- `findByEmail(email: string)` - Find pilgrim by email
- `updateLanguage(id, language)` - Update language preference
- `updateNotifications(id, enabled)` - Toggle notifications
- `updateAvatar(id, avatarUrl)` - Update avatar URL

### 2. ✅ Updated `PilgrimsService` (src/modules/pilgrims/pilgrims.service.ts)

Added profile-related methods:
- `updateLanguage(id, language)` - With language validation
- `updateNotifications(id, enabled)` - Enable/disable notifications
- `updateProfile(id, data)` - Update profile with validation
- `updateAvatar(id, avatarUrl)` - Update user avatar
- `getProfileSettings(id)` - Get profile settings

### 3. ✅ Updated `ProfileService` (src/modules/mobile/modules/profile/profile.service.ts)

**Removed:** Inheritance from `BaseService<UserProfile, ProfileDao>`  
**Now:** Direct dependency on `PilgrimsDao`

Methods:
- Maps `Pilgrim` objects to `UserProfile` interface
- Delegates all database operations to `PilgrimsDao`
- Provides validation and business logic
- Two helper methods:
  - `mapPilgrimToUserProfile()` - Converts Pilgrim → UserProfile
  - `mapUserProfileToPilgrim()` - Converts UserProfile → Pilgrim

### 4. ✅ Updated `ProfileModule` (src/modules/mobile/modules/profile/profile.module.ts)

```typescript
@Module({
  imports: [CoreModule, JwtModule.register({})],
  controllers: [ProfileController],
  providers: [PilgrimsDao, ProfileService],  // Use PilgrimsDao directly
  exports: [ProfileService],
})
export class ProfileModule {}
```

### 5. ✅ Removed ProfileDao Import from ProfileModule

Deleted reference to local `ProfileDao` since we use shared `PilgrimsDao` instead.

---

## Architecture Diagram

```
Mobile Profile API
       ↓
ProfileController
       ↓
ProfileService (mobile/modules/profile)
       ↓
PilgrimsDao (shared/dao)
       ↓
Pilgrims Table (PostgreSQL)
```

**Key Point:** Profile is now a logical view of a Pilgrim record with additional profile fields.

---

## API Endpoints

All endpoints under `/mobile/profile`:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/mobile/profile` | Get user profile (pilgrim + profile data) |
| GET | `/mobile/profile/settings` | Get profile settings |
| PUT | `/mobile/profile/language` | Update language (uz/ru/en) |
| PUT | `/mobile/profile/notifications` | Toggle notifications |
| PUT | `/mobile/profile/me` | Update full profile |
| POST | `/mobile/profile/avatar` | Update avatar URL |

---

## Data Flow

### Getting a Profile

```
1. Frontend calls: GET /mobile/profile
2. CurrentUser decorator extracts user_id from JWT
3. ProfileService.getUserProfile(userId)
4. PilgrimsDao.findByUserId(userId) → Pilgrim object
5. mapPilgrimToUserProfile() → UserProfile object
6. Return { success: true, data: UserProfile }
```

### Updating Language

```
1. Frontend calls: PUT /mobile/profile/language { language: "ru" }
2. Convert to Pilgrim ID from user_id
3. Validate language is one of: uz, ru, en
4. PilgrimsDao.updateLanguage(id, "ru") → Updated Pilgrim
5. mapPilgrimToUserProfile() → UserProfile
6. Return { success: true, data: UserProfile }
```

---

## Database Schema

### pilgrims table

```sql
id                      -- UUID (primary)
full_name              -- VARCHAR (original fully qualified name)
first_name             -- VARCHAR (profile field)
last_name              -- VARCHAR (profile field)
middle_name            -- VARCHAR (profile field)
phone                  -- VARCHAR (unique if set)
email                  -- VARCHAR (unique if set)
avatar_url             -- TEXT (profile field)
country_id             -- UUID (foreign key)
region_id              -- UUID (foreign key)
region                 -- VARCHAR (text region name)
district_id            -- UUID (foreign key)
district               -- VARCHAR (text district name)
language               -- VARCHAR (profile field, default: 'uz')
user_id                -- UUID (unique, foreign key to users)
status                 -- VARCHAR (ACTIVE/BLOCKED)
is_blocked             -- BOOLEAN
blocked_at             -- TIMESTAMP
notifications_enabled  -- BOOLEAN (default: true)
elderly_mode           -- BOOLEAN (default: false)
theme                  -- VARCHAR (default: 'auto')
created_at             -- TIMESTAMP
created_by_id          -- UUID
updated_at             -- TIMESTAMP
updated_by_id          -- UUID
is_deleted             -- BOOLEAN (default: false)
```

---

## Benefits

✅ **Single Source of Truth** - Pilgrim = User Profile  
✅ **Reduced Code Duplication** - One DAO, not two  
✅ **Simpler Architecture** - Less abstractions  
✅ **Better Performance** - Single table queries  
✅ **Easier Maintenance** - Shared DAO for all pilgrim operations  
✅ **Type Safety** - Maps between Pilgrim and UserProfile interfaces

---

## Testing

### Test with Curl

```bash
# Get profile
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/mobile/profile

# Update language
curl -X PUT -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"language":"ru"}' \
  http://localhost:3000/mobile/profile/language

# Toggle notifications
curl -X PUT -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notifications_enabled":false}' \
  http://localhost:3000/mobile/profile/notifications
```

---

## Files Modified

✅ `src/shared/dao/piligrims.dao.ts` - Added profile methods and fields  
✅ `src/modules/pilgrims/pilgrims.service.ts` - Added profile methods  
✅ `src/modules/mobile/modules/profile/profile.service.ts` - Uses PilgrimsDao  
✅ `src/modules/mobile/modules/profile/profile.module.ts` - Uses PilgrimsDao  

## Files No Longer Used

⚠️ `src/modules/mobile/modules/profile/profile.dao.ts` - DEPRECATED  
  (Can be safely deleted, no longer imported)

---

## Error Handling

| Error | Status | Cause |
|-------|--------|-------|
| Profile not found | 404 | User has no pilgrim record |
| Unauthorized | 401 | Missing/invalid JWT token |
| Invalid language | 400 | Language not in (uz, ru, en) |
| Email already in use | 400 | Duplicate email |
| Phone already in use | 400 | Duplicate phone |

---

## Next Steps

1. **Run migrations:**
   ```bash
   npm run migrate:latest
   ```

2. **Start backend:**
   ```bash
   npm run start:dev
   ```

3. **Test endpoints** using curl commands above

4. **Delete deprecated ProfileDao** file when ready

---

**Backend Status:** ✅ Refactored and Ready  
**Architecture:** 🏗️ Simplified - One DAO, One Table
