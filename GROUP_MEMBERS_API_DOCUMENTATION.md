# Group Members API Documentation

## Overview
The Group Members API allows managing pilgrims' membership in groups. Each pilgrim can only belong to one group at a time, and must be of type PILGRIM.

## Base URL
```
http://localhost:3000/agencies/groups
```

---

## Endpoints

### 1. Add Pilgrim to Group

**Endpoint:** `POST /agencies/groups/:groupId/members`

**Description:** Add a pilgrim to a specific group

**Authentication:** Required (JWT Token)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| groupId | UUID | Yes | The ID of the group |

**Request Body:**
```json
{
  "pilgrim_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Request Body Schema:**
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| pilgrim_id | UUID | Yes | Must be a valid UUID |

**Success Response:**
- **Status Code:** 201 Created / 200 OK
- **Response Body:**
```json
{
  "message": "Pilgrim successfully added to group",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "group_id": "550e8400-e29b-41d4-a716-446655440000",
    "pilgrim_id": "550e8400-e29b-41d4-a716-446655440002",
    "pilgrim_name": "John Doe",
    "joined_at": "2024-04-25T10:30:00Z"
  }
}
```

**Error Responses:**

1. **Group Not Found**
   - Status: 404 Not Found
   ```json
   {
     "statusCode": 404,
     "message": "Group with ID 550e8400-e29b-41d4-a716-446655440000 not found"
   }
   ```

2. **Group Not Found for This Agency**
   - Status: 404 Not Found
   ```json
   {
     "statusCode": 404,
     "message": "Group not found for this agency"
   }
   ```

3. **Pilgrim Not Found**
   - Status: 404 Not Found
   ```json
   {
     "statusCode": 404,
     "message": "Pilgrim with ID 550e8400-e29b-41d4-a716-446655440002 not found"
   }
   ```

4. **User Associated with Pilgrim Not Found**
   - Status: 404 Not Found
   ```json
   {
     "statusCode": 404,
     "message": "User associated with pilgrim not found"
   }
   ```

5. **User is Not of Type PILGRIM**
   - Status: 400 Bad Request
   ```json
   {
     "statusCode": 400,
     "message": "User must be of type PILGRIM to be added to a group"
   }
   ```

6. **Pilgrim Already in Another Group**
   - Status: 400 Bad Request
   ```json
   {
     "statusCode": 400,
     "message": "Pilgrim is already assigned to another group"
   }
   ```

7. **Pilgrim and Group Belong to Different Agencies**
   - Status: 400 Bad Request
   ```json
   {
     "statusCode": 400,
     "message": "Pilgrim must belong to the same agency as the group to be added"
   }
   ```

8. **Invalid UUID Format**
   - Status: 400 Bad Request
   ```json
   {
     "statusCode": 400,
     "message": "Validation failed: pilgrim_id must be a UUID"
   }
   ```

9. **Unauthorized**
   - Status: 401 Unauthorized
   ```json
   {
     "statusCode": 401,
     "message": "Unauthorized"
   }
   ```

**Example Request (cURL):**
```bash
curl -X POST http://localhost:3000/agencies/groups/550e8400-e29b-41d4-a716-446655440000/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "pilgrim_id": "550e8400-e29b-41d4-a716-446655440002"
  }'
```

**Example Request (JavaScript/Fetch):**
```javascript
const groupId = '550e8400-e29b-41d4-a716-446655440000';
const pilgrimId = '550e8400-e29b-41d4-a716-446655440002';
const token = 'YOUR_JWT_TOKEN';

const response = await fetch(
  `http://localhost:3000/agencies/groups/${groupId}/members`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      pilgrim_id: pilgrimId
    })
  }
);

const data = await response.json();
console.log(data);
```

---

### 2. Get All Members in a Group

**Endpoint:** `GET /agencies/groups/:groupId/members`

**Description:** Retrieve all pilgrims in a specific group with their details

**Authentication:** Required (JWT Token)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| groupId | UUID | Yes | The ID of the group |

**Success Response:**
- **Status Code:** 200 OK
- **Response Body:**
```json
{
  "group_id": "550e8400-e29b-41d4-a716-446655440000",
  "group_name": "Hajj Group 2024",
  "group_status": "ACTIVE",
  "members_count": 3,
  "members": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "group_id": "550e8400-e29b-41d4-a716-446655440000",
      "pilgrim_id": "550e8400-e29b-41d4-a716-446655440002",
      "full_name": "John Doe",
      "phone": "+998901234567",
      "email": "john@example.com",
      "agency_id": "550e8400-e29b-41d4-a716-446655440100",
      "joined_at": "2024-04-20T10:30:00Z",
      "created_at": "2024-04-20T10:30:00Z",
      "agency": {
        "id": "550e8400-e29b-41d4-a716-446655440100",
        "name": "Travel Agency 1"
      }
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440002",
      "group_id": "550e8400-e29b-41d4-a716-446655440000",
      "pilgrim_id": "550e8400-e29b-41d4-a716-446655440003",
      "full_name": "Jane Smith",
      "phone": "+998902345678",
      "email": "jane@example.com",
      "agency_id": "550e8400-e29b-41d4-a716-446655440100",
      "joined_at": "2024-04-21T15:45:00Z",
      "created_at": "2024-04-21T15:45:00Z",
      "agency": {
        "id": "550e8400-e29b-41d4-a716-446655440100",
        "name": "Travel Agency 1"
      }
    }
  ]
}
```

**Error Responses:**

1. **Group Not Found**
   - Status: 404 Not Found
   ```json
   {
     "statusCode": 404,
     "message": "Group with ID 550e8400-e29b-41d4-a716-446655440000 not found"
   }
   ```

2. **Group Not Found for This Agency**
   - Status: 404 Not Found
   ```json
   {
     "statusCode": 404,
     "message": "Group not found for this agency"
   }
   ```

3. **Unauthorized**
   - Status: 401 Unauthorized
   ```json
   {
     "statusCode": 401,
     "message": "Unauthorized"
   }
   ```

**Example Request (cURL):**
```bash
curl -X GET http://localhost:3000/agencies/groups/550e8400-e29b-41d4-a716-446655440000/members \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Request (JavaScript/Fetch):**
```javascript
const groupId = '550e8400-e29b-41d4-a716-446655440000';
const token = 'YOUR_JWT_TOKEN';

const response = await fetch(
  `http://localhost:3000/agencies/groups/${groupId}/members`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const data = await response.json();
console.log(data);
```

---

### 3. Remove Pilgrim from Group

**Endpoint:** `DELETE /agencies/groups/:groupId/members/:pilgrimId`

**Description:** Remove a pilgrim from a specific group

**Authentication:** Required (JWT Token)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| groupId | UUID | Yes | The ID of the group |
| pilgrimId | UUID | Yes | The ID of the pilgrim to remove |

**Success Response:**
- **Status Code:** 200 OK
- **Response Body:**
```json
{
  "message": "Pilgrim successfully removed from group",
  "data": {
    "pilgrim_id": "550e8400-e29b-41d4-a716-446655440002",
    "pilgrim_name": "John Doe"
  }
}
```

**Error Responses:**

1. **Group Not Found**
   - Status: 404 Not Found
   ```json
   {
     "statusCode": 404,
     "message": "Group with ID 550e8400-e29b-41d4-a716-446655440000 not found"
   }
   ```

2. **Group Not Found for This Agency**
   - Status: 404 Not Found
   ```json
   {
     "statusCode": 404,
     "message": "Group not found for this agency"
   }
   ```

3. **Pilgrim Not Found**
   - Status: 404 Not Found
   ```json
   {
     "statusCode": 404,
     "message": "Pilgrim with ID 550e8400-e29b-41d4-a716-446655440002 not found"
   }
   ```

4. **Pilgrim Not Assigned to Any Group**
   - Status: 400 Bad Request
   ```json
   {
     "statusCode": 400,
     "message": "Pilgrim is not assigned to any group"
   }
   ```

5. **Pilgrim Not a Member of This Group**
   - Status: 400 Bad Request
   ```json
   {
     "statusCode": 400,
     "message": "Pilgrim is not a member of this group"
   }
   ```

6. **Failed to Remove Pilgrim**
   - Status: 400 Bad Request
   ```json
   {
     "statusCode": 400,
     "message": "Failed to remove pilgrim from group"
   }
   ```

7. **Unauthorized**
   - Status: 401 Unauthorized
   ```json
   {
     "statusCode": 401,
     "message": "Unauthorized"
   }
   ```

**Example Request (cURL):**
```bash
curl -X DELETE http://localhost:3000/agencies/groups/550e8400-e29b-41d4-a716-446655440000/members/550e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Request (JavaScript/Fetch):**
```javascript
const groupId = '550e8400-e29b-41d4-a716-446655440000';
const pilgrimId = '550e8400-e29b-41d4-a716-446655440002';
const token = 'YOUR_JWT_TOKEN';

const response = await fetch(
  `http://localhost:3000/agencies/groups/${groupId}/members/${pilgrimId}`,
  {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const data = await response.json();
console.log(data);
```

---

## Business Rules

### Adding a Pilgrim to a Group

1. **Group Validation:**
   - Group must exist in the database
   - Group must belong to the authenticated user's agency

2. **Pilgrim Validation:**
   - Pilgrim must exist in the database
   - Pilgrim must not be deleted
   - Pilgrim's associated user must exist
   - Pilgrim's user type must be PILGRIM (not ADMIN or AGENCY_USER)

3. **Uniqueness Constraint:**
   - Pilgrim cannot already be in another group
   - Database enforces unique constraint on `pilgrim_id`

4. **Agency Consistency:**
   - Pilgrim and group must belong to the same agency

### Removing a Pilgrim from a Group

1. **Group Validation:**
   - Group must exist and belong to the authenticated user's agency

2. **Pilgrim Validation:**
   - Pilgrim must exist in the database

3. **Membership Validation:**
   - Pilgrim must be assigned to the specified group

### Viewing Group Members

1. **Group Validation:**
   - Group must exist and belong to the authenticated user's agency

2. **Data Returned:**
   - Returns all pilgrims currently in the group
   - Includes pilgrim details (name, phone, email)
   - Includes agency information
   - Sorted by join date (newest first)

---

## Data Models

### GroupMember Object
```json
{
  "id": "UUID",
  "group_id": "UUID",
  "pilgrim_id": "UUID",
  "joined_at": "ISO 8601 DateTime",
  "created_at": "ISO 8601 DateTime"
}
```

### GroupMember with Details Object
```json
{
  "id": "UUID",
  "group_id": "UUID",
  "pilgrim_id": "UUID",
  "full_name": "string",
  "phone": "string",
  "email": "string",
  "agency_id": "UUID",
  "joined_at": "ISO 8601 DateTime",
  "created_at": "ISO 8601 DateTime",
  "agency": {
    "id": "UUID",
    "name": "string"
  }
}
```

---

## Implementation Notes

### Authentication
- All endpoints require a valid JWT token in the `Authorization` header
- Token format: `Authorization: Bearer <JWT_TOKEN>`
- The authenticated user's `agency_id` is extracted from the token to ensure data isolation

### Database Constraints
- **Unique Constraint:** Each pilgrim can only be in one group at a time
  - Implemented via `UNIQUE INDEX idx_group_members_pilgrim_id_unique ON group_members(pilgrim_id)`
- **Foreign Keys:**
  - `group_id` references `groups.id` with CASCADE delete
  - `pilgrim_id` references `pilgrims.id` with CASCADE delete

### Transaction Safety
- All operations (add/remove) use database transactions to ensure data consistency
- If any validation fails, the entire operation is rolled back

### API Response Format
- All successful responses follow the format: `{ message: string, data: object }`
- All error responses follow REST conventions with HTTP status codes
- Error messages are descriptive and include the problematic IDs when applicable

---

## Use Cases

### Use Case 1: Add Multiple Pilgrims to a Group
```javascript
// Array of pilgrim IDs to add
const pilgrimIds = [
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440004'
];

const groupId = '550e8400-e29b-41d4-a716-446655440000';
const token = 'YOUR_JWT_TOKEN';

for (const pilgrimId of pilgrimIds) {
  try {
    const response = await fetch(
      `http://localhost:3000/agencies/groups/${groupId}/members`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pilgrim_id: pilgrimId })
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Added: ${data.data.pilgrim_name}`);
    } else {
      const error = await response.json();
      console.error(`Failed to add pilgrim ${pilgrimId}: ${error.message}`);
    }
  } catch (err) {
    console.error(`Error adding pilgrim ${pilgrimId}:`, err);
  }
}
```

### Use Case 2: Display Group Members in UI
```javascript
const groupId = '550e8400-e29b-41d4-a716-446655440000';
const token = 'YOUR_JWT_TOKEN';

const response = await fetch(
  `http://localhost:3000/agencies/groups/${groupId}/members`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const { members_count, members } = await response.json();

// Display in table
console.log(`Total Members: ${members_count}`);
members.forEach(member => {
  console.log(`${member.full_name} - ${member.phone} (Joined: ${member.joined_at})`);
});
```

### Use Case 3: Move Pilgrim from One Group to Another
```javascript
const pilgrimId = '550e8400-e29b-41d4-a716-446655440002';
const oldGroupId = '550e8400-e29b-41d4-a716-446655440000';
const newGroupId = '550e8400-e29b-41d4-a716-446655440001';
const token = 'YOUR_JWT_TOKEN';

// Step 1: Remove from old group
const removeResponse = await fetch(
  `http://localhost:3000/agencies/groups/${oldGroupId}/members/${pilgrimId}`,
  {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

if (removeResponse.ok) {
  // Step 2: Add to new group
  const addResponse = await fetch(
    `http://localhost:3000/agencies/groups/${newGroupId}/members`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ pilgrim_id: pilgrimId })
    }
  );
  
  if (addResponse.ok) {
    console.log('Pilgrim moved successfully');
  }
}
```

---

## Testing

### Test with Postman
1. Set up environment variables:
   - `base_url`: `http://localhost:3000`
   - `token`: Your JWT token
   - `group_id`: A valid group ID
   - `pilgrim_id`: A valid pilgrim ID

2. Create test requests using the examples above

3. Test error cases:
   - Invalid UUIDs
   - Non-existent group/pilgrim
   - Pilgrim already in another group
   - Unauthorized access

---

## Rate Limiting
Currently, no rate limiting is applied to these endpoints. Contact the API team if you need rate limiting.

---

## Support
For issues or questions about the API, please contact the backend development team.
