import { describe, expect, it, vi } from 'vitest'
import { createProject } from './createProject'

function makeFakeClient(rpcImpl: (fn: string, params: unknown) => Promise<{ data: unknown; error: unknown }>) {
  return { rpc: vi.fn(rpcImpl) } as any
}

describe('createProject', () => {
  it('calls create_project with project_name and project_map_type', async () => {
    const newProject = {
      id: 'p1',
      name: 'テスト会場',
      map_type: 'image' as const,
      view_token: 'v1',
      edit_token: 'e1',
    }
    const client = makeFakeClient(async () => ({ data: newProject, error: null }))

    const result = await createProject(client, 'テスト会場', 'image')

    expect(client.rpc).toHaveBeenCalledWith('create_project', {
      project_name: 'テスト会場',
      project_map_type: 'image',
    })
    expect(result).toEqual(newProject)
  })

  it('throws when the RPC returns an error', async () => {
    const client = makeFakeClient(async () => ({
      data: null,
      error: { message: 'invalid map_type: bogus' },
    }))

    await expect(createProject(client, 'x', 'image')).rejects.toThrow('invalid map_type')
  })
})
