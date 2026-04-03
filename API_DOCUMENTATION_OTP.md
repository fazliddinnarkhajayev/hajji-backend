# OTP Authentication API Documentation

## Overview

The Umrah Buddy backend provides a two-step OTP (One-Time Password) authentication flow for pilgrims:

1. **Send OTP** - Request an OTP code to be sent via SMS or Telegram
2. **Verify OTP** - Verify the OTP code to authenticate/register the user

This flow enables secure and passwordless authentication for new and returning users.

---

## Base URL

```
http://localhost:3000/api/auth
```

Replace `localhost:3000` with your backend server URL in production.

---

## API Endpoints

### 1. Send OTP

**Endpoint:** `POST /auth/send-otp`

**Description:** Send an OTP code to the user's phone number via SMS or Telegram.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "phone": "+92 300 1234567",
  "method": "SMS"
}
```

**Parameters:**
| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `phone` | string | Yes | Phone number (any format, will be normalized) | `+92 300 1234567` or `03001234567` or `3001234567` |
| `method` | enum | Yes | Delivery method: `SMS` or `TELEGRAM` | `SMS` |

#### Response - Success (200)

```json
{
  "success": true,
  "expires_in_minutes": 10
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` on success |
| `expires_in_minutes` | number | OTP validity duration in minutes |

#### Example cURL

```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+92 300 1234567",
    "method": "SMS"
  }'
```

#### Example JavaScript/Axios

```javascript
import axios from 'axios';

async function sendOtp(phone, method = 'SMS') {
  try {
    const response = await axios.post(
      'http://localhost:3000/api/auth/send-otp',
      {
        phone: phone,
        method: method
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('OTP sent successfully');
    console.log(`OTP will expire in ${response.data.expires_in_minutes} minutes`);
    return response.data;
  } catch (error) {
    console.error('Error sending OTP:', error.response?.data?.message);
    throw error;
  }
}

// Usage
await sendOtp('+92 300 1234567', 'SMS');
// or
await sendOtp('03001234567', 'TELEGRAM');
```

#### Example React Hooks

```javascript
import { useState } from 'react';
import axios from 'axios';

export function useOtpSend() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expiryMinutes, setExpiryMinutes] = useState(null);

  const sendOtp = async (phone, method = 'SMS') => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        'http://localhost:3000/api/auth/send-otp',
        { phone, method }
      );
      setExpiryMinutes(response.data.expires_in_minutes);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to send OTP';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { sendOtp, loading, error, expiryMinutes };
}

// Usage in Component
function OtpForm() {
  const { sendOtp, loading, error, expiryMinutes } = useOtpSend();
  const [phone, setPhone] = useState('');

  const handleSendOtp = async () => {
    try {
      await sendOtp(phone, 'SMS');
      // Show OTP input field and countdown timer
    } catch (error) {
      // Show error message
    }
  };

  return (
    <div>
      <input 
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Enter phone number"
      />
      <button onClick={handleSendOtp} disabled={loading}>
        {loading ? 'Sending...' : 'Send OTP'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {expiryMinutes && <p>OTP expires in {expiryMinutes} minutes</p>}
    </div>
  );
}
```

#### Error Responses

**400 Bad Request** - Invalid phone number format
```json
{
  "statusCode": 400,
  "message": "phone must be a valid phone number",
  "error": "Bad Request"
}
```

**400 Bad Request** - Invalid method
```json
{
  "statusCode": 400,
  "message": "method must be one of the following values: SMS, TELEGRAM",
  "error": "Bad Request"
}
```

**500 Internal Server Error** - Server error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

### 2. Verify OTP

**Endpoint:** `POST /auth/verify-otp`

**Description:** Verify the OTP code sent to the user's phone. On success, automatically registers a new user (if not exists) and returns authentication tokens.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "phone": "+92 300 1234567",
  "code": "123456"
}
```

**Parameters:**
| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `phone` | string | Yes | Same phone number used in send-otp | `+92 300 1234567` or `03001234567` |
| `code` | string | Yes | 4-10 digit OTP code received | `123456` |

#### Response - Success (200 - New User)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "is_new_user": true
}
```

#### Response - Success (200 - Existing User)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "is_new_user": false
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `access_token` | string | JWT token for API authentication (expires in 15 minutes) |
| `refresh_token` | string | JWT token for refreshing access token (long-lived) |
| `is_new_user` | boolean | `true` if user was auto-created, `false` if existing user |

#### Token Usage

Include the `access_token` in subsequent API requests:

```
Authorization: Bearer <access_token>
```

Example:
```bash
curl -X GET http://localhost:3000/api/pilgrims/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Example cURL

```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+92 300 1234567",
    "code": "123456"
  }'
```

#### Example JavaScript/Axios

```javascript
import axios from 'axios';

async function verifyOtp(phone, code) {
  try {
    const response = await axios.post(
      'http://localhost:3000/api/auth/verify-otp',
      {
        phone: phone,
        code: code
      }
    );
    
    const { access_token, refresh_token, is_new_user } = response.data;
    
    // Store tokens
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    
    if (is_new_user) {
      console.log('New user registered');
      // Redirect to profile completion page
    } else {
      console.log('Existing user logged in');
      // Redirect to home/dashboard
    }
    
    return response.data;
  } catch (error) {
    console.error('Error verifying OTP:', error.response?.data?.message);
    throw error;
  }
}

// Usage
await verifyOtp('+92 300 1234567', '123456');
```

#### Example React Hooks

```javascript
import { useState } from 'react';
import axios from 'axios';

export function useOtpVerify() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const verifyOtp = async (phone, code) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        'http://localhost:3000/api/auth/verify-otp',
        { phone, code }
      );
      
      // Store tokens
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to verify OTP';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { verifyOtp, loading, error };
}

// Usage in Component
function OtpVerification() {
  const { verifyOtp, loading, error } = useOtpVerify();
  const [code, setCode] = useState('');
  const [phone] = useState(sessionStorage.getItem('phone'));

  const handleVerify = async () => {
    try {
      const { is_new_user } = await verifyOtp(phone, code);
      if (is_new_user) {
        // Show profile completion form
      } else {
        // Redirect to dashboard
      }
    } catch (error) {
      // Error is already set in hook
    }
  };

  return (
    <div>
      <input 
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter 6-digit OTP"
        maxLength="6"
      />
      <button onClick={handleVerify} disabled={loading || code.length !== 6}>
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

#### Error Responses

**400 Bad Request** - OTP not found or expired
```json
{
  "statusCode": 400,
  "message": "OTP not found or expired",
  "error": "Bad Request"
}
```

**400 Bad Request** - Invalid OTP code
```json
{
  "statusCode": 400,
  "message": "Invalid OTP code",
  "error": "Bad Request"
}
```

**400 Bad Request** - OTP already used
```json
{
  "statusCode": 400,
  "message": "OTP has already been used",
  "error": "Bad Request"
}
```

**400 Bad Request** - OTP expired
```json
{
  "statusCode": 400,
  "message": "OTP has expired",
  "error": "Bad Request"
}
```

**403 Forbidden** - User account blocked
```json
{
  "statusCode": 403,
  "message": "User account is blocked",
  "error": "Forbidden"
}
```

**403 Forbidden** - User account deleted
```json
{
  "statusCode": 403,
  "message": "User account has been deleted",
  "error": "Forbidden"
}
```

**400 Bad Request** - Invalid phone format
```json
{
  "statusCode": 400,
  "message": "phone must be a valid phone number",
  "error": "Bad Request"
}
```

**400 Bad Request** - Invalid code format
```json
{
  "statusCode": 400,
  "message": "code must be a string, code must have a minimum length of 4",
  "error": "Bad Request"
}
```

---

## Complete Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   OTP Authentication Flow                    │
└─────────────────────────────────────────────────────────────┘

1. User enters phone number
   ↓
2. Frontend calls: POST /auth/send-otp
   ├─ Backend: Generates 6-digit OTP
   ├─ Backend: Saves OTP session (expires in 10 minutes)
   ├─ Backend: Sends OTP via SMS/Telegram (TODO)
   └─ Response: { success: true, expires_in_minutes: 10 }
   ↓
3. User receives OTP code
   ↓
4. User enters OTP code in frontend
   ↓
5. Frontend calls: POST /auth/verify-otp
   ├─ Backend: Validates OTP code
   ├─ Backend: Marks OTP as used
   ├─ Backend: If new phone:
   │  └─ Auto-creates PILGRIM user
   ├─ Backend: Generates JWT tokens
   └─ Response: { 
        access_token: string,
        refresh_token: string,
        is_new_user: boolean
      }
   ↓
6. Frontend stores tokens
   ├─ localStorage.setItem('access_token', token)
   └─ localStorage.setItem('refresh_token', token)
   ↓
7. Check is_new_user flag
   ├─ true: Redirect to profile completion
   └─ false: Redirect to dashboard
   ↓
8. Use access_token for subsequent API calls
   └─ Header: Authorization: Bearer <access_token>
```

---

## Phone Number Normalization

The backend normalizes all phone numbers to their last 10 digits by removing all non-numeric characters.

**Examples:**
| Input | Normalized |
|-------|-----------|
| `+92 300 1234567` | `3001234567` |
| `03001234567` | `3001234567` |
| `300-123-4567` | `3001234567` |
| `+1 (300) 123-4567` | `3001234567` |
| `3001234567` | `3001234567` |

**Note:** Always use the same phone number format in both `send-otp` and `verify-otp` requests, or ensure you normalize it consistently on the frontend.

---

## Configuration

The OTP timeout is configurable via environment variables:

```env
OTP_EXPIRY_MINUTES=10
```

**Default:** 10 minutes

---

## Error Handling Best Practices

### Frontend Implementation

```javascript
const otpErrors = {
  'OTP not found or expired': 'Please request a new OTP',
  'Invalid OTP code': 'The code you entered is incorrect. Please try again.',
  'OTP has already been used': 'This OTP was already used. Please request a new one.',
  'OTP has expired': 'OTP has expired. Please request a new one.',
  'User account is blocked': 'Your account has been blocked. Contact support.',
  'User account has been deleted': 'Your account has been deleted.',
  'phone must be a valid phone number': 'Please enter a valid phone number',
  'code must be a string, code must have a minimum length of 4': 'OTP must be 4-10 characters'
};

async function handleVerifyOtpError(error) {
  const message = error.response?.data?.message;
  const userMessage = otpErrors[message] || 'An error occurred. Please try again.';
  
  // Show user-friendly error message
  showErrorToast(userMessage);
  
  // Log detailed error for debugging
  console.error('OTP Verification Error:', {
    status: error.response?.status,
    message: error.response?.data?.message,
    timestamp: new Date().toISOString()
  });
}
```

---

## Security Considerations

1. **Store Tokens Securely:**
   - Use `localStorage` for persistence (acceptable for this use case)
   - Consider `sessionStorage` for sensitive environments
   - Clear tokens on logout

2. **Phone Number Privacy:**
   - Normalize phone numbers consistently
   - Use HTTPS in production
   - Don't log full phone numbers in client-side logs

3. **OTP Validation:**
   - Require users to verify OTP before proceeding
   - Implement rate limiting on frontend (max 3 attempts)
   - Don't display OTP code in logs or errors
   - Enforce HTTPS for all API calls

4. **Token Management:**
   - Include `Authorization: Bearer <token>` in request headers
   - Handle token expiration (401 response)
   - Use refresh_token to obtain new access_token
   - Clear tokens on logout

---

## Testing the API

### Using Postman

**Send OTP:**
1. Method: `POST`
2. URL: `http://localhost:3000/api/auth/send-otp`
3. Headers: `Content-Type: application/json`
4. Body:
   ```json
   {
     "phone": "+92 300 1234567",
     "method": "SMS"
   }
   ```

**Verify OTP:**
1. Method: `POST`
2. URL: `http://localhost:3000/api/auth/verify-otp`
3. Headers: `Content-Type: application/json`
4. Body:
   ```json
   {
     "phone": "+92 300 1234567",
     "code": "123456"
   }
   ```

**Note:** Check the backend console for the generated OTP code (currently mocked). In development, the OTP is logged to console for easier testing.

---

## Integration Checklist

- [ ] Install axios or fetch library
- [ ] Create OTP send function
- [ ] Create OTP verify function
- [ ] Implement timer countdown (10 minutes)
- [ ] Store tokens in localStorage
- [ ] Add error handling and user messages
- [ ] Implement "Resend OTP" functionality
- [ ] Add phone number input validation
- [ ] Create profile completion page for new users
- [ ] Add logout functionality (clear tokens)
- [ ] Test with real phone numbers
- [ ] Test on mobile devices
- [ ] Implement rate limiting on frontend

---

## Support & Questions

For issues or questions:
- Check backend logs for detailed error messages
- Verify request format matches documentation exactly
- Ensure `Content-Type: application/json` header is set
- Test with different phone number formats
- Verify backend is running and accessible

---

**Last Updated:** April 3, 2026  
**API Version:** 1.0  
**Status:** Active & Ready for Integration
