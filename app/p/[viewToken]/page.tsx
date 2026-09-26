import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/serverClient'
import { getProjectByViewToken } from '@/lib/supabase/project'
import ProjectMapClient from '@/components/ProjectMapClient'

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
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-2xl font-bold">{project.name}</h1>
      <p className="mt-1 text-sm text-gray-500">
        地図タイプ: {project.map_type} / 設置場所ピン: {project.pins.length}件
      </p>
      <div className="mt-4">
        <ProjectMapClient mapType={project.map_type} initialPins={project.pins} />
      </div>
    </main>
  )
}
