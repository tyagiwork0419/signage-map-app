import { describe, expect, it } from 'vitest'
import { imageBounds, latLngToPinCoords, pinToLatLng } from './coords'

describe('pinToLatLng', () => {
  it('image mode: negates y (pixel-down becomes lat-up) and keeps x as lng', () => {
    expect(pinToLatLng({ x: 100, y: 50, lat: null, lng: null }, 'image')).toEqual([-50, 100])
  })

  it('image mode: throws if x or y is missing', () => {
    expect(() => pinToLatLng({ x: null, y: 50, lat: null, lng: null }, 'image')).toThrow()
    expect(() => pinToLatLng({ x: 100, y: null, lat: null, lng: null }, 'image')).toThrow()
  })

  it('geo mode: passes lat/lng through unchanged', () => {
    expect(pinToLatLng({ x: null, y: null, lat: 35.6, lng: 139.7 }, 'geo')).toEqual([35.6, 139.7])
  })

  it('geo mode: throws if lat or lng is missing', () => {
    expect(() => pinToLatLng({ x: null, y: null, lat: null, lng: 139.7 }, 'geo')).toThrow()
  })
})

describe('latLngToPinCoords', () => {
  it('image mode: converts leaflet [lat,lng] back to pixel x/y, negating lat back to y', () => {
    expect(latLngToPinCoords({ lat: -50, lng: 100 }, 'image')).toEqual({
      x: 100,
      y: 50,
      lat: null,
      lng: null,
    })
  })

  it('geo mode: keeps lat/lng, x/y are null', () => {
    expect(latLngToPinCoords({ lat: 35.6, lng: 139.7 }, 'geo')).toEqual({
      x: null,
      y: null,
      lat: 35.6,
      lng: 139.7,
    })
  })

  it('round-trips through pinToLatLng for image mode', () => {
    const original = { x: 42, y: 17, lat: null, lng: null }
    const [lat, lng] = pinToLatLng(original, 'image')
    expect(latLngToPinCoords({ lat, lng }, 'image')).toEqual(original)
  })
})

describe('imageBounds', () => {
  it('returns bounds with the top-left at [0,0] and bottom-right at [-height, width]', () => {
    expect(imageBounds(800, 600)).toEqual([
      [-600, 0],
      [0, 800],
    ])
  })
})
