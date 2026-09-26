import { describe, expect, it, vi } from 'vitest'
import { deletePin, PinConflictError, upsertPin } from './pins'

function makeFakeClient(rpcImpl: (fn: string, params: unknown) => Promise<{ data: unknown; error: unknown }>) {
  return { rpc: vi.fn(rpcImpl) } as any
}

describe('upsertPin', () => {
  it('calls upsert_pin_by_edit_token with the expected snake_case params', async () => {
    const client = makeFakeClient(async () => ({ data: { id: 'pin-1' }, error: null }))

    await upsertPin(client, 'edit-token', {
      id: 'pin-1',
      label: '企業A',
      x: 10,
      y: 20,
      lat: null,
      lng: null,
      updatedAt: '2026-01-01T00:00:00Z',
    })

    expect(client.rpc).toHaveBeenCalledWith('upsert_pin_by_edit_token', {
      token: 'edit-token',
      pin_id: 'pin-1',
      pin_label: '企業A',
      pin_x: 10,
      pin_y: 20,
      pin_lat: null,
      pin_lng: null,
      client_updated_at: '2026-01-01T00:00:00Z',
    })
  })

  it('throws PinConflictError when the RPC reports a conflict', async () => {
    const client = makeFakeClient(async () => ({
      data: null,
      error: { message: 'conflict: pin was updated by someone else' },
    }))

    await expect(
      upsertPin(client, 'edit-token', {
        id: 'pin-1',
        label: 'x',
        x: 0,
        y: 0,
        lat: null,
        lng: null,
        updatedAt: '2026-01-01T00:00:00Z',
      })
    ).rejects.toBeInstanceOf(PinConflictError)
  })

  it('throws a plain Error for other RPC errors (e.g. invalid token)', async () => {
    const client = makeFakeClient(async () => ({
      data: null,
      error: { message: 'invalid token' },
    }))

    const promise = upsertPin(client, 'bad-token', {
      id: null,
      label: 'x',
      x: 0,
      y: 0,
      lat: null,
      lng: null,
      updatedAt: null,
    })
    await expect(promise).rejects.toThrow('invalid token')
    await expect(promise).rejects.not.toBeInstanceOf(PinConflictError)
  })
})

describe('deletePin', () => {
  it('calls delete_pin_by_edit_token with the expected params', async () => {
    const client = makeFakeClient(async () => ({ data: null, error: null }))

    await deletePin(client, 'edit-token', 'pin-1')

    expect(client.rpc).toHaveBeenCalledWith('delete_pin_by_edit_token', {
      token: 'edit-token',
      target_pin_id: 'pin-1',
    })
  })
})
