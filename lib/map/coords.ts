// 座標変換ヘルパー。docs/adr/0002-dual-map-mode.md 参照。
//
// pins.x/y: 画像モード(map_type='image')のピクセル座標。画像の慣習通り、Yは下向きが正(上端が0)。
// pins.lat/lng: 実地図モード(map_type='geo')の緯度経度。
//
// react-leafletでは、地図モードに関わらず position/click は常に [lat, lng] 形式で扱う。
// CRS.Simple(画像モード)ではLeafletの緯度(Y)は上向きが正のため、
// 画像のピクセルY(下向きが正)とは符号が逆になる点に注意する。

export type MapType = 'image' | 'geo'

export type PinCoords = {
  x: number | null
  y: number | null
  lat: number | null
  lng: number | null
}

export function pinToLatLng(pin: PinCoords, mapType: MapType): [number, number] {
  if (mapType === 'image') {
    if (pin.x == null || pin.y == null) {
      throw new Error('image mode pin requires x and y')
    }
    return [-pin.y, pin.x]
  }
  if (pin.lat == null || pin.lng == null) {
    throw new Error('geo mode pin requires lat and lng')
  }
  return [pin.lat, pin.lng]
}

export function latLngToPinCoords(
  latLng: { lat: number; lng: number },
  mapType: MapType
): Pick<PinCoords, 'x' | 'y' | 'lat' | 'lng'> {
  if (mapType === 'image') {
    return { x: latLng.lng, y: -latLng.lat, lat: null, lng: null }
  }
  return { x: null, y: null, lat: latLng.lat, lng: latLng.lng }
}

// ImageOverlayのbounds([[南端,西端],[北端,東端]])を、画像の実ピクセルサイズから計算する
export function imageBounds(
  width: number,
  height: number
): [[number, number], [number, number]] {
  return [
    [-height, 0],
    [0, width],
  ]
}
