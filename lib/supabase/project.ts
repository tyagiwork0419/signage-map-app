export type Pin = {
  id: string
  label: string
  x: number | null
  y: number | null
  lat: number | null
  lng: number | null
  updated_at: string
}

export type ProjectData = {
  id: string
  name: string
  map_type: 'image' | 'geo'
  map_image_path: string | null
  pins: Pin[]
}

// SupabaseClientの型に直接依存させず、rpc()だけを持つ最小限の形にしておく
// (テストでの差し替えを簡単にするため)
type RpcCapableClient = {
  rpc: (fn: string, params?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
}

export async function getProjectByViewToken(
  supabase: RpcCapableClient,
  token: string
): Promise<ProjectData> {
  const { data, error } = await supabase.rpc('get_project_by_view_token', { token })
  if (error) {
    throw new Error(error.message)
  }
  return data as ProjectData
}
