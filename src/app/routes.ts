/**
 * Every route path in one place.
 *
 * Components link via these constants rather than string literals, so renaming
 * a URL is a single edit and a typo is a type error instead of a dead link
 * that only shows up in manual testing.
 */
export const ROUTES = {
  home: '/',
  masterLogin: '/',
  masterForgotPassword: '/master/forgot-password',
  masterResetPassword: '/master/reset-password',
  masterDashboard: '/master/dashboard',
  createTenant: '/master/tenants/new',
  tenantLogin: '/t/:tenantCode/login',
  tenantDashboard: '/t/:tenantCode/dashboard',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
