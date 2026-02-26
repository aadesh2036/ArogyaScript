# API Endpoint Contract — ArogyaScript

## Base URL
```
http://localhost:5000/api
```

---

## Auth Endpoints

### POST /auth/register
**Body:**
```json
{ "name": "string", "email": "string", "password": "string" }
```
**Response:** `{ "success": true, "token": "jwt_token", "user": { "id", "name", "email" } }`

### POST /auth/login
**Body:**
```json
{ "email": "string", "password": "string" }
```
**Response:** `{ "success": true, "token": "jwt_token", "user": { "id", "name", "email" } }`

---

## Prescription Endpoints

### POST /prescriptions/upload
**Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
**Body:** `image` (file field)
**Response:** See `shared/contracts/example-response.json`

### GET /prescriptions
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "success": true,
  "data": [
    { "prescriptionId": "rx_abc123", "createdAt": "ISO8601", "riskScore": 42, "riskLevel": "moderate", "drugCount": 3 }
  ]
}
```

### GET /prescriptions/:id
**Headers:** `Authorization: Bearer <token>`
**Response:** Full analysis object (same as upload response)

---

## Dashboard Endpoints

### GET /dashboard/stats
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "success": true,
  "data": {
    "totalPrescriptions": 28,
    "avgRiskScore": 35.2,
    "riskDistribution": { "safe": 10, "low": 8, "moderate": 6, "high": 3, "critical": 1 },
    "commonDrugs": [
      { "name": "Amoxicillin", "count": 12 },
      { "name": "Paracetamol", "count": 10 }
    ],
    "interactionsDetected": 15
  }
}
```
