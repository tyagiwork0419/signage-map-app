import { createClient } from '@supabase/supabase-js'

// Next.jsサーバー側(Dockerコンテナ内)から、ホスト側で動くSupabaseスタックへ
// host.docker.internal 経由でアクセスする用。ブラウザからの直接アクセスには使わない。
export function createServerSupabaseClient() {
  const url = process.env.SUPABASE_URL_INTERNAL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase environment variables are not set (SUPABASE_URL_INTERNAL / SUPABASE_ANON_KEY)')
  }
  return createClient(url, key)
}
