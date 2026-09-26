'use client'

import { useState } from 'react'
import ProjectMapClient from './ProjectMapClient'
import MapImageUploader from './MapImageUploader'
import { getMapImagePublicUrl } from '@/lib/supabase/storage'
import type { MapPin } from './ProjectMap'

type Props = {
  mapType: 'image' | 'geo'
  initialPins: MapPin[]
  initialImagePath: string | null
  initialImageWidth: number | null
  initialImageHeight: number | null
  editToken: string
}

export default function ProjectEditor({
  mapType,
  initialPins,
  initialImagePath,
  initialImageWidth,
  initialImageHeight,
  editToken,
}: Props) {
  const [imagePath, setImagePath] = useState(initialImagePath)
  const [imageWidth, setImageWidth] = useState(initialImageWidth)
  const [imageHeight, setImageHeight] = useState(initialImageHeight)

  return (
    <div>
      {mapType === 'image' && (
        <MapImageUploader
          editToken={editToken}
          onUploaded={(result) => {
            setImagePath(result.path)
            setImageWidth(result.width)
            setImageHeight(result.height)
          }}
        />
      )}
      <ProjectMapClient
        mapType={mapType}
        initialPins={initialPins}
        editToken={editToken}
        imageUrl={imagePath ? getMapImagePublicUrl(imagePath) : null}
        imageWidth={imageWidth ?? undefined}
        imageHeight={imageHeight ?? undefined}
      />
    </div>
  )
}
