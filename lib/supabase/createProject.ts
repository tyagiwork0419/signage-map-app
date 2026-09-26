type RpcCapableClient = {
  rpc: (
    fn: string,
    params?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>
}

export type NewProject = {
  id: string
  name: string
  map_type: 'image' | 'geo'
  view_token: string
  edit_token: string
}

// 案件作成は「ログイン無し」の方針(docs/adr/0003-token-based-access.md)により、
// URLを知っていれば誰でも呼べる操作。一般公開せず運用者だけが使う想定(既知の制約)。
export async function createProject(
  supabase: RpcCapableClient,
  name: string,
  mapType: 'image' | 'geo'
): Promise<NewProject> {
  const { data, error } = await supabase.rpc('create_project', {
    project_name: name,
    project_map_type: mapType,
  })
  if (error) {
    throw new Error(error.message)
  }
  return data as NewProject
}
