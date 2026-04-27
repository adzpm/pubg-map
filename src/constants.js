export const TILE_SIZE = 256;
export const ZOOM_HEADROOM = 8;
export const PINCH_SETTLE_MS = 140;
export const PINCH_SENSITIVITY = 0.005;
export const SUBDIV = 10;

export const MAPS = [
    {id: 'erangel', name: 'Erangel', cells: {x: 8, y: 8}},
    {id: 'taego', name: 'Taego', cells: {x: 8, y: 8}},
    {id: 'miramar', name: 'Miramar', cells: {x: 8, y: 8}},
    {id: 'deston', name: 'Deston', cells: {x: 8, y: 8}},
    {id: 'rondo', name: 'Rondo', cells: {x: 8, y: 8}},
    {id: 'sanhok', name: 'Sanhok', cells: {x: 4, y: 4}},
    {id: 'paramo', name: 'Paramo', cells: {x: 3, y: 3}},
    {id: 'karakin', name: 'Karakin', cells: {x: 2, y: 2}},
];

export const SECRET_ROOMS = {
    erangel: [
        {x: 1379, y: 1815, name: '...'},
    ],
    taego: [],
    miramar: [],
    deston: [],
    rondo: [],
    sanhok: [],
    paramo: [],
    karakin: [],
};
