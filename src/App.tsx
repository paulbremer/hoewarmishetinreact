import { useEffect, useState } from 'react'
import {
  fetchTemperature,
  getSiteVariant,
  getTemperatureLabel,
  resolveLocation,
  type LocationSource,
  type SiteVariant,
} from './weather'

type WeatherState =
  | { status: 'loading' }
  | {
      status: 'success'
      temperature: number
      locationSource: LocationSource
    }
  | { status: 'error' }

function getDevelopmentOverride(): string | null {
  if (!import.meta.env.DEV) return null
  return new URLSearchParams(window.location.search).get('variant')
}

function copyFor(variant: SiteVariant, state: WeatherState): string {
  if (state.status === 'success') {
    return getTemperatureLabel(state.temperature, variant)
  }

  if (state.status === 'error') {
    return variant === 'warm'
      ? 'Wij zijn de zon even kwijt...'
      : 'Wij zijn het kwik even kwijt...'
  }

  return variant === 'warm' ? 'Op zoek naar de zon...' : 'Op zoek naar de kou...'
}

export default function App() {
  const [variant] = useState(() =>
    getSiteVariant(window.location.hostname, getDevelopmentOverride()),
  )
  const [state, setState] = useState<WeatherState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const adjective = variant === 'cold' ? 'koud' : 'warm'

  useEffect(() => {
    document.title = `Hoe ${adjective} is het vandaag?`
  }, [adjective])

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    async function loadWeather() {
      setState({ status: 'loading' })

      try {
        const location = await resolveLocation()
        const temperature = await fetchTemperature(location, controller.signal)
        if (active) {
          setState({
            status: 'success',
            temperature,
            locationSource: location.source,
          })
        }
      } catch {
        if (active && !controller.signal.aborted) setState({ status: 'error' })
      }
    }

    void loadWeather()
    return () => {
      active = false
      controller.abort()
    }
  }, [attempt])

  const success = state.status === 'success'

  return (
    <div className="flex min-h-dvh flex-col px-5 pt-8 pb-5 text-center text-[#f2f2f2] sm:px-8">
      <header className="text-shadow shrink-0">
        <h1 className="m-0 text-xl font-bold sm:text-2xl">
          Hoe {adjective} is het vandaag?
        </h1>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center" aria-live="polite">
        {success && (
          <div
            className="mb-3 flex size-13 items-center justify-center rounded-full bg-white pl-1 text-xl not-italic font-normal text-black shadow-lg transition-opacity motion-reduce:transition-none"
            aria-label={`${Math.floor(state.temperature)} graden Celsius`}
          >
            {Math.floor(state.temperature)}°
          </div>
        )}
        <p className="text-shadow m-0 max-w-5xl text-5xl leading-tight font-bold sm:text-7xl lg:text-8xl">
          {copyFor(variant, state)}
        </p>
        {success && state.locationSource === 'amsterdam' && (
          <p className="text-shadow mt-5 mb-0 text-sm sm:text-base">
            Locatie niet beschikbaar — weer voor Amsterdam.
          </p>
        )}
        {state.status === 'error' && (
          <button
            className="mt-6 cursor-pointer rounded-full border border-white/80 bg-white/15 px-5 py-2 text-base font-bold text-white transition hover:bg-white/25 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-white motion-reduce:transition-none"
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Opnieuw proberen
          </button>
        )}
      </main>

      <footer className="text-shadow mx-auto max-w-xl text-[11px] leading-relaxed sm:text-xs">
        <p className="m-0">
          een project van{' '}
          <a href="https://twitter.com/petergerdes" target="_blank" rel="noreferrer">
            @petergerdes
          </a>{' '}
          en{' '}
          <a href="https://twitter.com/paulbremer_" target="_blank" rel="noreferrer">
            @paulbremer_
          </a>{' '}
          © {new Date().getFullYear()}
        </p>
        <p className="mt-2 mb-0">
          Weergegevens van{' '}
          <a
            href="https://api.met.no/weatherapi/locationforecast/2.0/documentation"
            target="_blank"
            rel="noreferrer"
          >
            MET Norway
          </a>{' '}
          ({' '}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
            CC BY 4.0
          </a>
          ); temperatuur is afgerond en omschreven door deze site.
        </p>
        <p className="mt-2 mb-0">
          Je browser deelt je afgeronde locatie en IP-adres rechtstreeks met MET Norway om het weer op te halen.{' '}
          <a href="https://www.met.no/en/About-us/privacy" target="_blank" rel="noreferrer">
            Privacyinformatie
          </a>
        </p>
      </footer>
    </div>
  )
}
