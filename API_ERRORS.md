# API Errors

This document tracks known issues and bugs in the Sinclear Beyond PHP API (`api.sinclear.de`).

## Critical: Duplicate Route Registration (2026-06-10)

The API is currently returning `500 Internal Server Error` for multiple endpoints, including:
- `GET /auth/me`
- `POST /auth/otp/request`
- `POST /auth/passkey/login/begin`

### Error Message
```json
{
  "error": "internal_error",
  "data": {
    "error": "internal_error",
    "message": "Cannot register two routes matching \"/api/v1/auth/otp/request\" for method \"POST\""
  }
}
```

### Analysis
This error indicates that in the PHP backend, the route `POST /api/v1/auth/otp/request` is being registered twice in the router configuration. This typically prevents the router from being successfully initialized or executed, leading to a cascade of 500 errors across other endpoints as well.

### Status
- **Reported**: 2026-06-10
- **Severity**: Blocker (Auth is non-functional)
- **Origin**: PHP Backend (`SinclearAPI`)
