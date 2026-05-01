const {app, BrowserWindow, globalShortcut, ipcMain, screen} = require('electron')
const path = require('node:path')

const URL = process.env.PUBG_MAP_URL || 'http://localhost:5180'
const TOGGLE_HOTKEY = process.env.PUBG_MAP_HOTKEY || 'Alt+M'
const CLICKTHROUGH_HOTKEY = process.env.PUBG_MAP_CLICKTHROUGH || 'Alt+Shift+M'
const OVERLAY_OPACITY = Number(process.env.PUBG_MAP_OPACITY || 0.92)

let win = null
let clickThrough = false

const createWindow = () => {
    const {bounds} = screen.getPrimaryDisplay()

    win = new BrowserWindow({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        hasShadow: false,
        resizable: true,
        movable: true,
        skipTaskbar: true,
        focusable: true,
        show: false,
        opacity: OVERLAY_OPACITY,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            backgroundThrottling: false,
        },
    })

    win.setAlwaysOnTop(true, 'screen-saver')
    win.setVisibleOnAllWorkspaces(true, {visibleOnFullScreenWindows: true})
    win.loadURL(URL)

    win.on('closed', () => {
        win = null
    })
}

const toggleOverlay = () => {
    if (!win) return
    if (win.isVisible()) {
        win.hide()
    } else {
        win.showInactive()
        win.setAlwaysOnTop(true, 'screen-saver')
    }
}

const toggleClickThrough = () => {
    if (!win) return
    clickThrough = !clickThrough
    win.setIgnoreMouseEvents(clickThrough, {forward: true})
    win.webContents.send('overlay:click-through', clickThrough)
}

app.whenReady().then(() => {
    createWindow()

    const okToggle = globalShortcut.register(TOGGLE_HOTKEY, toggleOverlay)
    const okClick = globalShortcut.register(CLICKTHROUGH_HOTKEY, toggleClickThrough)

    if (!okToggle) console.error(`[overlay] failed to bind hotkey: ${TOGGLE_HOTKEY}`)
    if (!okClick) console.error(`[overlay] failed to bind hotkey: ${CLICKTHROUGH_HOTKEY}`)

    ipcMain.handle('overlay:hide', () => win?.hide())
})

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
    if (!win) createWindow()
})
