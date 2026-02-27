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

Includes the `geminiReasoning` field populated after Gemini step completes:

```json
{
  "geminiReasoning": {
    "explainability_summary": "string",
    "interaction_explanations": [
      {
        "drugA": "string",
        "drugB": "string",
        "severity": "low|moderate|high|critical",
        "mechanism": "string",
        "clinical_significance": "string",
        "evidence_basis": "string",
        "uncertain": false
      }
    ],
    "anomaly_explanations": [
      {
        "signal_name": "string",
        "score": 0.75,
        "clinical_meaning": "string",
        "suggested_cause": "string",
        "uncertain": false
      }
    ],
    "interventions": [
      {
        "priority": "urgent|high|medium|low",
        "action_type": "consult_physician|verify_dosage|review_duplication|manual_review|monitor_lab|other",
        "message": "string",
        "related_drugs": ["Drug A"],
        "evidence": "string"
      }
    ],
    "uncertainty_flags": [
      { "field": "string", "reason": "string", "impact": "string" }
    ],
    "ocr_uncertainty_flags": [
      { "text": "string", "confidence": 0.55, "concern": "string" }
    ],
    "entity_reconciliation": {
      "missing_fields": ["string"],
      "ambiguous_entities": ["string"],
      "notes": "string"
    },
    "gemini_status": "success|failed|skipped",
    "reasoning_version": "gemini_reasoning_v1",
    "durationMs": 3200,
    "generatedAt": "ISO8601"
  }
}
```

Full schema: `shared/contracts/gemini-reasoning.schema.json`

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
