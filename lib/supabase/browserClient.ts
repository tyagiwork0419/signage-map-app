'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

// ブラウザから直接Supabaseへアクセスする用(NEXT_PUBLIC_側の環境変数を使う)。
// 地図のクリック/ドラッグなど重い処理はブラウザ側で完結させ、保存時だけこのクライアントでRPCを呼ぶ。
export function createBrowserSupabaseClient(): SupabaseClient {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Supabase environment variables are not set (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    )
  }
  client = createClient(url, key)
  return client
}
