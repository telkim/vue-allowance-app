import { describe, expect, it, vi } from 'vitest'

describe('supabase initialization', () => {
  it('reports a disabled state when environment keys are missing', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '')
    const module = await import('../src/supabase.js?missing')

    expect(module.supabaseConfig.isConfigured).toBe(false)
    expect(module.supabase).toBeNull()

    const result = await module.testSupabaseConnection(50)

    expect(result.ok).toBe(false)
    expect(result.reason).toBe('missing-env')
  })

  it('creates a client and converts connection failures into safe results', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'public-anon-key')
    const module = await import('../src/supabase.js?configured')

    expect(module.supabaseConfig.isConfigured).toBe(true)
    expect(module.supabase).not.toBeNull()

    const result = await module.testSupabaseConnection()

    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/connection-error|query-error/)
    expect(result.error).toBeDefined()
  })
})
