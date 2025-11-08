import { useMemo } from 'react'

const EARTH_RADIUS_KM = 6371
const KM_TO_MILES = 0.621371

function toRadians(value) {
  return (value * Math.PI) / 180
}

function haversineDistanceKm(start, end) {
  const latDiff = toRadians(end.lat - start.lat)
  const lngDiff = toRadians(end.lng - start.lng)

  const a =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(toRadians(start.lat)) *
      Math.cos(toRadians(end.lat)) *
      Math.sin(lngDiff / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_KM * c
}

function formatDistance({ km, locale = 'en-US' }) {
  if (km == null) {
    return null
  }

  const prefersMiles = ['en-US', 'en-GB'].includes(locale)

  if (prefersMiles) {
    const miles = km * KM_TO_MILES
    const formatted = miles.toLocaleString(locale, {
      maximumFractionDigits: miles < 10 ? 1 : 0,
    })
    return `${formatted} mi away`
  }

  const formatted = km.toLocaleString(locale, {
    maximumFractionDigits: km < 10 ? 1 : 0,
  })
  return `${formatted} km away`
}

export default function useGeoDistance(location, viewerCoords) {
  return useMemo(() => {
    if (
      !location ||
      typeof location.lat !== 'number' ||
      typeof location.lng !== 'number' ||
      !viewerCoords
    ) {
      return { distanceKm: null, distanceLabel: null }
    }

    const distanceKm = haversineDistanceKm(viewerCoords, location)
    const distanceLabel = formatDistance({
      km: distanceKm,
      locale: navigator.language || 'en-US',
    })

    return { distanceKm, distanceLabel }
  }, [location, viewerCoords])
}

