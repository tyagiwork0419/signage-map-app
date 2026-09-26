'use client'

// LeafletはSSR(window/documentへの参照)ができないため、next/dynamicでssr:falseにして読み込む
import dynamic from 'next/dynamic'

const ProjectMap = dynamic(() => import('./ProjectMap'), {
  ssr: false,
  loading: () => <p className="text-sm text-gray-500">地図を読み込み中...</p>,
})

export default ProjectMap
