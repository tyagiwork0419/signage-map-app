type RpcCapableClient = {
  rpc: (
    fn: string,
    params?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>
}

export type PinInput = {
  id: string | null
  label: string
  x: number | null
  y: number | null
  lat: number | null
  lng: number | null
  updatedAt: string | null // クライアントが最後に見たupdated_at。新規ピンの場合はnull
}

// docs/adr/0004-conflict-handling.md: 楽観的ロックの競合をUI側で区別して扱えるようにする
export class PinConflictError extends Error {}

export async function upsertPin(supabase: RpcCapableClient, editToken: string, pin: PinInput) {
  const { data, error } = await supabase.rpc('upsert_pin_by_edit_token', {
    token: editToken,
    pin_id: pin.id,
    pin_label: pin.label,
    pin_x: pin.x,
    pin_y: pin.y,
    pin_lat: pin.lat,
    pin_lng: pin.lng,
    client_updated_at: pin.updatedAt,
  })
  if (error) {
    if (error.message.includes('conflict')) {
      throw new PinConflictError(error.message)
    }
    throw new Error(error.message)
  }
  return data
}

export async function deletePin(supabase: RpcCapableClient, editToken: string, pinId: string) {
  const { error } = await supabase.rpc('delete_pin_by_edit_token', {
    token: editToken,
    target_pin_id: pinId,
  })
  if (error) {
    throw new Error(error.message)
  }
}
