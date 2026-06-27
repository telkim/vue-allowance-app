// [수정 원인] Supabase 키 변수명이 VITE_SUPABASE_PUBLISHABLE_KEY로 변경되어 기존 anon key 기준 초기화가 실패했습니다.
// [해결 방안] publishable key를 기준으로 클라이언트를 생성하고 누락/연결 실패를 안전한 상태 객체로 반환합니다.
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || ''
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || ''

export const supabaseConfig = Object.freeze({
  url: supabaseUrl,
  hasPublishableKey: Boolean(supabasePublishableKey),
  isConfigured: Boolean(supabaseUrl && supabasePublishableKey)
})

export const supabase = supabaseConfig.isConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null

export async function testSupabaseConnection(timeoutMs = 2500) {
  if (!supabase) {
    return {
      ok: false,
      reason: 'missing-env',
      error: 'VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required.'
    }
  }

  try {
    const timeout = new Promise((resolve) => {
      window.setTimeout(
        () =>
          resolve({
            error: new Error('Supabase connection test timed out.')
          }),
        timeoutMs
      )
    })
    const query = supabase.from('missions').select('id').limit(1)
    const { error } = await Promise.race([query, timeout])

    if (error) {
      return {
        ok: false,
        reason: error.message.includes('timed out') ? 'connection-error' : 'query-error',
        error
      }
    }

    return {
      ok: true,
      reason: 'connected',
      error: null
    }
  } catch (error) {
    return {
      ok: false,
      reason: 'connection-error',
      error
    }
  }
}
