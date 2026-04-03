# Profile API - Quick Reference

**Status:** ✅ Fully Implemented  
**Date:** April 3, 2026

---

## 🚀 Quick Start

### 1. Run Migrations
```bash
npm run migrate:latest
```

### 2. Start Backend Server
```bash
npm run start:dev
```

### 3. Test with Curl
```bash
# Get profile
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/profile/me
```

---

## 📋 Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/profile/me` | Get user profile |
| GET | `/api/profile/settings` | Get profile settings |
| PUT | `/api/profile/language` | Update language (uz/ru/en) |
| PUT | `/api/profile/notifications` | Toggle notifications |
| PUT | `/api/profile/me` | Update full profile |
| POST | `/api/profile/avatar` | Update avatar URL |

---

## 📁 File Structure

```
src/
├── core/database/migrations/
│   ├── 016_create_profiles_table.ts
│   └── 017_create_profile_settings_table.ts
├── modules/
│   └── profiles/
│       ├── profiles.controller.ts
│       ├── profiles.service.ts
│       ├── profiles.dao.ts
│       ├── profiles.module.ts
│       ├── dto/
│       │   ├── profile.dto.ts
│       │   └── index.ts
│       └── interfaces/
│           ├── profile.interface.ts
│           └── index.ts
└── shared/constants/
    └── table-names.ts (UPDATED)
```

---

## 🔐 Authentication

All endpoints require:
```
Authorization: Bearer {accessToken}
```

Guard: `JwtAuthGuard`  
Decorator: `@CurrentUser()` to get user ID

---

## 📊 Database Tables

### profiles
```sql
id, first_name, last_name, middle_name, phone, email, avatar_url, 
region, district, language, is_active, created_at, updated_at
```

### profile_settings
```sql
id, user_id, notifications_enabled, elderly_mode, 
preferred_language, theme, created_at, updated_at
```

---

## ✅ Validation Rules

| Field | Rule | Error |
|-------|------|-------|
| language | Must be uz\|ru\|en | 400 Bad Request |
| email | Must be unique | 400 Email already in use |
| phone | Must be unique | 400 Phone already in use |
| first_name | 2-100 chars | 400 Length error |
| last_name | 2-100 chars | 400 Length error |

---

## 🔄 Response Format

**Success:**
```json
{
  "success": true,
  "data": { /* payload */ }
}
```

**Error:**
```json
{
  "statusCode": 400|401|404,
  "message": "Error description"
}
```

---

## 🧪 Test Endpoints

Get profile:
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/profile/me
```

Update language:
```bash
curl -X PUT -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"language":"ru"}' \
  http://localhost:3000/api/profile/language
```

Update notifications:
```bash
curl -X PUT -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notifications_enabled":false}' \
  http://localhost:3000/api/profile/notifications
```

---

## 🐛 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | No/invalid token | Check JWT token |
| 404 Not Found | User not exists | Create profile first |
| 400 Bad Request | Validation failed | Check request body |
| Unique violation | Duplicate email/phone | Use different value |

---

## 📚 Documentation Files

1. **PROFILE_API_IMPLEMENTATION.md** - Complete implementation details
2. **PROFILE_API_TESTING.md** - Testing guide with curl commands
3. **PROFILE_API_QUICK_REFERENCE.md** - This file

---

## 🔗 Module Integration

The `ProfilesModule` is imported in `ModulesModule`:

```typescript
imports: [
  AdminsModule,
  ReferencesModule,
  AuthModule,
  UsersModule,
  PilgrimsModule,
  MobileModule,
  ProfilesModule  // ← Added
]
```

---

## 🎯 What's Implemented

✅ 6 API endpoints  
✅ JWT authentication  
✅ Input validation  
✅ Error handling  
✅ Database migrations  
✅ Service layer  
✅ DAO layer  
✅ Module structure  
✅ DTOs & Interfaces  
✅ Comprehensive documentation  

---

## 📝 Notes

- Default language: `uz`
- Settings auto-created with new profiles
- All timestamps: ISO 8601 format
- Phone/Email must be globally unique
- Avatar URL is stored as text (file upload handled by frontend CDN)

---

**Backend Status:** ✅ Production Ready  
**Frontend Status:** 🔄 Ready for Integration
