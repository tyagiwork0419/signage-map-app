'use client'

import { useState } from 'react'

type UploadResult = {
  path: string
  width: number
  height: number
}

type Props = {
  editToken: string
  onUploaded: (result: UploadResult) => void
}

export default function MapImageUploader({ editToken, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('editToken', editToken)
      formData.append('file', file)
      const res = await fetch('/api/upload-map-image', { method: 'POST', body: formData })
      const body = await res.json()
      if (!res.ok) {
        throw new Error(body.error ?? 'アップロードに失敗しました')
      }
      onUploaded({ path: body.path, width: body.width, height: body.height })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="mb-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">フロアプラン画像</span>
        <input type="file" accept="image/*" onChange={handleChange} disabled={uploading} />
      </label>
      {uploading && <p className="text-sm text-gray-500">アップロード中...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
