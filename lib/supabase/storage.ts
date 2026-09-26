// Supabase Storageの公開URLを組み立てる(サーバー/クライアントどちらからも呼べる)。
// ブラウザから読み込む画像なので、必ずNEXT_PUBLIC_側(ブラウザから到達できるURL)を使うこと。
// SUPABASE_URL_INTERNAL(host.docker.internal)を使うとブラウザからは届かないので注意。
export function getMapImagePublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  return `${base}/storage/v1/object/public/map-images/${path}`
}
