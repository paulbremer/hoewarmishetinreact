import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchTemperature,
  getSiteVariant,
  getTemperatureLabel,
  resolveLocation,
} from './weather'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getTemperatureLabel', () => {
  it.each([
    [10.999, 'helemaal niet warm'],
    [11, 'niet echt warm'],
    [11.001, 'niet echt warm'],
    [15.999, 'niet echt warm'],
    [16, 'beetje warm'],
    [16.001, 'beetje warm'],
    [18.999, 'beetje warm'],
    [19, 'aardig warm'],
    [19.001, 'aardig warm'],
    [23.999, 'aardig warm'],
    [24, 'warm'],
    [24.001, 'warm'],
    [27.999, 'warm'],
    [28, 'erg warm'],
    [28.001, 'erg warm'],
    [31.999, 'erg warm'],
    [32, 'heel erg warm'],
    [32.001, 'heel erg warm'],
    [35.999, 'heel erg warm'],
    [36, 'ontzettend warm'],
    [36.001, 'ontzettend warm'],
  ])('keeps the warm boundary for %s°C', (temperature, label) => {
    expect(getTemperatureLabel(temperature, 'warm')).toBe(label)
  })

  it.each([
    [-15.001, 'heel erg koud'],
    [-15, 'erg koud'],
    [-14.999, 'erg koud'],
    [-10.001, 'erg koud'],
    [-10, 'goed koud'],
    [-9.999, 'goed koud'],
    [-0.001, 'goed koud'],
    [0, 'koud'],
    [0.001, 'koud'],
    [9.999, 'koud'],
    [10, 'beetje koud'],
    [10.001, 'beetje koud'],
    [19.999, 'beetje koud'],
    [20, 'helemaal niet koud'],
    [20.001, 'helemaal niet koud'],
    [29.999, 'helemaal niet koud'],
    [30, 'wij zijn het kwik kwijt'],
    [30.001, 'wij zijn het kwik kwijt'],
  ])('keeps the cold boundary for %s°C', (temperature, label) => {
    expect(getTemperatureLabel(temperature, 'cold')).toBe(label)
  })

  it('classifies raw temperatures before display rounding', () => {
    expect(Math.floor(10.9)).toBe(10)
    expect(getTemperatureLabel(10.9, 'warm')).toBe('helemaal niet warm')
  })
})

describe('getSiteVariant', () => {
  it('selects cold only for the cold hostname', () => {
    expect(getSiteVariant('hoekoudishetvandaag.nl')).toBe('cold')
    expect(getSiteVariant('www.hoekoudishetvandaag.nl')).toBe('cold')
    expect(getSiteVariant('hoewarmishetvandaag.nl')).toBe('warm')
    expect(getSiteVariant('localhost')).toBe('warm')
  })

  it('allows a development override only when passed in', () => {
    expect(getSiteVariant('localhost', 'cold')).toBe('cold')
    expect(getSiteVariant('hoekoudishetvandaag.nl', 'warm')).toBe('warm')
  })
})

describe('resolveLocation', () => {
  it('rounds a device location and uses the requested options', async () => {
    let options: PositionOptions | undefined
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (
          success: PositionCallback,
          _error: PositionErrorCallback,
          positionOptions: PositionOptions,
        ) => {
          options = positionOptions
          success({
            coords: { latitude: 52.367612, longitude: 4.904156 },
          } as GeolocationPosition)
        },
      },
    } as Navigator)

    await expect(resolveLocation()).resolves.toEqual({
      latitude: 52.3676,
      longitude: 4.9042,
      source: 'device',
    })
    expect(options).toEqual({
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 600_000,
    })
  })

  it.each(['missing geolocation', 'geolocation error'])(
    'falls back to Amsterdam for %s',
    async (caseName) => {
      if (caseName === 'missing geolocation') {
        vi.stubGlobal('navigator', {})
      } else {
        vi.stubGlobal('navigator', {
          geolocation: {
            getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) =>
              error({} as GeolocationPositionError),
          },
        } as Navigator)
      }

      await expect(resolveLocation()).resolves.toEqual({
        latitude: 52.3676,
        longitude: 4.9041,
        source: 'amsterdam',
      })
    },
  )
})

describe('fetchTemperature', () => {
  it('uses rounded coordinates and the first MET temperature', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          properties: {
            timeseries: [
              { data: { instant: { details: { air_temperature: 21.8 } } } },
              { data: { instant: { details: { air_temperature: 999 } } } },
            ],
          },
        }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      fetchTemperature({ latitude: 52.367612, longitude: 4.904156, source: 'device' }),
    ).resolves.toBe(21.8)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=52.3676&lon=4.9042',
      { signal: undefined },
    )
  })

  it.each([
    [new Response('', { status: 429 }), 'status 429'],
    [new Response(JSON.stringify({ properties: { timeseries: [] } })), 'no timeseries'],
    [new Response(JSON.stringify({ properties: { timeseries: [{}] } })), 'no valid air temperature'],
  ])('rejects invalid MET responses (%s)', async (response, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

    await expect(
      fetchTemperature({ latitude: 52.3676, longitude: 4.9041, source: 'amsterdam' }),
    ).rejects.toThrow(message)
  })

  it('passes an abort signal through to fetch', async () => {
    const controller = new AbortController()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          properties: {
            timeseries: [{ data: { instant: { details: { air_temperature: 1 } } } }],
          },
        }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await fetchTemperature(
      { latitude: 52.3676, longitude: 4.9041, source: 'amsterdam' },
      controller.signal,
    )
    controller.abort()

    expect(fetchMock.mock.calls[0]?.[1]).toEqual({ signal: controller.signal })
    expect(controller.signal.aborted).toBe(true)
  })
})
