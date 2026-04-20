# Profile API - Testing Guide

**Status:** Ready for Testing  
**Date:** April 3, 2026

---

## Prerequisites

1. Backend server running on `http://localhost:3000`
2. Valid JWT token (from login/register endpoint)
3. Curl or Postman installed
4. PostgreSQL database with migrations run

---

## Environment Setup

### Set Variables
```bash
# Replace with your actual values
export TOKEN="your_jwt_token_here"
export API_URL="http://localhost:3000/api"
export USER_ID="user-uuid-here"
```

---

## Test Cases

### 1️⃣ Get User Profile

**Description:** Fetch the authenticated user's profile data

**Curl Command:**
```bash
curl -X GET "$API_URL/profile/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response (200):**
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
    "avatar_url": null,
    "region": "Toshkent",
    "district": "Chilonzor",
    "language": "uz",
    "is_active": true,
    "created_at": "2026-01-15T10:30:00.000Z",
    "updated_at": "2026-01-15T10:30:00.000Z"
  }
}
```

**Error Cases:**
- No token: 401 Unauthorized
- Invalid token: 401 Unauthorized
- User not found: 404 Not Found

---

### 2️⃣ Get Profile Settings

**Description:** Fetch user's profile settings (notifications, theme, etc.)

**Curl Command:**
```bash
curl -X GET "$API_URL/profile/settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "settings-uuid-here",
    "user_id": "550e8400-e29b-41d4-a716-446655430000",
    "notifications_enabled": true,
    "elderly_mode": false,
    "preferred_language": "uz",
    "theme": "auto",
    "created_at": "2026-01-15T10:30:00.000Z",
    "updated_at": "2026-01-15T10:30:00.000Z"
  }
}
```

---

### 3️⃣ Update Language (uz)

**Description:** Change user's language preference to Uzbek

**Curl Command:**
```bash
curl -X PUT "$API_URL/profile/language" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "uz"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655430000",
    "first_name": "Ahmed",
    "last_name": "Hassan",
    "language": "uz",
    "updated_at": "2026-04-03T14:25:00.000Z",
    ...
  }
}
```

---

### 4️⃣ Update Language (ru)

**Description:** Change user's language preference to Russian

**Curl Command:**
```bash
curl -X PUT "$API_URL/profile/language" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "ru"
  }'
```

**Expected Response:** Same as case #3, with `language: "ru"`

---

### 5️⃣ Update Language (en)

**Description:** Change user's language preference to English

**Curl Command:**
```bash
curl -X PUT "$API_URL/profile/language" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "en"
  }'
```

**Expected Response:** Same as case #3, with `language: "en"`

---

### 6️⃣ Update Language - Invalid Code

**Description:** Test error handling for invalid language code

**Curl Command:**
```bash
curl -X PUT "$API_URL/profile/language" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "fr"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Invalid language code"
}
```

---

### 7️⃣ Enable Notifications

**Description:** Enable push notifications for user

**Curl Command:**
```bash
curl -X PUT "$API_URL/profile/notifications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notifications_enabled": true
  }'
```

**Expected Response (200):**
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
    "updated_at": "2026-04-03T14:30:00.000Z"
  }
}
```

---

### 8️⃣ Disable Notifications

**Description:** Disable push notifications for user

**Curl Command:**
```bash
curl -X PUT "$API_URL/profile/notifications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notifications_enabled": false
  }'
```

**Expected Response (200):** Same as case #7, with `notifications_enabled: false`

---

### 9️⃣ Update Full Profile

**Description:** Update multiple profile fields at once

**Curl Command:**
```bash
curl -X PUT "$API_URL/profile/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Mohammed",
    "last_name": "Ibrahim",
    "email": "mohammed@example.com",
    "phone": "+998912345678",
    "region": "Samarqand",
    "district": "Meros",
    "language": "ru"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655430000",
    "first_name": "Mohammed",
    "last_name": "Ibrahim",
    "email": "mohammed@example.com",
    "phone": "+998912345678",
    "region": "Samarqand",
    "district": "Meros",
    "language": "ru",
    "updated_at": "2026-04-03T15:00:00.000Z",
    ...
  }
}
```

---

### 🔟 Update Profile - Partial

**Description:** Update only some profile fields

**Curl Command:**
```bash
curl -X PUT "$API_URL/profile/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Ahmed",
    "language": "uz"
  }'
```

**Expected Response:** Only updated fields change

---

### 1️⃣1️⃣ Update Avatar

**Description:** Update user's profile avatar URL

**Curl Command:**
```bash
curl -X POST "$API_URL/profile/avatar" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "avatar_url": "https://cdn.example.com/avatars/user123.jpg"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "avatar_url": "https://cdn.example.com/avatars/user123.jpg"
  }
}
```

---

### 1️⃣2️⃣ Update Profile - Duplicate Email

**Description:** Test validation when email already exists

**Curl Command:**
```bash
curl -X PUT "$API_URL/profile/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "existing@example.com"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Email already in use"
}
```

---

### 1️⃣3️⃣ Update Profile - Duplicate Phone

**Description:** Test validation when phone already exists

**Curl Command:**
```bash
curl -X PUT "$API_URL/profile/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Phone already in use"
}
```

---

### 1️⃣4️⃣ Missing Authorization Header

**Description:** Test 401 error when token is missing

**Curl Command:**
```bash
curl -X GET "$API_URL/profile/me" \
  -H "Content-Type: application/json"
```

**Expected Response (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

### 1️⃣5️⃣ Invalid Token

**Description:** Test 401 error when token is invalid

**Curl Command:**
```bash
curl -X GET "$API_URL/profile/me" \
  -H "Authorization: Bearer invalid_token_here" \
  -H "Content-Type: application/json"
```

**Expected Response (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## Postman Collection

### Import Steps
1. Open Postman
2. Create new collection: "Profile API"
3. Add requests with the curl commands above
4. Set `{{TOKEN}}` variable in collection
5. Set `{{API_URL}}` variable in collection

### Quick Setup
```
Base URL: {{API_URL}}
Auth: Bearer Token with {{TOKEN}} variable
```

---

## Batch Testing Script

Save as `test-profile-api.sh`:

```bash
#!/bin/bash

TOKEN="your_token_here"
API_URL="http://localhost:3000/api"

echo "🧪 Profile API Test Suite"
echo "=========================="

# Test 1: Get Profile
echo -e "\n1️⃣ GET /profile/me"
curl -X GET "$API_URL/profile/me" \
  -H "Authorization: Bearer $TOKEN" -s | jq .

# Test 2: Get Settings
echo -e "\n2️⃣ GET /profile/settings"
curl -X GET "$API_URL/profile/settings" \
  -H "Authorization: Bearer $TOKEN" -s | jq .

# Test 3: Update Language
echo -e "\n3️⃣ PUT /profile/language"
curl -X PUT "$API_URL/profile/language" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"language":"ru"}' -s | jq .

# Test 4: Toggle Notifications
echo -e "\n4️⃣ PUT /profile/notifications"
curl -X PUT "$API_URL/profile/notifications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notifications_enabled":false}' -s | jq .

echo -e "\n✅ Test suite completed"
```

Run:
```bash
chmod +x test-profile-api.sh
./test-profile-api.sh
```

---

## Success Criteria

- ✅ All 6 endpoints return 200 for valid requests
- ✅ Language validation rejects invalid codes with 400
- ✅ Missing token returns 401
- ✅ Invalid token returns 401
- ✅ Duplicate email/phone returns 400
- ✅ User not found returns 404
- ✅ Notifications toggle persists
- ✅ Language change persists
- ✅ Avatar URL updates correctly
- ✅ Timestamps update correctly

---

## Common Issues & Solutions

### Issue: 401 Unauthorized
**Solution:** 
- Check token validity: `jwt.io`
- Verify token includes `sub` claim
- Token may have expired

### Issue: 404 Not Found
**Solution:**
- User profile may not be created yet
- Check if migrations have run
- Verify user_id is correct

### Issue: 400 Bad Request
**Solution:**
- Check request body format
- Verify language is one of: uz, ru, en
- Check for duplicate email/phone

### Issue: Database Error
**Solution:**
- Run migrations: `npm run migrate:latest`
- Check database connection
- Verify table structure with: `\d profiles`

---

**Created:** April 3, 2026  
**Last Updated:** April 3, 2026
