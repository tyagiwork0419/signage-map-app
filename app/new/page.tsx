'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'
import { createProject } from '@/lib/supabase/createProject'

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [mapType, setMapType] = useState<'image' | 'geo'>('image')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('案件名を入力してください。')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const supabase = createBrowserSupabaseClient()
      const project = await createProject(supabase, name.trim(), mapType)
      router.push(`/p/${project.view_token}/edit/${project.edit_token}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-bold">新しい案件を作成</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">案件名</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
            placeholder="例: 〇〇展示会場"
          />
        </label>

        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm font-medium">地図の種類</legend>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mapType"
              value="image"
              checked={mapType === 'image'}
              onChange={() => setMapType('image')}
            />
            会場のフロアプラン画像をアップロードする
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mapType"
              value="geo"
              checked={mapType === 'geo'}
              onChange={() => setMapType('geo')}
            />
            実際の地図(住所・地図タイル)を使う
          </label>
        </fieldset>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? '作成中...' : '作成する'}
        </button>
      </form>
    </main>
  )
}
