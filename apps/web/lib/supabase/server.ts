// Supabase server client has been removed.
// Auth is now handled via custom JWT + NestJS API.
// This file is kept as a placeholder to prevent import errors.

export function createServerClient() {
  throw new Error(
    'Supabase server client has been removed. Use NestJS API with JWT auth instead.',
  );
}
