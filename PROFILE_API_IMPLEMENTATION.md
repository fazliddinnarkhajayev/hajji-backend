# Profile API Implementation - Complete Guide

**Date:** April 3, 2026  
**Project:** Umrah Buddy Backend  
**Status:** ✅ Implemented

---

## Implementation Summary

All Profile API endpoints have been successfully implemented with the following components:

### 1. **Database Migrations**
- `016_create_profiles_table.ts` - Main profiles table
- `017_create_profile_settings_table.ts` - Profile settings table
- Updated `TABLE_NAMES` constants

### 2. **Data Models**
- `IProfile` interface
- `IProfileSettings` interface
- Comprehensive DTOs for all endpoints

### 3. **Data Access Layer**
- `ProfilesDao` - Profile CRUD operations
- `ProfileSettingsDao` - Settings CRUD operations
- Both extend `BaseDao` for consistency

### 4. **Business Logic**
- `ProfilesService` - All business logic with validation
  - Language validation (uz, ru, en only)
  - Email/phone uniqueness checks
  - Automatic settings creation

### 5. **API Endpoints**
- `GET /api/profile/me` - Get current user profile
- `GET /api/profile/settings` - Get profile settings
- `PUT /api/profile/language` - Update language
- `PUT /api/profile/notifications` - Toggle notifications
- `PUT /api/profile/me` - Update full profile
- `POST /api/profile/avatar` - Update avatar URL

### 6. **Module Integration**
- Complete `ProfilesModule` created
- Registered in `ModulesModule`
- Using JWT authentication guard on all endpoints

---

## API Endpoint Specifications

### 1. Get User Profile
```
GET /api/profile/me
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655430000",
    "first_name": "Ahmed",
    "last_name": "Hassan",
    "middle_name": null,
    "phone": "+998901234567",
    "email": "ahmed@example.com",
    "avatar_url": "https://...",
    "region": "Toshkent",
    "district": "Chilonzor",
    "language": "uz",
    "is_active": true,
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-04-03T14:20:00Z"
  }
}
```

---

### 2. Update Language
```
PUT /api/profile/language
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request:**
```json
{
  "language": "uz" | "ru" | "en"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655430000",
    "first_name": "Ahmed",
    "last_name": "Hassan",
    "language": "ru",
    "updated_at": "2026-04-03T14:25:00Z",
    ...
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "message": "Invalid language code"
}
```

---

### 3. Update Notifications
```
PUT /api/profile/notifications
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request:**
```json
{
  "notifications_enabled": true | false
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "settings-uuid",
    "user_id": "550e8400-e29b-41d4-a716-446655430000",
    "notifications_enabled": true,
    "elderly_mode": false,
    "preferred_language": "uz",
    "theme": "auto",
    "updated_at": "2026-04-03T14:30:00Z"
  }
}
```

---

### 4. Get Profile Settings
```
GET /api/profile/settings
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "settings-uuid",
    "user_id": "550e8400-e29b-41d4-a716-446655430000",
    "notifications_enabled": true,
    "elderly_mode": false,
    "preferred_language": "uz",
    "theme": "auto",
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-04-03T14:30:00Z"
  }
}
```

---

### 5. Update Full Profile
```
PUT /api/profile/me
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request:**
```json
{
  "first_name": "Ahmed",
  "last_name": "Hassan",
  "email": "ahmed@example.com",
  "phone": "+998901234567",
  "region": "Samarqand",
  "district": "Meros",
  "language": "uz"
}
```

**Response (200):** Same as Get Profile

---

### 6. Update Avatar
```
POST /api/profile/avatar
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request:**
```json
{
  "avatar_url": "https://cdn.example.com/avatars/user123.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "avatar_url": "https://cdn.example.com/avatars/user123.jpg"
  }
}
```

---

## Database Schema

### profiles table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  region VARCHAR(100),
  district VARCHAR(100),
  language VARCHAR(10) NOT NULL DEFAULT 'uz',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### profile_settings table
```sql
CREATE TABLE profile_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id),
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  elderly_mode BOOLEAN NOT NULL DEFAULT false,
  preferred_language VARCHAR(10) NOT NULL DEFAULT 'uz',
  theme VARCHAR(20) NOT NULL DEFAULT 'auto',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## File Structure

```
src/modules/profiles/
├── profiles.controller.ts      # API endpoints
├── profiles.service.ts         # Business logic
├── profiles.dao.ts             # Data access layer
├── profiles.module.ts          # Module definition
├── dto/
│   └── profile.dto.ts          # Request/Response DTOs
└── interfaces/
    └── profile.interface.ts    # TypeScript interfaces
```

---

## Validation Rules

### Language Field
- Must be one of: `uz`, `ru`, `en`
- Returns 400 error if invalid

### Email Field
- Must be unique (if provided)
- Standard email format validation

### Phone Field
- Must be unique
- Must be in E.164 format

### Name Fields
- Must be 2-100 characters
- XSS sanitization should be applied

### Notifications
- Boolean value required
- Affects notification delivery

---

## Authentication & Authorization

All profile endpoints require:
1. Valid JWT Bearer token in `Authorization` header
2. Token must contain `sub` (user ID)
3. User must exist in profiles table

### Decorator Used
```typescript
@UseGuards(JwtAuthGuard)
@CurrentUser() user: { id: string }
```

---

## Error Handling

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized"
}
```
When: Missing or invalid JWT token

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid language code"
}
```
When: Validation fails (invalid language, duplicate email, etc.)

### 404 Not Found
```json
{
  "success": false,
  "message": "Profile not found"
}
```
When: User profile doesn't exist

---

## Testing Checklist

- [ ] Run database migrations: `npm run migrate`
- [ ] Test GET /api/profile/me with valid token
- [ ] Test GET /api/profile/me with invalid token (401)
- [ ] Test PUT /api/profile/language with all 3 languages
- [ ] Test PUT /api/profile/language with invalid language (400)
- [ ] Test PUT /api/profile/notifications toggle on/off
- [ ] Test PUT /api/profile/me with all fields
- [ ] Test PUT /api/profile/me with partial updates
- [ ] Test PUT /api/profile/me with duplicate email (400)
- [ ] Test PUT /api/profile/me with duplicate phone (400)
- [ ] Test POST /api/profile/avatar
- [ ] Test GET /api/profile/settings

---

## Migration Instructions

### Step 1: Run migrations
```bash
npm run migrate
```

### Step 2: Verify tables created
```bash
psql -d your_db -c "\\dt profiles, profile_settings"
```

### Step 3: Start backend server
```bash
npm run start:dev
```

### Step 4: Test endpoints with Postman or curl

---

## Frontend Integration

The frontend can now:
1. Call `GET /api/profile/me` to fetch user profile
2. Call `PUT /api/profile/language` to change language
3. Call `PUT /api/profile/notifications` to toggle notifications
4. Call `PUT /api/profile/me` to update full profile
5. Call `GET /api/profile/settings` to fetch settings

All responses follow the standard format:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
}
```

---

## Notes

- Default language for new profiles: `uz`
- Default notifications: enabled
- Profile settings are automatically created with new profiles
- All timestamps are in ISO 8601 format
- Phone field must be unique across the system
- Email field must be unique if provided

---

**Created:** April 3, 2026  
**Backend Status:** ✅ Ready for Frontend Integration
