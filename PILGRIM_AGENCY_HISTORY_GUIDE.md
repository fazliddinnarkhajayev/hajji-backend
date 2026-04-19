# Pilgrim Agency History - Implementation Guide

## Overview
This document describes the implementation of pilgrim-agency history tracking system. When admins set or remove a pilgrim from an agency, the action is logged with complete audit trail information.

## Database Schema

### Table: `pilgrim_agency_history`
Records all pilgrim-agency assignments and removals with audit information.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| pilgrim_id | UUID | Reference to pilgrim |
| agency_id | UUID | Reference to agency (nullable for REMOVE actions) |
| admin_id | UUID | Reference to admin who performed the action |
| action | ENUM('SET', 'REMOVE') | Type of action performed |
| notes | TEXT | Optional notes/remarks |
| created_at | TIMESTAMP | When the action was performed |

### Foreign Keys
- `pilgrim_id` → `pilgrims.id` (CASCADE)
- `agency_id` → `agencies.id` (SET NULL)
- `admin_id` → `admins.id` (CASCADE)

### Indexes
- pilgrim_id
- agency_id
- admin_id
- created_at

## API Endpoints

### 1. Set Pilgrim Agency
**Endpoint:** `POST /pilgrims/:id/agency/:agencyId`

**Description:** Assigns a pilgrim to an agency and creates a history log entry.

**Parameters:**
- `id` (path) - Pilgrim ID
- `agencyId` (path) - Agency ID to assign

**Request Body:**
```json
{
  "notes": "Assigned for Hajj season 2024"
}
```

**Response:**
```json
{
  "id": "uuid",
  "full_name": "John Doe",
  "agency_id": "uuid",
  "created_at": "2024-04-19T10:00:00Z",
  "updated_at": "2024-04-19T10:00:00Z"
}
```

**Status Code:** 201 Created

---

### 2. Remove Pilgrim from Agency
**Endpoint:** `DELETE /pilgrims/:id/agency`

**Description:** Removes a pilgrim from their assigned agency and logs the action.

**Parameters:**
- `id` (path) - Pilgrim ID

**Request Body:**
```json
{
  "notes": "Pilgrimage completed"
}
```

**Response:**
```json
{
  "id": "uuid",
  "full_name": "John Doe",
  "agency_id": null,
  "created_at": "2024-04-19T10:00:00Z",
  "updated_at": "2024-04-19T10:00:00Z"
}
```

**Status Code:** 200 OK

---

### 3. Get Agency History for Pilgrim
**Endpoint:** `GET /pilgrims/:id/agency-history`

**Description:** Retrieves the complete history of agency assignments/removals for a pilgrim.

**Parameters:**
- `id` (path) - Pilgrim ID
- `limit` (query, optional) - Number of records to return (default: 50)
- `offset` (query, optional) - Number of records to skip (default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "pilgrim_id": "uuid",
      "agency_id": "uuid",
      "admin_id": "uuid",
      "action": "SET",
      "notes": "Initial assignment",
      "created_at": "2024-04-19T10:00:00Z",
      "pilgrim": {
        "id": "uuid",
        "full_name": "John Doe"
      },
      "agency": {
        "id": "uuid",
        "name": "Agency Name"
      },
      "admin": {
        "id": "uuid",
        "first_name": "Admin",
        "last_name": "User"
      }
    },
    {
      "id": "uuid",
      "pilgrim_id": "uuid",
      "agency_id": "uuid",
      "admin_id": "uuid",
      "action": "REMOVE",
      "notes": "Removed due to request",
      "created_at": "2024-04-19T11:00:00Z",
      "pilgrim": {
        "id": "uuid",
        "full_name": "John Doe"
      },
      "agency": {
        "id": "uuid",
        "name": "Agency Name"
      },
      "admin": {
        "id": "uuid",
        "first_name": "Admin",
        "last_name": "User"
      }
    }
  ],
  "total": 2
}
```

**Status Code:** 200 OK

---

## Service Methods

### PilgrimsService

#### `setAgency(pilgrimId, agencyId, adminId, notes?): Promise<Pilgrim>`
Sets a pilgrim's agency and logs the action.

**Parameters:**
- `pilgrimId`: UUID of the pilgrim
- `agencyId`: UUID of the agency to assign
- `adminId`: UUID of the admin performing the action
- `notes`: Optional notes about the assignment

**Returns:** Updated pilgrim object

**Throws:** NotFoundException if pilgrim doesn't exist

---

#### `removeAgency(pilgrimId, adminId, notes?): Promise<Pilgrim>`
Removes a pilgrim's agency and logs the action.

**Parameters:**
- `pilgrimId`: UUID of the pilgrim
- `adminId`: UUID of the admin performing the action
- `notes`: Optional notes about the removal

**Returns:** Updated pilgrim object with agency_id set to null

**Throws:** NotFoundException if pilgrim doesn't exist

---

#### `getAgencyHistory(pilgrimId, limit?, offset?): Promise<{data, total}>`
Retrieves agency history for a pilgrim with pagination.

**Parameters:**
- `pilgrimId`: UUID of the pilgrim
- `limit`: Maximum records to return (default: 50)
- `offset`: Records to skip (default: 0)

**Returns:** Object containing history records and total count

**Throws:** NotFoundException if pilgrim doesn't exist

---

## DAO Methods

### PilgrimAgencyHistoryDao

#### `createHistory(data, trx?): Promise<PilgrimAgencyHistory>`
Creates a new history entry.

---

#### `getHistoryByPilgrimId(pilgrimId, limit?, offset?, trx?): Promise<PilgrimAgencyHistory[]>`
Retrieves history for a specific pilgrim.

---

#### `getHistoryByAgencyId(agencyId, limit?, offset?, trx?): Promise<PilgrimAgencyHistory[]>`
Retrieves history for a specific agency.

---

#### `getHistoryByAdminId(adminId, limit?, offset?, trx?): Promise<PilgrimAgencyHistory[]>`
Retrieves history of actions by a specific admin.

---

#### `getHistoryWithJoins(pilgrimId, limit?, offset?, trx?): Promise<PilgrimAgencyHistory[]>`
Retrieves history with joined pilgrim, agency, and admin details.

---

#### `countHistoryByPilgrimId(pilgrimId, trx?): Promise<number>`
Counts total history records for a pilgrim.

---

## Database Migration

### Migration File: `020_create_pilgrim_agency_history_table.ts`

Creates the pilgrim_agency_history table with proper indexes and foreign key constraints.

**To Run:**
```bash
npm run migrate:up
# or
knex migrate:up --env development
```

---

## Files Modified/Created

### Created:
1. `src/core/database/migrations/020_create_pilgrim_agency_history_table.ts`
2. `src/shared/dao/pilgrim-agency-history.dao.ts`
3. `src/modules/pilgrims/dto/agency.dto.ts`

### Modified:
1. `src/shared/constants/table-names.ts` - Added PILGRIM_AGENCY_HISTORY
2. `src/modules/pilgrims/pilgrims.service.ts` - Added agency management methods
3. `src/modules/pilgrims/pilgrims.controller.ts` - Added new endpoints
4. `src/shared/shared.module.ts` - Exported PilgrimAgencyHistoryDao
5. `src/modules/pilgrims/pilgrims.module.ts` - Added PilgrimAgencyHistoryDao provider

---

## Usage Examples

### Setting Agency
```bash
curl -X POST http://localhost:3000/pilgrims/{pilgrimId}/agency/{agencyId} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Assigned for 2024 season"}'
```

### Removing Agency
```bash
curl -X DELETE http://localhost:3000/pilgrims/{pilgrimId}/agency \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Journey completed"}'
```

### Getting History
```bash
curl -X GET "http://localhost:3000/pilgrims/{pilgrimId}/agency-history?limit=20&offset=0" \
  -H "Authorization: Bearer {token}"
```

---

## Features

✅ Complete audit trail for all agency assignments and removals
✅ Records who performed the action (admin_id)
✅ Records when the action was performed (created_at)
✅ Supports optional notes for context
✅ Handles both SET and REMOVE actions
✅ Includes related data (pilgrim, agency, admin details)
✅ Pagination support for history retrieval
✅ Database constraints ensure data integrity
✅ Foreign key cascades for cleanup

---

## Notes

- All timestamps are in UTC
- The `admin_id` is automatically captured from the JWT token
- History records cannot be modified or deleted (immutable audit trail)
- When an agency is deleted, the `agency_id` in history becomes NULL but the record remains
- When a pilgrim or admin is deleted, their history records are also deleted (CASCADE)
