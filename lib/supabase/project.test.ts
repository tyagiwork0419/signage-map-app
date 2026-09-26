import { describe, expect, it, vi } from 'vitest'
import { getProjectByViewToken } from './project'

function makeFakeClient(rpcImpl: (fn: string, params: unknown) => Promise<{ data: unknown; error: unknown }>) {
  return { rpc: vi.fn(rpcImpl) } as any
}

describe('getProjectByViewToken', () => {
  it('calls the get_project_by_view_token RPC with the given token', async () => {
    const projectData = {
      id: 'p1',
      name: 'テスト会場',
      map_type: 'image',
      map_image_path: null,
      map_image_width: null,
      map_image_height: null,
      pins: [],
    }
    const client = makeFakeClient(async () => ({ data: projectData, error: null }))

    const result = await getProjectByViewToken(client, 'view-token-123')

    expect(client.rpc).toHaveBeenCalledWith('get_project_by_view_token', {
      token: 'view-token-123',
    })
    expect(result).toEqual(projectData)
  })

  it('throws when the RPC returns an error (e.g. invalid token)', async () => {
    const client = makeFakeClient(async () => ({
      data: null,
      error: { message: 'invalid token' },
    }))

    await expect(getProjectByViewToken(client, 'bad-token')).rejects.toThrow('invalid token')
  })
})
