import { useEffect, useState, type FormEvent } from 'react'
import './App.css'
import 'leaflet/dist/leaflet.css'
import { WarsawMap } from './components/WarsawMap'
import { places, type Place, type PlaceGroup } from './data/places'
import { googleDirectionsUrl, routes, routesForDay, type DayKey } from './data/routes'
import { fetchCurrency, fetchWeather, weatherDescription, type CurrencyStatus, type WeatherStatus } from './lib/live-data'
import { buildFallbackTripRoute, fetchTripRoute, formatDistance, formatDuration, type RouteResult } from './lib/routing'
type MapMode = 'route' | 'category' | 'place'
type PlaceFilter = PlaceGroup | 'all'

const customPlacesStorageKey = 'warsaw-trip-custom-places'
const placeGroups: Array<{ id: PlaceFilter; label: string }> = [
  { id: 'core', label: 'Core' },
  { id: 'sightseeing', label: 'Sightseeing' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'restaurants', label: 'Restaurants' },
  { id: 'utilities', label: 'Utilities' },
]

function placeGroupFor(place: Place): PlaceGroup {
  if (place.group) return place.group
  if (place.id === 'hotel' || place.id === 'viva-cuba') return 'core'
  if (place.category === 'history' || place.category === 'area') return 'sightseeing'
  if (place.category === 'shopping') return 'shopping'
  if (place.category === 'food') return 'restaurants'
  return 'utilities'
}

function categoryForGroup(group: PlaceGroup): Place['category'] {
  if (group === 'shopping') return 'shopping'
  if (group === 'restaurants') return 'food'
  if (group === 'sightseeing') return 'history'
  return group === 'core' ? 'area' : 'area'
}

function loadCustomPlaces(): Place[] {
  try {
    const stored = JSON.parse(localStorage.getItem(customPlacesStorageKey) ?? '[]') as unknown
    if (!Array.isArray(stored)) return []
    return stored.filter((place): place is Place => Boolean(
      place && typeof place === 'object' &&
      typeof (place as Place).id === 'string' &&
      typeof (place as Place).name === 'string' &&
      typeof (place as Place).lat === 'number' &&
      typeof (place as Place).lon === 'number' &&
      (place as Place).userAdded === true,
    ))
  } catch {
    return []
  }
}

type PlaceSearchResult = {
  display_name: string
  lat: string
  lon: string
  type?: string
}

const days: Array<{ id: DayKey; label: string; date: string; caption: string }> = [
  { id: 'day1', label: 'Day 1', date: '30 Aug', caption: 'Old Town + Koneser' },
  { id: 'day2', label: 'Day 2', date: '31 Aug', caption: 'Central shopping' },
  { id: 'day3', label: 'Day 3', date: '01 Sep', caption: 'Final picks' },
]

function App() {
  const [activeDay, setActiveDay] = useState<DayKey>('day1')
  const [activeRouteId, setActiveRouteId] = useState('day1-old-town')
  const [selectedSegment, setSelectedSegment] = useState<{ routeId: string; segmentIndex: number } | null>(null)
  const [routeResults, setRouteResults] = useState<Record<string, RouteResult>>({})
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [showPlaceLabels, setShowPlaceLabels] = useState(true)
  const [customPlaces, setCustomPlaces] = useState<Place[]>(loadCustomPlaces)
  const [mapMode, setMapMode] = useState<MapMode>('route')
  const [activePlaceFilter, setActivePlaceFilter] = useState<PlaceFilter | null>(null)
  const [highlightedPlaceId, setHighlightedPlaceId] = useState<string | null>(null)
  const [addQuery, setAddQuery] = useState('')
  const [addGroup, setAddGroup] = useState<PlaceGroup>('shopping')
  const [addResults, setAddResults] = useState<PlaceSearchResult[]>([])
  const [addSearching, setAddSearching] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [weather, setWeather] = useState<WeatherStatus | null>(null)
  const [currency, setCurrency] = useState<CurrencyStatus | null>(null)

  const allPlaces = [...places, ...customPlaces]
  const selectedDay = days.find((day) => day.id === activeDay) ?? days[0]
  const selectedRoutes = routesForDay(activeDay)
  const activeRoute = selectedRoutes.find((route) => route.id === activeRouteId) ?? selectedRoutes[0]
  const routeDisplays = selectedRoutes.map((route) => ({
    route,
    result: routeResults[route.id] ?? buildFallbackTripRoute(route.segments, allPlaces),
  }))
  const visibleRouteDisplays = activeRoute
    ? routeDisplays.filter(({ route }) => route.id === activeRoute.id)
    : []
  const activeRouteResult = activeRoute
    ? routeDisplays.find(({ route }) => route.id === activeRoute.id)?.result ?? null
    : null

  useEffect(() => {
    const dayRoute = routesForDay(activeDay).find((route) => route.id === activeRouteId) ?? routesForDay(activeDay)[0]
    if (!dayRoute) return
    let cancelled = false
    const loadRoute = async () => {
      setRouteLoading(true)
      setRouteError(null)
      try {
        const result = await fetchTripRoute(dayRoute.segments, [...places, ...customPlaces])
        if (!cancelled) setRouteResults((current) => ({ ...current, [dayRoute.id]: result }))
      } catch (error: unknown) {
        if (!cancelled) setRouteError(error instanceof Error ? error.message : 'Route unavailable')
      } finally {
        if (!cancelled) setRouteLoading(false)
      }
    }
    void loadRoute()
    return () => { cancelled = true }
  }, [activeDay, activeRouteId, customPlaces])

  useEffect(() => {
    fetchWeather().then(setWeather).catch(() => undefined)
    fetchCurrency().then(setCurrency).catch(() => undefined)
  }, [])

  useEffect(() => {
    localStorage.setItem(customPlacesStorageKey, JSON.stringify(customPlaces))
  }, [customPlaces])

  const placesByGroup = placeGroups.map((group) => ({
    ...group,
    places: allPlaces
      .filter((place) => placeGroupFor(place) === group.id)
      .sort((left, right) => left.name.localeCompare(right.name)),
  }))
  const visibleMapPlaces = mapMode === 'category' && activePlaceFilter
    ? allPlaces.filter((place) => activePlaceFilter === 'all' || placeGroupFor(place) === activePlaceFilter)
    : allPlaces
  const mapRouteDisplays = mapMode === 'route' ? visibleRouteDisplays : []
  const mapCaption = mapMode === 'route'
    ? 'MAP / ACTIVE ROUTE'
    : mapMode === 'category'
      ? `MAP / ${activePlaceFilter === 'all' ? 'ALL PLACES' : placeGroups.find((group) => group.id === activePlaceFilter)?.label.toUpperCase()}`
      : 'MAP / PLACE'

  const showPlaceGroup = (group: PlaceFilter) => {
    setActivePlaceFilter(group)
    setMapMode('category')
    setHighlightedPlaceId(null)
    setSelectedSegment(null)
  }

  const handlePlaceSelect = (place: Place) => {
    setHighlightedPlaceId(place.id)
    setActivePlaceFilter(null)
    if (place.id === 'hotel' || place.id === 'viva-cuba') {
      setMapMode('place')
      setSelectedSegment(null)
      return
    }
    const matchingRoute = routes.find((route) => route.day === activeDay && route.segments.some((segment) => segment.to === place.id))
      ?? routes.find((route) => route.segments.some((segment) => segment.to === place.id))
    const matchingSegmentIndex = matchingRoute?.segments.findIndex((segment) => segment.to === place.id) ?? -1
    if (matchingRoute && matchingSegmentIndex >= 0) {
      setActiveDay(matchingRoute.day)
      setActiveRouteId(matchingRoute.id)
      setSelectedSegment({ routeId: matchingRoute.id, segmentIndex: matchingSegmentIndex })
      setMapMode('route')
    } else {
      setMapMode('place')
      setSelectedSegment(null)
    }
  }

  const handleSearchPlaces = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = addQuery.trim()
    if (query.length < 2) {
      setAddError('Enter at least two characters.')
      return
    }
    setAddSearching(true)
    setAddError(null)
    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        limit: '5',
        countrycodes: 'pl',
        q: `${query}, Warsaw, Poland`,
      })
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`)
      if (!response.ok) throw new Error(`Search failed: ${response.status}`)
      const results = await response.json() as PlaceSearchResult[]
      setAddResults(results)
      if (!results.length) setAddError('No Warsaw places found.')
    } catch (error: unknown) {
      setAddError(error instanceof Error ? error.message : 'Place search unavailable')
    } finally {
      setAddSearching(false)
    }
  }

  const addSearchResult = (result: PlaceSearchResult) => {
    const lat = Number(result.lat)
    const lon = Number(result.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return
    const name = result.display_name.split(',')[0].trim()
    const id = `custom-${result.lat}-${result.lon}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    const place: Place = {
      id,
      name,
      group: addGroup,
      category: categoryForGroup(addGroup),
      userAdded: true,
      address: result.display_name,
      lat,
      lon,
      note: 'Added from a Warsaw place search.',
      source: 'OpenStreetMap / Nominatim',
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
    }
    setCustomPlaces((current) => [...current, place])
    setHighlightedPlaceId(id)
    setActivePlaceFilter(null)
    setMapMode('place')
    setAddQuery('')
    setAddResults([])
    setAddError(null)
  }

  const deleteCustomPlace = (place: Place) => {
    if (!place.userAdded) return
    setCustomPlaces((current) => current.filter((candidate) => candidate.id !== place.id))
    if (highlightedPlaceId === place.id) setHighlightedPlaceId(null)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">W</span>
          <div>
            <p className="eyebrow">TRIP FILE 01</p>
            <p className="brand-name">Warsaw, slowly.</p>
          </div>
        </div>

        <div className="trip-stamp">
          <span className="status-dot" />
          <div>
            <strong>30 Aug - 01 Sep 2026</strong>
            <span>3 days · local time CET</span>
          </div>
        </div>

        <section className="places-sidebar" aria-label="Trip places">
          <div className="places-heading">
            <div><p className="eyebrow">PLACES</p><h2>Trip stops</h2></div>
            <span>{allPlaces.length}</span>
          </div>
          <div className="place-filter-list">
            <button aria-pressed={mapMode === 'category' && activePlaceFilter === 'all'} className="place-filter-button" onClick={() => showPlaceGroup('all')} type="button"><span>All</span><small>{allPlaces.length}</small></button>
            {placeGroups.map((group) => (
              <button aria-pressed={mapMode === 'category' && activePlaceFilter === group.id} className="place-filter-button" key={group.id} onClick={() => showPlaceGroup(group.id)} type="button"><span>{group.label}</span><small>{placesByGroup.find((item) => item.id === group.id)?.places.length ?? 0}</small></button>
            ))}
          </div>
          <div className="place-groups">
            {placesByGroup.map((group) => (
              <section className="place-group" key={group.id}>
                <button className="place-group-heading" onClick={() => showPlaceGroup(group.id)} type="button"><span>{group.label}</span><small>{group.places.length}</small></button>
                <div className="place-group-list">
                  {group.places.map((place) => (
                    <div className="place-row" key={place.id}>
                      <button aria-pressed={highlightedPlaceId === place.id} className={`place-item ${highlightedPlaceId === place.id ? 'is-highlighted' : ''}`} onClick={() => handlePlaceSelect(place)} type="button">
                        <span className={`place-dot place-dot-${group.id}`} />
                        <span><strong>{place.name}</strong><small>{place.address}</small></span>
                      </button>
                      {place.userAdded && <button aria-label={`Delete ${place.name}`} className="delete-place-button" onClick={() => deleteCustomPlace(place)} type="button">×</button>}
                    </div>
                  ))}
                  {!group.places.length && <p className="empty-place-group">Nothing here yet.</p>}
                </div>
              </section>
            ))}
          </div>
          <form className="add-place-form" onSubmit={handleSearchPlaces}>
            <p className="add-place-heading">ADD A PLACE</p>
            <div className="add-place-input-row"><input aria-label="Search for a Warsaw place" id="place-search" onChange={(event) => setAddQuery(event.target.value)} placeholder="Search Warsaw..." value={addQuery} /><button disabled={addSearching} type="submit">{addSearching ? '...' : 'Search'}</button></div>
            <select aria-label="Category for the new place" onChange={(event) => setAddGroup(event.target.value as PlaceGroup)} value={addGroup}>
              {placeGroups.filter((group) => group.id !== 'core').map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}
            </select>
            {addError && <p className="add-place-error">{addError}</p>}
            {addResults.length > 0 && <div className="place-search-results">{addResults.map((result) => <button key={`${result.lat}-${result.lon}-${result.display_name}`} onClick={() => addSearchResult(result)} type="button"><strong>{result.display_name.split(',')[0]}</strong><small>{result.display_name}</small></button>)}</div>}
          </form>
        </section>

        <div className="sidebar-footer">
          <div className="privacy-note">
            <span className="lock-icon" aria-hidden="true">⌑</span>
            <div>
              <strong>Private by default</strong>
              <span>Documents stay out of the public site.</span>
            </div>
          </div>
          <p className="build-note">Phase 4 · history + memorials</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">WARSAW / TRIP CONTROL</p>
            <h1>Three days, one good map.</h1>
          </div>
          <button className="weather-pill" type="button" onClick={() => setMapMode('route')}>
            <span className="weather-symbol" aria-hidden="true">◌</span>
            <span><strong>Weather</strong><small>{weather ? 'Live forecast loaded' : 'Loading live forecast'}</small></span>
            <span className="arrow">↗</span>
          </button>
        </header>

        <section className="day-strip" aria-label="Trip days">
          <div className="section-kicker">YOUR DAYS</div>
          <div className="day-tabs">
            {days.map((day) => (
              <button
                className={`day-tab ${activeDay === day.id ? 'is-active' : ''}`}
                key={day.id}
                onClick={() => {
                  setActiveDay(day.id)
                  setActiveRouteId(routesForDay(day.id)[0]?.id ?? '')
                  setSelectedSegment(null)
                  setHighlightedPlaceId(null)
                  setActivePlaceFilter(null)
                  setMapMode('route')
                }}
                type="button"
              >
                <span>{day.label}</span>
                <strong>{day.date}</strong>
                <small>{day.caption}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="workspace-grid">
          <div className="map-card">
            <div className="card-header map-header">
              <div>
                <p className="section-kicker">{mapCaption}</p>
                <h2>{selectedDay.caption}</h2>
              </div>
              <button className="ghost-button" type="button" onClick={() => { setMapMode('route'); setActivePlaceFilter(null) }}>Show route <span>↗</span></button>
            </div>
            <div className="map-surface real-map-shell" aria-label="Interactive map of Warsaw points of interest">
              <WarsawMap
                onSegmentSelect={(routeId, segmentIndex) => {
                  setActiveRouteId(routeId)
                  setSelectedSegment({ routeId, segmentIndex })
                  setMapMode('route')
                  setHighlightedPlaceId(null)
                }}
                onPlaceSelect={handlePlaceSelect}
                places={visibleMapPlaces}
                routeDisplays={mapRouteDisplays}
                selectedSegment={selectedSegment}
                showPlaceLabels={showPlaceLabels}
                highlightedPlaceId={highlightedPlaceId}
              />
              <button
                aria-label={showPlaceLabels ? 'Hide place names on the map' : 'Show place names on the map'}
                aria-pressed={showPlaceLabels}
                className="map-label-toggle"
                onClick={() => setShowPlaceLabels((visible) => !visible)}
                type="button"
                title={showPlaceLabels ? 'Hide place names' : 'Show place names'}
              >
                <span aria-hidden="true">{showPlaceLabels ? '◉' : '○'}</span>
                {showPlaceLabels ? 'Hide place names' : 'Show place names'}
              </button>
              <div className="map-legend map-legend-live"><span><i className="legend-dot amber" />Shopping</span><span><i className="legend-dot hotel-legend" />Hotel</span><span><i className="legend-dot plum" />History</span><span><i className="legend-line selected-route-legend" />Selected segment</span><span><i className="legend-line optional-route-legend" />Optional</span></div>
            </div>
            <div className="map-footer"><span><i className="legend-dot amber" /> {visibleMapPlaces.length} places shown · {mapMode === 'route' ? '1 route displayed' : 'place browsing mode'}</span><span>{mapMode !== 'route' ? (mapMode === 'place' ? 'Place highlighted' : 'Category places shown') : routeLoading ? 'Measuring street routes...' : activeRouteResult?.legs.some((leg) => leg.source === 'fallback') ? 'Street route unavailable · use Google Maps' : activeRouteResult ? `${formatDistance(activeRouteResult.distanceMeters)} walking route loaded` : 'Scroll, zoom, tap a marker'}</span></div>
          </div>

          <div className="route-panel">
            <div className="card-header route-header">
              <div><p className="section-kicker">DAY {activeDay.slice(-1)} / PLAN</p><h2>Route board</h2></div>
              <span className={`draft-chip ${routeLoading ? 'is-loading' : ''}`}>{routeLoading ? 'LOADING' : routeError ? 'ERROR' : 'LIVE'}</span>
            </div>
            <p className="panel-intro">Only the selected route appears on the map. Distances and lines use street-network directions, never aerial distance. Pick a route, then click any segment to highlight it in amber.</p>
            <div className="route-list">
              {selectedRoutes.map((route) => (
                <button className={`route-card ${activeRoute?.id === route.id ? 'is-selected' : ''}`} key={route.id} onClick={() => { setActiveRouteId(route.id); setSelectedSegment(null); setHighlightedPlaceId(null); setActivePlaceFilter(null); setMapMode('route') }} type="button">
                  <span className="route-line" style={{ background: route.color }} />
                  <span className="route-time">{route.time}</span>
                  <span className="route-copy"><strong>{route.title}</strong><small>{route.description}</small></span>
                  <span className="route-arrow">{activeRoute?.id === route.id ? '●' : '○'}</span>
                </button>
              ))}
            </div>
            {activeRoute && (
              <div className="route-measure">
                <div className="measure-heading"><span>MEASURED LEGS</span><strong>{activeRouteResult?.legs.some((leg) => leg.source === 'fallback') ? 'Street route unavailable' : activeRouteResult ? `${formatDistance(activeRouteResult.distanceMeters)} · ${formatDuration(activeRouteResult.durationSeconds)}` : routeLoading ? 'Calculating...' : 'Unavailable'}</strong></div>
                {activeRouteResult?.legs.map((leg, index) => (
                  <button
                    aria-pressed={selectedSegment?.routeId === activeRoute.id && selectedSegment.segmentIndex === index}
                    className={`leg-row ${selectedSegment?.routeId === activeRoute.id && selectedSegment.segmentIndex === index ? 'is-selected' : ''}`}
                    key={`${leg.segment.from}-${leg.segment.to}`}
                    onClick={() => setSelectedSegment({ routeId: activeRoute.id, segmentIndex: index })}
                    title={`Highlight segment ${index + 1} on the map`}
                    type="button"
                  >
                    <span className="segment-number" aria-hidden="true">{index + 1}</span>
                    <span className={`leg-mode ${leg.segment.mode}`}>{leg.segment.mode === 'walking' ? 'WALK' : 'TAXI'}</span>
                    <span className="leg-name">{allPlaces.find((place) => place.id === leg.segment.from)?.name} <b>→</b> {allPlaces.find((place) => place.id === leg.segment.to)?.name}</span>
                    <strong>{leg.source === 'fallback' ? 'Unavailable' : formatDuration(leg.durationSeconds)}</strong>
                    <small>{leg.source === 'fallback' ? 'Street walking route unavailable · use Google Maps' : `${formatDistance(leg.distanceMeters)}${leg.segment.optional ? ' · optional' : ''}`}</small>
                  </button>
                ))}
                {routeError && <p className="route-error">{routeError}. Google Maps handoff is still available.</p>}
                <a className="navigate-button" href={googleDirectionsUrl(activeRoute, allPlaces)} rel="noreferrer" target="_blank">Navigate in Google Maps ↗</a>
              </div>
            )}
            <button className="add-place-button" type="button" onClick={() => document.getElementById('place-search')?.focus()}><span>+</span> Add a place in the sidebar</button>
          </div>
        </section>

        <section className="bottom-grid">
          <article className="status-card live-status-card">
            <div className="card-header"><div><p className="section-kicker">LIVE STATUS</p><h2>Weather + currency</h2></div><span className="sync-label"><i /> {weather && currency ? 'Updated' : 'Loading'}</span></div>
            <div className="weather-days">
              {weather?.days.map((day) => (
                <div className="weather-day" key={day.date}><small>{day.date.slice(8)} {day.date.slice(5, 7) === '08' ? 'Aug' : 'Sep'}</small><strong>{Math.round(day.high)}° / {Math.round(day.low)}°</strong><span>{weatherDescription(day.code)} · rain {day.rainProbability}%</span><em>{day.rainWindow}</em></div>
              )) ?? <div className="data-loading">Fetching Warsaw forecast for all three days...</div>}
            </div>
            <div className="currency-strip"><span><small>1 PLN</small><strong>{currency ? `${currency.eurPerPln.toFixed(4)} EUR` : '...'}</strong></span><span><small>1 EUR</small><strong>{currency ? `${currency.plnPerEur.toFixed(2)} PLN` : '...'}</strong></span><span><small>1 EUR</small><strong>{currency ? `${currency.eurPerIls.toFixed(2)} ILS` : '...'}</strong></span></div>
          </article>
          <article className="status-card essentials-card">
            <div className="card-header"><div><p className="section-kicker">ESSENTIALS</p><h2>Travel papers</h2></div><span className="count-label">0 / 4 ready</span></div>
            <div className="essentials-row"><span className="paper-placeholder">□</span><div><strong>Placeholders prepared</strong><small>Passport, insurance, phone plan, hotel voucher</small></div><button type="button" onClick={() => undefined} aria-label="Open essentials">↗</button></div>
          </article>
        </section>

        <footer className="app-footer"><span>Mercure Warszawa Grand · hotel anchor</span><span>Built to be edited, not worshipped.</span></footer>
      </main>
    </div>
  )
}

export default App
