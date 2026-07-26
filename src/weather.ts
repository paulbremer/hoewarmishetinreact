export type SiteVariant = 'warm' | 'cold'
export type LocationSource = 'device' | 'amsterdam'

export type ResolvedLocation = {
  latitude: number
  longitude: number
  source: LocationSource
}

const AMSTERDAM: ResolvedLocation = {
  latitude: 52.3676,
  longitude: 4.9041,
  source: 'amsterdam',
}

const MET_ENDPOINT = 'https://api.met.no/weatherapi/locationforecast/2.0/compact'

export function getSiteVariant(
  hostname: string,
  developmentOverride?: string | null,
): SiteVariant {
  if (developmentOverride === 'warm' || developmentOverride === 'cold') {
    return developmentOverride
  }

  return hostname.toLowerCase().includes('hoekoudishetvandaag.nl')
    ? 'cold'
    : 'warm'
}

export function getTemperatureLabel(
  temperature: number,
  variant: SiteVariant,
): string {
  if (variant === 'warm') {
    if (temperature < 11) return 'helemaal niet warm'
    if (temperature < 16) return 'niet echt warm'
    if (temperature < 19) return 'beetje warm'
    if (temperature < 24) return 'aardig warm'
    if (temperature < 28) return 'warm'
    if (temperature < 32) return 'erg warm'
    if (temperature < 36) return 'heel erg warm'
    return 'ontzettend warm'
  }

  if (temperature < -15) return 'heel erg koud'
  if (temperature < -10) return 'erg koud'
  if (temperature < 0) return 'goed koud'
  if (temperature < 10) return 'koud'
  if (temperature < 20) return 'beetje koud'
  if (temperature < 30) return 'helemaal niet koud'
  return 'wij zijn het kwik kwijt'
}

function roundCoordinate(coordinate: number): number {
  return Number(coordinate.toFixed(4))
}

export function resolveLocation(): Promise<ResolvedLocation> {
  const geolocation = globalThis.navigator?.geolocation

  if (!geolocation) return Promise.resolve(AMSTERDAM)

  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) {
          resolve(AMSTERDAM)
          return
        }

        resolve({
          latitude: roundCoordinate(coords.latitude),
          longitude: roundCoordinate(coords.longitude),
          source: 'device',
        })
      },
      () => resolve(AMSTERDAM),
      {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 600_000,
      },
    )
  })
}

function getTemperature(data: unknown): number {
  if (!data || typeof data !== 'object') {
    throw new Error('MET response is not an object')
  }

  const properties = (data as { properties?: unknown }).properties
  if (!properties || typeof properties !== 'object') {
    throw new Error('MET response has no properties')
  }

  const timeseries = (properties as { timeseries?: unknown }).timeseries
  if (!Array.isArray(timeseries) || timeseries.length === 0) {
    throw new Error('MET response has no timeseries')
  }

  const first = timeseries[0]
  if (!first || typeof first !== 'object') {
    throw new Error('MET response has an invalid timeseries entry')
  }

  const temperature = (
    first as {
      data?: { instant?: { details?: { air_temperature?: unknown } } }
    }
  ).data?.instant?.details?.air_temperature

  if (typeof temperature !== 'number' || !Number.isFinite(temperature)) {
    throw new Error('MET response has no valid air temperature')
  }

  return temperature
}

export async function fetchTemperature(
  location: ResolvedLocation,
  signal?: AbortSignal,
): Promise<number> {
  const params = new URLSearchParams({
    lat: String(roundCoordinate(location.latitude)),
    lon: String(roundCoordinate(location.longitude)),
  })
  const response = await fetch(`${MET_ENDPOINT}?${params}`, { signal })

  if (!response.ok) {
    throw new Error(`MET request failed with status ${response.status}`)
  }

  return getTemperature(await response.json())
}
