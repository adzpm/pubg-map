// What search engines and link previews are told about each page. Used twice: at build time to write
// a static page per map (seo/plugin.js) and in the browser to keep the head current when the map
// changes without a reload. Relative imports only: the build loads this file outside the '@' alias.
import { MAPS } from '../data/maps.js'
import { SECRET_ROOMS } from '../data/secrets.js'
import { VEHICLES } from '../data/vehicles.js'
import { pathForMap } from './route.js'

export const SITE_URL = 'https://pubg.adz.pm'
export const SITE_NAME = 'PUBG Maps'
const GAME = 'PUBG: BATTLEGROUNDS'

const ABOUT = {
    erangel: 'The original battleground: an abandoned island with Pochinki, Georgopol and the Sosnovka military base.',
    miramar: 'A desert of canyons, open hills and dense cities such as Los Leones and Pecado.',
    vikendi: 'A snow-covered island with a castle, a cosmodrome and frozen rivers.',
    taego: 'Korean countryside of the 1980s: rice fields, small towns, Terminal and Palace.',
    deston: 'A flooded near-future map: the skyscrapers of Ripton, swamps and ascenders.',
    rondo: 'Bamboo forests and old villages next to the modern high-rises of Jadena City.',
    sanhok: 'Small jungle islands with Bootcamp, Paradise Resort and Ruins; fights start early.',
    paramo: 'Highlands around an active volcano with lava streams.',
    karakin: 'A small rocky island with breakable walls, tunnels and the Black Zone.',
}

const list = (items) =>
    items.length < 3 ? items.join(' and ') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`

/** Countable things the map page really shows, taken from the same data the layers draw. */
export const mapFacts = (map) => {
    const vehicles = VEHICLES[map.id]
    return {
        size: `${map.cells.x}×${map.cells.y} km`,
        secrets: (SECRET_ROOMS[map.id] ?? []).length,
        vehicleSpots: vehicles?.spots.length ?? 0,
        fixedSpots: vehicles?.groups.filter((g) => g.chance >= 100).reduce((n, g) => n + g.spots, 0) ?? 0,
        vehicles: [...new Set(vehicles?.groups.flatMap((g) => g.vehicles) ?? [])],
    }
}

const factLines = (facts) =>
    [
        facts.secrets > 0 && `${facts.secrets} secret rooms marked`,
        facts.vehicleSpots > 0 &&
            `${facts.vehicleSpots} vehicle spawn points, each with its spawn chance` +
                (facts.fixedSpots > 0 ? `; ${facts.fixedSpots} of them are fixed spawns` : ''),
        facts.vehicles.length > 0 && `Vehicles: ${facts.vehicles.join(', ')}`,
        'Coordinate grid with cell names for callouts',
    ].filter(Boolean)

const IMAGE_PX = 8192
const squareOf = (map, room) => {
    const col = Math.min(map.cells.x - 1, Math.floor((room.x * map.cells.x) / IMAGE_PX))
    const row = Math.min(map.cells.y - 1, Math.floor((room.y * map.cells.y) / IMAGE_PX))
    return `${String.fromCharCode(65 + col)}${row + 1}`
}

/** Grid squares that hold secret rooms, in grid order: ["B2", "C3 (2 rooms)", ...]. */
export const secretSquares = (map) => {
    const counts = new Map()
    for (const room of SECRET_ROOMS[map.id] ?? []) {
        const square = squareOf(map, room)
        counts.set(square, (counts.get(square) ?? 0) + 1)
    }
    return [...counts.keys()]
        .sort()
        .map((square) => (counts.get(square) > 1 ? `${square} (${counts.get(square)} rooms)` : square))
}

const countText = (count) => (Array.isArray(count) ? `${count[0]}–${count[1]}` : String(count))

const vehicleLines = (map) =>
    (VEHICLES[map.id]?.groups ?? []).map((g) => ({
        text:
            `${g.name}: ` +
            (g.chance >= 100
                ? `a vehicle on each of ${g.spots} points every match`
                : `about ${Math.max(1, Math.min(99, Math.round(g.chance)))}% per point, ${countText(g.count)} vehicles across ${g.spots} points`) +
            (g.vehicles.length > 0 ? ` (${g.vehicles.join(', ')})` : ''),
    }))

const USAGE = {
    heading: 'Using the map',
    lines: [
        {
            text: 'Scroll or pinch to zoom, drag to move; every map is 8192 pixels wide, sharp down to single buildings.',
        },
        {
            text: 'One grid square is 1 km in the game. The square under the cursor is named in the window, so a callout like "C4" matches the in-game map.',
        },
        {
            text: 'Keys: 1–9 switch maps, G shows the grid, R the secret rooms, V the vehicle spawns, F folds the window.',
        },
    ],
}

const mapSections = (map, facts) => {
    const sections = []
    if (facts.secrets > 0) {
        sections.push({
            heading: `Secret rooms on ${map.name}`,
            lines: [
                {
                    text: `${facts.secrets} secret rooms are marked. Grid squares with a room: ${secretSquares(map).join(', ')}.`,
                },
                {
                    text: 'A secret room is a locked room with high-tier loot; it opens with a key found as loot during the match.',
                },
            ],
        })
    }
    if (facts.vehicleSpots > 0) {
        sections.push({
            heading: `Vehicle spawns on ${map.name}`,
            lines: [
                {
                    text: `${facts.vehicleSpots} spawn points from the game files. The number on a point is its chance: vehicles per match divided by the points of its group.`,
                },
                ...vehicleLines(map),
            ],
        })
    }
    return [...sections, USAGE]
}

const mapSummary = (map) => {
    const facts = mapFacts(map)
    return [
        facts.size,
        facts.secrets > 0 && `${facts.secrets} secret rooms`,
        facts.vehicleSpots > 0 && `${facts.vehicleSpots} vehicle spawns`,
    ]
        .filter(Boolean)
        .join(', ')
}

const mapPage = (map) => {
    const facts = mapFacts(map)
    const layers = [facts.secrets > 0 && 'secret rooms', facts.vehicleSpots > 0 && 'vehicle spawns', 'grid'].filter(
        Boolean,
    )
    const counted = [
        facts.secrets > 0 && `${facts.secrets} secret rooms`,
        facts.vehicleSpots > 0 && `${facts.vehicleSpots} vehicle spawn points with spawn chances`,
        'a coordinate grid for callouts',
    ].filter(Boolean)

    return {
        id: map.id,
        path: pathForMap(map.id),
        title:
            layers.length > 1
                ? `PUBG ${map.name} map: ${list(layers)}`
                : `PUBG ${map.name} map: interactive ${facts.size} map with grid`,
        description:
            layers.length > 1
                ? `Interactive ${map.name} map for ${GAME}, ${facts.size}: ${list(counted)}.`
                : `Interactive ${map.name} map for ${GAME}, ${facts.size}: zoom down to single buildings, with a coordinate grid for callouts. Free, no sign-up.`,
        heading: `${map.name} map`,
        about: `${ABOUT[map.id] ?? ''} Interactive map for ${GAME}, ${facts.size}.`.trim(),
        lines: factLines(facts).map((text) => ({ text })),
        sections: mapSections(map, facts),
        image: `/og/${map.id}.jpg`,
        facts,
    }
}

const homePage = () => {
    const rooms = MAPS.reduce((n, m) => n + mapFacts(m).secrets, 0)
    const spots = MAPS.reduce((n, m) => n + mapFacts(m).vehicleSpots, 0)
    return {
        id: null,
        path: '/',
        title: 'PUBG interactive maps: secret rooms, vehicle spawns, grid',
        description: `Interactive maps for ${GAME}: ${MAPS.slice(0, 4)
            .map((m) => m.name)
            .join(
                ', ',
            )} and ${MAPS.length - 4} more. ${rooms} secret rooms, ${spots} vehicle spawn points with chances, grid.`,
        heading: 'PUBG interactive maps',
        about: `Every ${GAME} map in one place, zoomable down to single buildings. Secret rooms, vehicle spawn points with their spawn chances and a coordinate grid for callouts.`,
        lines: MAPS.map((m) => ({ href: pathForMap(m.id), label: `${m.name} map`, text: mapSummary(m) })),
        sections: [USAGE],
        image: `/og/${MAPS[0].id}.jpg`,
        facts: null,
    }
}

/** Page description for a map, or for the home page when called without one. */
export const pageMeta = (map) => (map ? mapPage(map) : homePage())

export const absoluteUrl = (path) => SITE_URL + path
