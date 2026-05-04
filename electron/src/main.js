const {app, BrowserWindow, Menu, Tray, globalShortcut, screen, nativeImage} = require('electron')
const path = require('path')

const OVERLAY_URL = 'https://pubg.adz.pm'
const TOGGLE_SHORTCUT = 'Alt+M'
const WINDOW_OPACITY = 0.75
const TRAY_ICON_PATH = path.join(__dirname, 'tray-icon.png')

let overlayWindow = null
let tray = null

const createOverlayWindow = () => {
    const {x, y, width, height} = screen.getPrimaryDisplay().bounds

    overlayWindow = new BrowserWindow({
        x,
        y,
        width,
        height,
        frame: false,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        show: false,
        opacity: WINDOW_OPACITY,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    })

    overlayWindow.setAlwaysOnTop(true, 'screen-saver')
    overlayWindow.setVisibleOnAllWorkspaces(true, {visibleOnFullScreen: true})
    overlayWindow.setFullScreen(true)
    overlayWindow.setMenuBarVisibility(false)

    overlayWindow.loadURL(OVERLAY_URL)

    overlayWindow.on('closed', () => {
        overlayWindow = null
    })
}

const toggleOverlay = () => {
    if (!overlayWindow) {
        createOverlayWindow()
        overlayWindow.once('ready-to-show', () => {
            overlayWindow.show()
            overlayWindow.focus()
        })
        return
    }

    if (overlayWindow.isVisible()) {
        overlayWindow.hide()
    } else {
        overlayWindow.show()
        overlayWindow.focus()
    }
}

const quit = () => {
    if (overlayWindow) {
        overlayWindow.destroy()
        overlayWindow = null
    }
    app.quit()
}

const createTray = () => {
    const icon = nativeImage.createFromPath(TRAY_ICON_PATH)
    tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon)
    tray.setToolTip('PUBG Map Overlay')

    const menu = Menu.buildFromTemplate([
        {label: `Toggle overlay (${TOGGLE_SHORTCUT})`, click: toggleOverlay},
        {type: 'separator'},
        {label: 'Exit', click: quit},
    ])

    tray.setContextMenu(menu)
    tray.on('click', toggleOverlay)
}

app.whenReady().then(() => {
    createTray()

    const ok = globalShortcut.register(TOGGLE_SHORTCUT, toggleOverlay)
    if (!ok) console.error(`Failed to register shortcut ${TOGGLE_SHORTCUT}`)
})

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})

app.on('window-all-closed', (e) => {
    e.preventDefault()
})
