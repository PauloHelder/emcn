import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => {
  const mockFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      eq: vi.fn().mockReturnThis(),
    }),
  });

  return {
    createClient: vi.fn().mockReturnValue({
      from: mockFrom,
      rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
        signOut: vi.fn().mockResolvedValue({}),
      },
    }),
  };
});

// Stub environment variables required by supabase.ts
vi.stubEnv('VITE_SUPABASE_URL', 'https://example-supabase-project.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'mock-anon-key-123456');

