# Profile API Documentation

**Version:** 1.0  
**Date:** April 3, 2026  
**Status:** Ready for Production  
**Base URL:** `http://localhost:3000/api` (development) | `https://api.umrahbuddy.com/api` (production)

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Base Response Format](#base-response-format)
3. [Endpoints](#endpoints)
4. [Error Handling](#error-handling)
5. [Integration Examples](#integration-examples)
6. [Validation Rules](#validation-rules)

---

## Authentication

All endpoints require a valid JWT Bearer token in the `Authorization` header.

```
Authorization: Bearer {accessToken}
```

### Token Requirements
- Token must be obtained from `/api/auth/login` or `/api/auth/verify-otp`
- Token contains `sub`, `user_id`, or `id` field with user's pilgrim ID
- Token expiry: Check with backend team for TTL

### Handling 401 Errors
```javascript
if (response.status === 401) {
  // Token invalid or expired
  // Redirect to login
  window.location.href = '/login';
}
```

---

## Base Response Format

### Success Response (2xx)
```json
{
  "success": true,
  "data": {
    // Response payload
  }
}
```

### Error Response (4xx, 5xx)
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "BadRequest"
}
```

---

## Endpoints

### 1. Get User Profile

Fetch the authenticated user's profile with all personal, contact, and preference information.

**Request:**
```
GET /mobile/profile
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "full_name": "Ahmed Hassan Ibrahim",
    "first_name": "Ahmed",
    "last_name": "Hassan",
    "middle_name": "Ibrahim",
    "phone": "+998901234567",
    "email": "ahmed@example.com",
    "avatar_url": "https://cdn.umrahbuddy.com/avatars/550e8400.jpg",
    "region": "Toshkent",
    "district": "Chilonzor",
    "language": "uz",
    "user_id": "user-uuid",
    "status": "ACTIVE",
    "notifications_enabled": true,
    "elderly_mode": false,
    "theme": "auto",
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-04-03T14:20:00Z",
    "is_deleted": false,
    "country": {
      "id": "country-uuid",
      "name": "Uzbekistan",
      "soato": "UZ"
    },
    "region_data": {
      "id": "region-uuid",
      "name": "Toshkent Region",
      "soato": "10"
    },
    "district_data": {
      "id": "district-uuid",
      "name": "Chilonzor District",
      "soato": "1010"
    }
  }
}
```

**Error (404):**
```json
{
  "statusCode": 404,
  "message": "Profile not found"
}
```

---

### 2. Get Profile Settings

Fetch user's preference settings (language, notifications, theme, elderly mode).

**Request:**
```
GET /mobile/profile/settings
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications_enabled": true,
    "elderly_mode": false,
    "language": "uz",
    "theme": "auto"
  }
}
```

**Error (404):**
```json
{
  "statusCode": 404,
  "message": "Profile not found"
}
```

---

### 3. Update Language

Change the user's preferred language. Only 3 languages supported.

**Request:**
```
PUT /mobile/profile/language
Authorization: Bearer {token}
Content-Type: application/json

{
  "language": "uz" | "ru" | "en"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "full_name": "Ahmed Hassan Ibrahim",
    "first_name": "Ahmed",
    "last_name": "Hassan",
    "middle_name": "Ibrahim",
    "phone": "+998901234567",
    "email": "ahmed@example.com",
    "avatar_url": "https://cdn.umrahbuddy.com/avatars/550e8400.jpg",
    "region": "Toshkent",
    "district": "Chilonzor",
    "language": "ru",
    "user_id": "user-uuid",
    "status": "ACTIVE",
    "notifications_enabled": true,
    "elderly_mode": false,
    "theme": "auto",
    "updated_at": "2026-04-03T14:25:00Z"
  }
}
```

**Error (400):**
```json
{
  "statusCode": 400,
  "message": "Invalid language code"
}
```

**Supported Languages:**
| Code | Language |
|------|----------|
| uz   | Uzbek (O'zbek) |
| ru   | Russian (Русский) |
| en   | English |

---

### 4. Update Notifications

Enable or disable push notifications for the user.

**Request:**
```
PUT /mobile/profile/notifications
Authorization: Bearer {token}
Content-Type: application/json

{
  "notifications_enabled": true | false
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "full_name": "Ahmed Hassan Ibrahim",
    "first_name": "Ahmed",
    "last_name": "Hassan",
    "middle_name": "Ibrahim",
    "phone": "+998901234567",
    "email": "ahmed@example.com",
    "avatar_url": "https://cdn.umrahbuddy.com/avatars/550e8400.jpg",
    "region": "Toshkent",
    "district": "Chilonzor",
    "language": "uz",
    "user_id": "user-uuid",
    "status": "ACTIVE",
    "notifications_enabled": false,
    "elderly_mode": false,
    "theme": "auto",
    "updated_at": "2026-04-03T14:30:00Z"
  }
}
```

---

### 5. Update Full Profile

Update user's profile information (personal details, contact info, preferences).

**Request:**
```
PUT /mobile/profile/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "first_name": "Ahmed",
  "last_name": "Hassan",
  "middle_name": "Ibrahim",
  "email": "ahmed@example.com",
  "phone": "+998901234567",
  "region": "Samarqand",
  "district": "Meros",
  "language": "uz"
}
```

**Note:** All fields are optional. Only include fields you want to update.

**Response (200):** Same as Get Profile endpoint

**Error (400) - Duplicate Email:**
```json
{
  "statusCode": 400,
  "message": "Email already in use"
}
```

**Error (400) - Duplicate Phone:**
```json
{
  "statusCode": 400,
  "message": "Phone already in use"
}
```

**Error (400) - Invalid Language:**
```json
{
  "statusCode": 400,
  "message": "Invalid language code"
}
```

---

### 6. Update Avatar

Update user's profile picture URL.

**Request:**
```
POST /mobile/profile/avatar
Authorization: Bearer {token}
Content-Type: application/json

{
  "avatar_url": "https://cdn.umrahbuddy.com/avatars/user123.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "full_name": "Ahmed Hassan Ibrahim",
    "first_name": "Ahmed",
    "last_name": "Hassan",
    "middle_name": "Ibrahim",
    "phone": "+998901234567",
    "email": "ahmed@example.com",
    "avatar_url": "https://cdn.umrahbuddy.com/avatars/user123.jpg",
    "region": "Toshkent",
    "district": "Chilonzor",
    "language": "uz",
    "user_id": "user-uuid",
    "status": "ACTIVE",
    "notifications_enabled": true,
    "elderly_mode": false,
    "theme": "auto",
    "updated_at": "2026-04-03T14:35:00Z"
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Request successful |
| 400 | Bad Request | Validation failed, invalid data |
| 401 | Unauthorized | Missing/invalid JWT token |
| 404 | Not Found | Profile doesn't exist |
| 500 | Server Error | Backend error |

### Common Error Responses

**Missing Token:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Invalid Token:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Profile Not Found:**
```json
{
  "statusCode": 404,
  "message": "Profile not found"
}
```

---

## Joined Data Fields

All profile endpoints return additional joined data from related tables:

### Country Object
```json
{
  "country": {
    "id": "country-uuid",
    "name": "Uzbekistan",
    "soato": "UZ"
  }
}
```

### Region Object
```json
{
  "region_data": {
    "id": "region-uuid",
    "name": "Toshkent Region",
    "soato": "10"
  }
}
```

### District Object
```json
{
  "district_data": {
    "id": "district-uuid",
    "name": "Chilonzor District",
    "soato": "1010"
  }
}
```

These joined objects provide full information about the country, region, and district associated with the pilgrim, including their SOATO codes for administrative identification.

---

## Validation Rules

### Email
- Must be valid email format
- Must be unique in system
- Optional field

### Phone
- Must be in E.164 format: `+[country code][number]`
- Example: `+998912345678`
- Must be unique in system
- Optional field

### Language
- Must be one of: `uz`, `ru`, `en`
- Case-sensitive
- Returns 400 error if invalid

### Names
- `first_name`: 1-100 characters
- `last_name`: 1-100 characters
- `middle_name`: 1-100 characters
- All optional
- Cannot be empty strings

### Avatar URL
- Must be valid HTTPS URL
- Optional field
- Recommended: Use CDN for image hosting

---

## Integration Examples

### JavaScript/TypeScript (Fetch API)

```typescript
// Get Profile
const response = await fetch('http://localhost:3000/api/mobile/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

const { success, data } = await response.json();
if (response.ok) {
  console.log('Profile:', data);
} else {
  console.error('Error:', data.message);
}
```

```typescript
// Update Language
const response = await fetch('http://localhost:3000/api/mobile/profile/language', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    language: 'ru'
  })
});

const { success, data } = await response.json();
if (response.ok) {
  console.log('Language updated to:', data.language);
}
```

```typescript
// Update Full Profile
const response = await fetch('http://localhost:3000/api/mobile/profile/me', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    first_name: 'Ahmed',
    last_name: 'Hassan',
    email: 'ahmed@example.com',
    phone: '+998912345678',
    region: 'Samarqand',
    district: 'Meros'
  })
});

const { success, data } = await response.json();
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/mobile/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        // Token expired, redirect to login
        window.location.href = '/login';
        return;
      }

      const { success, data } = await response.json();
      if (success) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLanguage = async (language) => {
    try {
      const response = await fetch('http://localhost:3000/api/mobile/profile/language', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ language })
      });

      const { success, data } = await response.json();
      if (success) {
        setProfile(data);
        // Update app language
        changeAppLanguage(language);
      }
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  };

  const toggleNotifications = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/mobile/profile/notifications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notifications_enabled: !profile.notifications_enabled
        })
      });

      const { success, data } = await response.json();
      if (success) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to update notifications:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{profile.full_name}</h1>
      <p>Email: {profile.email}</p>
      <p>Language: {profile.language}</p>
      <button onClick={() => updateLanguage('ru')}>Switch to Russian</button>
      <button onClick={toggleNotifications}>
        {profile.notifications_enabled ? 'Disable' : 'Enable'} Notifications
      </button>
    </div>
  );
}
```

### Axios Example

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Usage
export const profileApi = {
  getProfile: () => api.get('/mobile/profile'),
  getSettings: () => api.get('/mobile/profile/settings'),
  updateLanguage: (language) => 
    api.put('/mobile/profile/language', { language }),
  updateNotifications: (enabled) => 
    api.put('/mobile/profile/notifications', { notifications_enabled: enabled }),
  updateProfile: (data) => 
    api.put('/mobile/profile/me', data),
  updateAvatar: (avatarUrl) => 
    api.post('/mobile/profile/avatar', { avatar_url: avatarUrl })
};

// In component
const { data: response } = await profileApi.getProfile();
const profile = response.data;
```

---

## Testing with cURL

### Get Profile
```bash
curl -X GET http://localhost:3000/api/mobile/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Update Language
```bash
curl -X PUT http://localhost:3000/api/mobile/profile/language \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"language":"ru"}'
```

### Toggle Notifications
```bash
curl -X PUT http://localhost:3000/api/mobile/profile/notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notifications_enabled":false}'
```

### Update Profile
```bash
curl -X PUT http://localhost:3000/api/mobile/profile/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Ahmed",
    "last_name": "Hassan",
    "email": "ahmed@example.com",
    "phone": "+998912345678"
  }'
```

---

## Notes for Frontend Team

1. **Token Management**: Store token securely (not in localStorage for sensitive apps)
2. **Error Handling**: Always handle 401 errors by redirecting to login
3. **Loading States**: Show loading spinners during API calls
4. **Optimistic Updates**: Consider optimistic UI updates for better UX
5. **Caching**: Cache profile data and update only when needed
6. **Rate Limiting**: Consider 1 request per 5 seconds for updates
7. **Offline Support**: Consider implementing offline caching
8. **Images**: Use CDN for avatar uploads, don't send to this endpoint

---

## Support

For issues or questions:
- Check error messages in response body
- Verify JWT token is valid
- Ensure all required fields are provided
- Check validation rules for each field

**Backend Team Contact:** backend@umrahbuddy.com

---

**Last Updated:** April 3, 2026  
**API Version:** 1.0
