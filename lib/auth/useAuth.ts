// Re-export from the shared AuthContext so every component gets the SAME
// cached user – no repeated /api/auth/me calls on every render.
export { useAuth, AuthProvider } from './AuthContext';
export type { AuthUser } from './AuthContext';

