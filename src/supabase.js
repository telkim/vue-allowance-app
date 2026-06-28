// [수정 원인] Supabase 키 변수명이 VITE_SUPABASE_PUBLISHABLE_KEY로 변경되어 기존 anon key 기준 초기화가 실패했습니다.
// [해결 방안] publishable key를 기준으로 클라이언트를 생성하고 누락/연결 실패를 안전한 상태 객체로 반환합니다.
// [추가] Realtime 채널 구독 및 상태 동기화 기능을 추가하여 데이터 무결성을 보장합니다.
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

let realtimeChannel = null

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

export function subscribeToRealtimeUpdates(tableName, onInsert, onUpdate, onDelete) {
  if (!supabase) {
    console.warn('Supabase not configured, skipping realtime subscription')
    return null
  }

  if (realtimeChannel) {
    realtimeChannel.unsubscribe()
  }

  realtimeChannel = supabase
    .channel(`custom-all-channel`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName
      },
      (payload) => {
        switch (payload.eventType) {
          case 'INSERT':
            if (onInsert) onInsert(payload.new)
            break
          case 'UPDATE':
            if (onUpdate) onUpdate(payload.new)
            break
          case 'DELETE':
            if (onDelete) onDelete(payload.old)
            break
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Realtime subscription active for table: ${tableName}`)
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Realtime subscription error')
      }
    })

  return realtimeChannel
}

export function unsubscribeFromRealtime() {
  if (realtimeChannel) {
    realtimeChannel.unsubscribe()
    realtimeChannel = null
  }
}

export async function syncStateWithSupabase(state, tableName) {
  if (!supabase) {
    console.warn('Supabase not configured, returning local state')
    return state
  }

  try {
    const { data, error } = await supabase.from(tableName).select('*')
    
    if (error) {
      console.error('Sync error:', error)
      return state
    }

    return data || state
  } catch (error) {
    console.error('Sync error:', error)
    return state
  }
}

export async function validateStateIntegrity(localState, tableName) {
  if (!supabase) {
    return { isValid: true, reason: 'Supabase not configured, using local state only' }
  }

  try {
    const { data, error } = await supabase.from(tableName).select('count', { count: 'exact', head: true })
    
    if (error) {
      return { isValid: false, reason: error.message }
    }

    const remoteCount = data || 0
    const localCount = Array.isArray(localState) ? localState.length : 0

    if (remoteCount !== localCount) {
      return {
        isValid: false,
        reason: `State mismatch: remote has ${remoteCount} items, local has ${localCount}`
      }
    }

    return { isValid: true, reason: 'State integrity verified' }
  } catch (error) {
    return { isValid: false, reason: error.message }
  }
}
