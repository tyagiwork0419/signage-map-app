'use client'

import { useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, ImageOverlay, Marker, Popup, useMapEvents } from 'react-leaflet'
import {
  imageBounds,
  latLngToPinCoords,
  pinToLatLng,
  type MapType,
  type PinCoords,
} from '@/lib/map/coords'
import { createBrowserSupabaseClient } from '@/lib/supabase/browserClient'
import { upsertPin, PinConflictError } from '@/lib/supabase/pins'

// Leafletのデフォルトマーカー画像はNext.js等のバンドラー環境だとパスが壊れるため、明示的に指定する
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export type MapPin = PinCoords & {
  id: string
  label: string
  updated_at: string
}

type Props = {
  mapType: MapType
  imageUrl?: string | null
  imageWidth?: number
  imageHeight?: number
  initialPins: MapPin[]
  editToken?: string // 指定時のみ編集可能(クリックで追加・ドラッグで移動)
}

function ClickToAddPin({
  mapType,
  onAdd,
}: {
  mapType: MapType
  onAdd: (coords: ReturnType<typeof latLngToPinCoords>) => void
}) {
  useMapEvents({
    click(e) {
      onAdd(latLngToPinCoords(e.latlng, mapType))
    },
  })
  return null
}

export default function ProjectMap({
  mapType,
  imageUrl,
  imageWidth,
  imageHeight,
  initialPins,
  editToken,
}: Props) {
  const [pins, setPins] = useState<MapPin[]>(initialPins)
  const [error, setError] = useState<string | null>(null)
  const editable = !!editToken

  async function handleAdd(coords: ReturnType<typeof latLngToPinCoords>) {
    if (!editToken) return
    const label = window.prompt('看板の名前を入力してください') ?? ''
    if (!label) return
    try {
      const supabase = createBrowserSupabaseClient()
      const saved = await upsertPin(supabase, editToken, {
        id: null,
        label,
        ...coords,
        updatedAt: null,
      })
      setPins((prev) => [...prev, saved as MapPin])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  async function handleDragEnd(pin: MapPin, latlng: L.LatLng) {
    if (!editToken) return
    const coords = latLngToPinCoords(latlng, mapType)
    try {
      const supabase = createBrowserSupabaseClient()
      const saved = await upsertPin(supabase, editToken, {
        id: pin.id,
        label: pin.label,
        ...coords,
        updatedAt: pin.updated_at,
      })
      setPins((prev) => prev.map((p) => (p.id === pin.id ? (saved as MapPin) : p)))
      setError(null)
    } catch (e) {
      if (e instanceof PinConflictError) {
        setError('他の人がこのピンを更新しました。ページを再読み込みしてください。')
      } else {
        setError(e instanceof Error ? e.message : String(e))
      }
    }
  }

  const imageCenter: [number, number] =
    imageWidth && imageHeight ? [-imageHeight / 2, imageWidth / 2] : [0, 0]

  return (
    <div>
      {error && (
        <p className="mb-2 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>
      )}
      <MapContainer
        crs={mapType === 'image' ? L.CRS.Simple : L.CRS.EPSG3857}
        center={mapType === 'geo' ? [35.681236, 139.767125] : imageCenter}
        zoom={mapType === 'image' ? 0 : 15}
        style={{ height: 480, width: '100%' }}
      >
        {mapType === 'geo' && (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
        )}
        {mapType === 'image' && imageUrl && imageWidth && imageHeight && (
          <ImageOverlay url={imageUrl} bounds={imageBounds(imageWidth, imageHeight)} />
        )}
        {editable && <ClickToAddPin mapType={mapType} onAdd={handleAdd} />}
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={pinToLatLng(pin, mapType)}
            draggable={editable}
            eventHandlers={
              editable
                ? {
                    dragend: (e) => handleDragEnd(pin, e.target.getLatLng()),
                  }
                : undefined
            }
          >
            <Popup>{pin.label || '(名称未設定)'}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
