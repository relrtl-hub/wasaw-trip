import type { Place } from './places'

export type DayKey = 'day1' | 'day2' | 'day3'
export type TravelMode = 'walking' | 'driving'

export type RouteSegment = {
  from: string
  to: string
  mode: TravelMode
  optional?: boolean
  instruction?: string
}

export type TripRoute = {
  id: string
  day: DayKey
  time: string
  title: string
  description: string
  color: string
  segments: RouteSegment[]
}

export const routes: TripRoute[] = [
  {
    id: 'day1-old-town',
    day: 'day1',
    time: '10:00',
    title: 'Grand → Tomb → memorial trail → Grand',
    description: 'One continuous walk: start at the hotel, reach the Tomb first, finish the memorial trail at Ghetto Heroes, then return to the hotel. Koneser is an optional dashed branch.',
    color: '#d49b3c',
    segments: [
      {
        from: 'hotel',
        to: 'tomb-of-unknown-soldier',
        mode: 'walking',
        instruction: 'Start at the hotel and walk to the Tomb of the Unknown Soldier.',
      },
      {
        from: 'tomb-of-unknown-soldier',
        to: 'presidential-palace',
        mode: 'walking',
        instruction: 'Continue along the Royal Route from the Tomb to the Presidential Palace.',
      },
      {
        from: 'presidential-palace',
        to: 'old-town',
        mode: 'walking',
        instruction: 'Follow the Royal Route north to Warsaw Old Town.',
      },
      {
        from: 'old-town',
        to: 'warsaw-barbican',
        mode: 'walking',
        instruction: 'Walk north through Old Town to the Barbican, the surviving medieval fortification between Old Town and New Town.',
      },
      {
        from: 'warsaw-barbican',
        to: 'warsaw-uprising-monument',
        mode: 'walking',
        instruction: 'Walk south-west along the Old Town edge to Krasiński Square and the Warsaw Uprising Monument.',
      },
      {
        from: 'warsaw-uprising-monument',
        to: 'umschlagplatz-monument',
        mode: 'walking',
        instruction: 'Continue north through Muranów to the Umschlagplatz Monument.',
      },
      {
        from: 'umschlagplatz-monument',
        to: 'mila-18-memorial',
        mode: 'walking',
        instruction: 'Walk south-west to the Miła 18 Memorial.',
      },
      {
        from: 'mila-18-memorial',
        to: 'ghetto-heroes-monument',
        mode: 'walking',
        instruction: 'Finish the memorial section at the Monument to the Ghetto Heroes.',
      },
      {
        from: 'ghetto-heroes-monument',
        to: 'centrum-praskie-koneser',
        mode: 'walking',
        optional: true,
        instruction: 'Optional: continue east from the Monument to the Ghetto Heroes to Centrum Praskie Koneser.',
      },
      {
        from: 'ghetto-heroes-monument',
        to: 'hotel',
        mode: 'walking',
        instruction: 'End the walk at the Monument to the Ghetto Heroes, then walk back to the hotel.',
      },
    ],
  },

  {
    id: 'day2-powisle',
    day: 'day2',
    time: '10:30',
    title: 'Grand → Viva Cuba → Uniqlo → TK Maxx → Grand',
    description: 'Start at the hotel, arrive at Viva Cuba around 11:00 for morning practice, then visit Uniqlo and TK Maxx nearby.',
    color: '#438b89',
    segments: [
      { from: 'hotel', to: 'viva-cuba', mode: 'walking', instruction: 'Leave the hotel at 10:30 and walk to Viva Cuba Dance Studio, arriving around 11:00 for morning practice.' },
      { from: 'viva-cuba', to: 'uniqlo', mode: 'walking', instruction: 'After practice, walk south-east to Uniqlo at 116/122 Marszałkowska.' },
      { from: 'uniqlo', to: 'tk-maxx', mode: 'walking', instruction: 'Continue south on Marszałkowska from Uniqlo to nearby TK Maxx.' },
      { from: 'tk-maxx', to: 'hotel', mode: 'walking', instruction: 'After TK Maxx, walk south-east through the centre and return to the hotel.' },
    ],
  },
  {
    id: 'day2-marszalkowska',
    day: 'day2',
    time: '15:30',
    title: 'Powiśle + riverside',
    description: 'A compact shopping loop around Elektrownia Powiśle.',
    color: '#c86452',
    segments: [
      { from: 'hotel', to: 'elektrownia-powisle', mode: 'walking', instruction: 'Walk north-east toward the river and enter Elektrownia Powiśle from Dobra Street.' },
      { from: 'elektrownia-powisle', to: 'urban-outfitters', mode: 'walking', instruction: 'Stay inside the Elektrownia Powiśle complex and walk to Urban Outfitters.' },
      { from: 'urban-outfitters', to: 'hotel', mode: 'walking', instruction: 'Walk south-west from Powiśle back to the hotel.' },
    ],
  },
  {
    id: 'day3-zlote-koszyki',
    day: 'day3',
    time: '10:30',
    title: 'Grand → Viva Cuba → Złote Tarasy + Koszyki',
    description: 'Start at the hotel, arrive at Viva Cuba around 11:00 for morning practice, then continue to the original shopping and lunch stops.',
    color: '#4a78a4',
    segments: [
      { from: 'hotel', to: 'viva-cuba', mode: 'walking', instruction: 'Leave the hotel at 10:30 and walk to Viva Cuba Dance Studio, arriving around 11:00 for morning practice.' },
      { from: 'viva-cuba', to: 'zlote-tarasy', mode: 'walking', instruction: 'After practice, continue west to Złote Tarasy beside Warszawa Centralna.' },
      { from: 'zlote-tarasy', to: 'hala-koszyki', mode: 'walking', instruction: 'Walk south to Hala Koszyki for lunch.' },
      { from: 'hala-koszyki', to: 'hotel', mode: 'walking', instruction: 'Walk north-east from Koszyki back to the hotel.' },
    ],
  },
  {
    id: 'day3-mysia-powisle',
    day: 'day3',
    time: '15:30',
    title: 'Mysia + flexible picks',
    description: 'Balagan first, then return toward Powiśle for a final browse.',
    color: '#70955d',
    segments: [
      { from: 'hotel', to: 'balagan', mode: 'walking', instruction: 'Walk north to Mysia 3 and Balagan Flagship Store.' },
      { from: 'balagan', to: 'elektrownia-powisle', mode: 'walking', instruction: 'Continue east toward the river and browse Elektrownia Powiśle.' },
      { from: 'elektrownia-powisle', to: 'hotel', mode: 'walking', instruction: 'Walk south-west from Powiśle back to the hotel.' },
    ],
  },
]

export const routesForDay = (day: DayKey) => routes.filter((route) => route.day === day)

export function googleDirectionsUrl(route: TripRoute, places: Place[]) {
  const plannedSegments = route.segments.filter((segment) => !segment.optional)
  const stopIds = [plannedSegments[0].from, ...plannedSegments.map((segment) => segment.to)]
  const stops = stopIds.map((id) => places.find((place) => place.id === id)).filter((place): place is Place => Boolean(place))
  const origin = stops[0]
  const destination = stops[stops.length - 1]
  const waypoints = stops.slice(1, -1).map((place) => `${place.lat},${place.lon}`).join('|')
  const mode = route.segments.every((segment) => segment.mode === 'walking') ? 'walking' : 'driving'
  const params = new URLSearchParams({
    api: '1',
    origin: `${origin.lat},${origin.lon}`,
    destination: `${destination.lat},${destination.lon}`,
    travelmode: mode,
  })
  if (waypoints) params.set('waypoints', waypoints)
  return `https://www.google.com/maps/dir/?${params.toString()}`
}
