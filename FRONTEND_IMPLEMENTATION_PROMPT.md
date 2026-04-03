# Frontend Implementation Prompt for OTP Authentication

You can copy this prompt and give it to your frontend development team or use it with Claude/ChatGPT to generate the implementation code.

---

## Prompt for Frontend Team

### Context
We have a backend API that implements OTP (One-Time Password) authentication flow for a pilgrimage app (Umrah Buddy). The frontend needs to implement two main features:

1. **Send OTP** - Request an OTP code to be sent to user's phone via SMS or Telegram
2. **Verify OTP** - Verify the OTP code to login/register the user

### API Endpoints

**Send OTP:**
```
POST http://localhost:3000/api/auth/send-otp
Content-Type: application/json

{
  "phone": "+92 300 1234567",
  "method": "SMS"  // or "TELEGRAM"
}

Response:
{
  "success": true,
  "expires_in_minutes": 10
}
```

**Verify OTP:**
```
POST http://localhost:3000/api/auth/verify-otp
Content-Type: application/json

{
  "phone": "+92 300 1234567",
  "code": "123456"
}

Response:
{
  "access_token": "jwt_token_here",
  "refresh_token": "jwt_token_here",
  "is_new_user": true  // true if new registration, false if existing user
}
```

### Key Requirements

1. **Phone Number Input Screen**
   - User enters phone number (any format like +92 300 123 4567 or 03001234567)
   - Dropdown to select SMS or Telegram delivery method
   - "Send OTP" button
   - Show loading state while sending
   - Display success message with "OTP expires in 10 minutes" countdown timer
   - Show error message if send fails

2. **OTP Verification Screen**
   - Show user's phone number (masked or clear)
   - Input field for 6-digit OTP code
   - Display countdown timer (10 minutes)
   - "Verify" button
   - "Resend OTP" button (disabled until timer expires)
   - Show error message if verification fails
   - Handle these error cases:
     - "OTP not found or expired" → Offer to resend
     - "Invalid OTP code" → Ask to try again
     - "OTP has already been used" → Offer to send new OTP
     - "User account is blocked" → Show account blocked message
     - "User account has been deleted" → Show account deleted message

3. **Token Management**
   - Store `access_token` in localStorage/sessionStorage
   - Store `refresh_token` in localStorage/sessionStorage
   - Add `Authorization: Bearer <access_token>` header to all subsequent API requests

4. **User Flow**
   - After successful verification:
     - If `is_new_user: true` → Redirect to profile completion screen (collect name, country, etc.)
     - If `is_new_user: false` → Redirect to dashboard/home screen

5. **Error Handling**
   - Network errors
   - Invalid input (phone number format, OTP length)
   - User-friendly error messages
   - Retry logic with exponential backoff
   - Log errors for debugging

6. **UI/UX Considerations**
   - Auto-focus on OTP input field
   - Auto-submit when 6 digits entered (optional, but convenient)
   - Show countdown timer for OTP expiry
   - Disable "Verify" button until code is 6 digits
   - Show "Resend OTP" option after 30 seconds (if time remaining)
   - Clear sensitive data on logout
   - Works on mobile devices (responsive design)
   - Support Persian/Urdu numbers in OTP input

### Implementation Stack Options

**Option 1: React + Axios**
```javascript
- Create custom hooks: useOtpSend(), useOtpVerify(), useCountdownTimer()
- Create reusable components: OtpPhoneInput, OtpCodeInput, CountdownTimer
- Use axios interceptor to add Authorization header
```

**Option 2: React + Fetch API**
```javascript
- Implement custom fetch wrapper with error handling
- Create hooks for OTP operations
- Manage tokens in context or Redux
```

**Option 3: Vue + Axios**
```javascript
- Create composables for OTP logic
- Create components for each screen
- Use Vue Router for navigation
```

**Option 4: React Native (Mobile)**
```javascript
- Use react-native-async-storage for token storage
- Handle phone number input with react-native-text-input
- Use react-native-countdown-timer for countdown
- Platform-specific error handling
```

### Detailed Requirements

**Phone Input Component:**
- Accept any phone format (with or without +, spaces, dashes, etc.)
- Validate format with regex or library
- Show placeholder like "+92 300 1234567"
- Trim and normalize before sending to API

**OTP Input Component:**
- Accept only 6 digits
- Auto-format with dashes (e.g., "123-456")
- Auto-focus on mount
- Auto-submit when 6 digits entered (optional)
- Clear/reset functionality
- Maximum 3 failed attempts warning (frontend only)

**Countdown Timer:**
- Start at 10 minutes (600 seconds)
- Display as "MM:SS" format
- Update every second
- Stop at 0:00
- Enable "Resend OTP" button at 0:00
- Show warning color when time < 2 minutes

**API Request Interceptor:**
- Add `Authorization: Bearer <access_token>` to all requests
- Handle 401 Unauthorized responses
- Automatically clear tokens and redirect to login on 401
- Add unique request ID for debugging

### Testing Requirements

Test these scenarios:
1. Send OTP with valid phone number
2. Send OTP with SMS method
3. Send OTP with Telegram method
4. Receive OTP and verify with correct code
5. Verify with incorrect code (at least 3 times)
6. Verify with expired OTP
7. Verify with already-used OTP
8. New user registration (is_new_user: true → redirect to profile completion)
9. Existing user login (is_new_user: false → redirect to dashboard)
10. Resend OTP after first attempt fails
11. Verify tokens work for subsequent API calls
12. Handle blocked user account
13. Handle deleted user account
14. Network timeout handling
15. Invalid phone number format
16. OTP code too short

### File Structure Suggestion

```
src/
├── components/
│   ├── Auth/
│   │   ├── OtpPhoneInput.jsx
│   │   ├── OtpCodeInput.jsx
│   │   ├── OtpVerification.jsx
│   │   └── CountdownTimer.jsx
│   └── Common/
│       └── ErrorMessage.jsx
├── hooks/
│   ├── useOtpSend.js
│   ├── useOtpVerify.js
│   ├── useCountdownTimer.js
│   └── useAuth.js
├── services/
│   ├── api.js (axios instance with interceptors)
│   └── authService.js (OTP API calls)
├── context/
│   └── AuthContext.js (token storage and management)
├── pages/
│   ├── OtpPhonePage.jsx
│   ├── OtpVerifyPage.jsx
│   └── ProfileCompletionPage.jsx
└── utils/
    ├── phoneValidator.js
    ├── tokenManager.js
    └── errorMapper.js
```

### Acceptance Criteria

- [ ] User can request OTP with valid phone number
- [ ] User receives success response with expiry time
- [ ] User sees countdown timer
- [ ] User can enter and submit OTP code
- [ ] Tokens are stored securely
- [ ] Tokens are included in subsequent API requests
- [ ] New users are redirected to profile completion
- [ ] Existing users are redirected to dashboard
- [ ] All error cases show user-friendly messages
- [ ] Resend OTP works correctly
- [ ] Countdown timer updates every second
- [ ] Works on mobile devices
- [ ] No sensitive data in console logs
- [ ] Tokens are cleared on logout
- [ ] Auto-submit on 6 digits (if implemented)

### Backend API Reference

See attached `API_DOCUMENTATION_OTP.md` for:
- Complete endpoint documentation
- All error responses
- Request/response examples
- Error message mappings
- Phone normalization rules
- Security best practices

---

## Example Usage

If you give this to Claude/ChatGPT, you can ask follow-up questions like:

- "Generate the React component for OTP phone input"
- "Create the useOtpSend custom hook"
- "Generate the axios configuration with interceptor"
- "Create the countdown timer hook"
- "Generate error handling service"
- "Create the complete React page component"
- "Generate tests for OTP verification component"

---

**Date:** April 3, 2026  
**Backend API Status:** Ready  
**Documentation:** See API_DOCUMENTATION_OTP.md  
**Example Code:** Included in API documentation
