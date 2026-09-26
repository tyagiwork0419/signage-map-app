import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/serverClient'
import { getProjectByViewToken } from '@/lib/supabase/project'

// Next.js 16: paramsはPromiseなので必ずawaitする
export default async function ProjectViewPage({
  params,
}: {
  params: Promise<{ viewToken: string }>
}) {
  const { viewToken } = await params

  const supabase = createServerSupabaseClient()

  let project
  try {
    project = await getProjectByViewToken(supabase, viewToken)
  } catch {
    notFound()
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">{project.name}</h1>
      <p className="mt-1 text-sm text-gray-500">地図タイプ: {project.map_type}</p>
      <p className="mt-4">設置場所ピン: {project.pins.length}件</p>
      <ul className="mt-2 list-disc pl-5">
        {project.pins.map((pin) => (
          <li key={pin.id}>{pin.label || '(名称未設定)'}</li>
        ))}
      </ul>
    </main>
  )
}
