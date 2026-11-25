/**
 * The backend's wire contract, mirrored by hand.
 *
 * These are copied from `backend/src`, not imported: the three projects are
 * independent repos with no npm workspace, so there is nothing to import
 * from. If the API and this file drift, the fix is to extract a shared
 * `packages/api-types` package - see the README's open decisions.
 *
 * Deliberate difference from the server types: timestamps are `string` here.
 * They are `Date` in the backend's own types, but they cross the wire as ISO
 * strings and nothing in this app revives them.
 */

/** Mirrors `USER_ROLES` in backend/src/modules/users/users.types.ts. */
export const USER_ROLES = ['doctor', 'patient', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/**
 * Every error response from the API has this shape - there is no
 * `{success, data}` envelope on success responses, only this on failures.
 * Mirrors backend/src/http/middleware/errorHandler.ts.
 */
export interface ApiErrorBody {
  error: string;
  code: ApiErrorCode;
  requestId?: string;
  /**
   * `unknown` rather than `ValidationErrorDetails | unknown` - the union
   * collapses to `unknown` anyway. Narrow it with the type guard in
   * shared/api/errors.ts; only VALIDATION_ERROR responses carry a known shape.
   */
  details?: unknown;
}

/** Mirrors the ErrorCode union in backend/src/http/errors.ts. */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

/** Payload carried by 400 VALIDATION_ERROR responses. */
export interface ValidationErrorDetails {
  source: 'body' | 'query' | 'params';
  issues: { path: string; message: string; code: string }[];
}

/** Offset pagination, as returned by GET /api/users. */
export interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

/** GET /api/health */
export interface HealthResponse {
  status: 'ok' | 'degraded';
  db: 'up' | 'down';
  uptimeSeconds: number;
  pool?: { total: number; idle: number; waiting: number };
}

export interface HospitalTenant {
  id: string;
  tenant_name: string;
  tenant_code: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

