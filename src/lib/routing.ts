import type { Place } from '../data/places'
import type { RouteSegment, TravelMode } from '../data/routes'
import { bundledStreetRouteFor } from '../data/street-routes'

export type RouteLegResult = {
  segment: RouteSegment
  distanceMeters: number
  durationSeconds: number
  geometry: Array<[number, number]>
  steps: RouteStep[]
  source: 'live' | 'bundled' | 'fallback'
  fallbackReason?: string
}

export type RouteStep = {
  instruction: string
  distanceMeters: number
  durationSeconds: number
}

export type RouteResult = {
  legs: RouteLegResult[]
  distanceMeters: number
  durationSeconds: number
  fetchedAt: string
}

type OsrmStep = {
  distance: number
  duration: number
  name?: string
  maneuver: {
    type: string
    modifier?: string
    exit?: number
  }
}

type OsrmResponse = {
  code: string
  routes?: Array<{
    distance: number
    duration: number
    geometry: { coordinates: Array<[number, number]> }
    legs?: Array<{ steps?: OsrmStep[] }>
  }>
}

const profileFor = (mode: TravelMode) => mode === 'walking' ? 'routed-foot' : 'routed-car'
const endpointModeFor = (mode: TravelMode) => mode === 'walking' ? 'walking' : 'driving'

function isUsableStreetGeometry(coordinates: Array<[number, number]> | undefined): coordinates is Array<[number, number]> {
  return Boolean(coordinates && coordinates.length > 1)
}

function formatStepInstruction(
  step: OsrmStep,
  mode: TravelMode,
  destination: Place,
) {
  const road = step.name ? ` on ${step.name}` : ''
  const modifier = step.maneuver.modifier?.replace('-', ' ') ?? ''
  const turn = modifier ? ` ${modifier}` : ''

  switch (step.maneuver.type) {
    case 'depart':
      return `Start ${mode === 'walking' ? 'walking' : 'driving'}${road}`
    case 'arrive':
      return `Arrive at ${destination.name}`
    case 'roundabout':
    case 'rotary':
      return `Enter the roundabout${road}${step.maneuver.exit ? ` and take exit ${step.maneuver.exit}` : ''}`
    case 'uturn':
      return `Make a U-turn${road}`
    case 'merge':
      return `Merge${turn}${road}`
    case 'fork':
      return `Keep${turn} at the fork${road}`
    case 'on-ramp':
    case 'off-ramp':
      return `${step.maneuver.type === 'on-ramp' ? 'Take the ramp' : 'Exit the ramp'}${turn}${road}`
    case 'new name':
    case 'continue':
      return `Continue${road}`
    case 'turn':
      return `Turn${turn}${road}`
    default:
      return `Follow the route${road}`
  }
}

function fallbackLeg(segment: RouteSegment, fallbackReason = 'Live routing unavailable'): RouteLegResult {
  return {
    segment,
    // Never use a straight line as a walking route. It is an aerial distance,
    // and displaying it would imply street access that has not been verified.
    distanceMeters: 0,
    durationSeconds: 0,
    geometry: [],
    steps: [],
    source: 'fallback',
    fallbackReason,
  }
}

function bundledLeg(segment: RouteSegment): RouteLegResult {
  const route = bundledStreetRouteFor(segment)
  if (!route) return fallbackLeg(segment, 'No bundled street route available')
  return {
    segment,
    distanceMeters: route.distanceMeters,
    durationSeconds: route.durationSeconds,
    geometry: route.geometry,
    steps: [],
    source: 'bundled',
  }
}

async function fetchLeg(from: Place, to: Place, segment: RouteSegment): Promise<RouteLegResult> {
  const profile = profileFor(segment.mode)
  const endpointMode = endpointModeFor(segment.mode)
  const url = `https://routing.openstreetmap.de/${profile}/route/v1/${endpointMode}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&steps=true&geometries=geojson`
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(12000) })
    if (!response.ok) throw new Error(`Routing request failed: ${response.status}`)
    const payload = await response.json() as OsrmResponse
    const route = payload.routes?.[0]
    if (payload.code !== 'Ok' || !route) throw new Error('No route returned')
    if (!isUsableStreetGeometry(route.geometry.coordinates)) throw new Error('No street geometry returned')
    const steps = route.legs?.flatMap((leg) => leg.steps ?? []).map((step) => ({
      instruction: formatStepInstruction(step, segment.mode, to),
      distanceMeters: step.distance,
      durationSeconds: step.duration,
    })) ?? []
    return {
      segment,
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      geometry: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      steps,
      source: 'live',
    }
  } catch (error: unknown) {
    return bundledStreetRouteFor(segment)
      ? bundledLeg(segment)
      : fallbackLeg(segment, error instanceof Error ? error.message : 'Live routing unavailable')
  }
}

export function buildFallbackTripRoute(segments: RouteSegment[], places: Place[]): RouteResult {
  const legs = segments.map((segment) => {
    const from = places.find((place) => place.id === segment.from)
    const to = places.find((place) => place.id === segment.to)
    if (!from || !to) throw new Error(`Missing place for ${segment.from} -> ${segment.to}`)
    return bundledLeg(segment)
  })
  return {
    legs,
    distanceMeters: legs.reduce((total, leg) => total + leg.distanceMeters, 0),
    durationSeconds: legs.reduce((total, leg) => total + leg.durationSeconds, 0),
    fetchedAt: new Date().toISOString(),
  }
}

export async function fetchTripRoute(segments: RouteSegment[], places: Place[]): Promise<RouteResult> {
  const legs = await Promise.all(segments.map((segment) => {
    const from = places.find((place) => place.id === segment.from)
    const to = places.find((place) => place.id === segment.to)
    if (!from || !to) throw new Error(`Missing place for ${segment.from} -> ${segment.to}`)
    return fetchLeg(from, to, segment)
  }))
  return {
    legs,
    distanceMeters: legs.reduce((total, leg) => total + leg.distanceMeters, 0),
    durationSeconds: legs.reduce((total, leg) => total + leg.durationSeconds, 0),
    fetchedAt: new Date().toISOString(),
  }
}

export function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`
}

export function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`
}
