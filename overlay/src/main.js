const {app, BrowserWindow, Menu, Tray, globalShortcut, screen, shell, nativeImage} = require('electron')
const path = require('path')

const OVERLAY_URL = 'https://pubg.adz.pm'
const OVERLAY_ORIGIN = new URL(OVERLAY_URL).origin
const TOGGLE_SHORTCUT = 'Alt+M'
const OPACITY_LEVELS = [0.5, 0.65, 0.75, 0.9]
const RETRY_DELAY_MIN_MS = 2000
const RETRY_DELAY_MAX_MS = 30000
const TRAY_ICON_PATH = path.join(__dirname, 'tray-icon.png')
const ERROR_PAGE_PATH = path.join(__dirname, 'load-error.html')

// electron-builder's portable launcher sets PORTABLE_EXECUTABLE_DIR; keeping
// userData next to the exe makes the portable build leave no %APPDATA% traces
// (must run before requestSingleInstanceLock — the lock file lives in userData)
const portableDir = process.env.PORTABLE_EXECUTABLE_DIR
if (portableDir) {
    app.setPath('userData', path.join(portableDir, 'pubg-map-overlay-data'))
}

let overlayWindow = null
let overlayReady = false
let wantVisible = false
let tray = null
let overlayOpacity = 0.75
let shortcutRegistered = false
let loadFailed = false
let retryTimer = null
let retryDelay = RETRY_DELAY_MIN_MS

const clearRetryTimer = () => {
    if (retryTimer) {
        clearTimeout(retryTimer)
        retryTimer = null
    }
}

const scheduleRetry = () => {
    if (retryTimer || !overlayWindow || !overlayWindow.isVisible()) return

    retryTimer = setTimeout(() => {
        retryTimer = null

        if (loadFailed && overlayWindow && overlayWindow.isVisible()) {
            retryDelay = Math.min(retryDelay * 2, RETRY_DELAY_MAX_MS)
            overlayWindow.loadURL(OVERLAY_URL)
        }
    }, retryDelay)
}

const showLoadError = (details) => {
    if (!overlayWindow) return

    overlayWindow
        .loadFile(ERROR_PAGE_PATH, {query: {url: OVERLAY_URL, error: details}})
        .catch(() => {})
}

const createOverlayWindow = () => {
    overlayWindow = new BrowserWindow({
        frame: false,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        show: false,
        opacity: overlayOpacity,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    })

    overlayWindow.setAlwaysOnTop(true, 'screen-saver')
    overlayWindow.setVisibleOnAllWorkspaces(true, {visibleOnFullScreen: true})
    overlayWindow.setMenuBarVisibility(false)

    const contents = overlayWindow.webContents

    contents.setWindowOpenHandler(({url}) => {
        if (url.startsWith('https:')) shell.openExternal(url)
        return {action: 'deny'}
    })

    contents.on('will-navigate', (event, url) => {
        if (url.startsWith('file:')) return

        let origin = null

        try {
            origin = new URL(url).origin
        } catch {
            origin = null
        }

        if (origin !== OVERLAY_ORIGIN) event.preventDefault()
    })

    contents.on('before-input-event', (event, input) => {
        if (input.type === 'keyDown' && input.key === 'Escape') {
            event.preventDefault()
            hideOverlay()
        }
    })

    contents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
        if (!isMainFrame || errorCode === -3) return

        loadFailed = true
        showLoadError(`${errorDescription || 'ERR_UNKNOWN'} (${errorCode})`)
        scheduleRetry()
    })

    contents.on('did-finish-load', () => {
        if (contents.getURL().startsWith(OVERLAY_URL)) {
            loadFailed = false
            retryDelay = RETRY_DELAY_MIN_MS
            clearRetryTimer()
        }
    })

    overlayWindow.once('ready-to-show', () => {
        overlayReady = true
        if (wantVisible) showOverlay()
    })

    overlayWindow.on('closed', () => {
        clearRetryTimer()
        overlayWindow = null
        overlayReady = false
        wantVisible = false
    })

    overlayWindow.loadURL(OVERLAY_URL)
}

const showOverlay = () => {
    wantVisible = true

    if (!overlayWindow) {
        createOverlayWindow()
        return
    }

    if (!overlayReady) return

    const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())

    overlayWindow.setBounds(display.bounds)
    overlayWindow.show()
    overlayWindow.focus()

    if (loadFailed) {
        clearRetryTimer()
        retryDelay = RETRY_DELAY_MIN_MS
        overlayWindow.loadURL(OVERLAY_URL)
    }
}

const hideOverlay = () => {
    wantVisible = false

    if (overlayWindow && overlayWindow.isVisible()) {
        overlayWindow.hide()
        clearRetryTimer()
    }
}

const toggleOverlay = () => {
    if (wantVisible) {
        hideOverlay()
    } else {
        showOverlay()
    }
}

const syncOverlayBounds = () => {
    if (!overlayWindow || !overlayWindow.isVisible()) return

    const display = screen.getDisplayMatching(overlayWindow.getBounds())

    overlayWindow.setBounds(display.bounds)
}

const setOverlayOpacity = (value) => {
    overlayOpacity = value
    if (overlayWindow) overlayWindow.setOpacity(value)
    updateTray()
}

const quit = () => {
    clearRetryTimer()

    if (overlayWindow) {
        overlayWindow.destroy()
        overlayWindow = null
    }

    if (tray) {
        tray.destroy()
        tray = null
    }

    app.quit()
}

const buildTrayMenuTemplate = () => {
    const template = [
        {label: `Toggle overlay (${TOGGLE_SHORTCUT})`, click: toggleOverlay},
    ]

    if (!shortcutRegistered) {
        template.push({label: `Hotkey ${TOGGLE_SHORTCUT} unavailable (taken by another app)`, enabled: false})
    }

    template.push(
        {
            label: 'Opacity',
            submenu: OPACITY_LEVELS.map((value) => ({
                label: `${Math.round(value * 100)}%`,
                type: 'radio',
                checked: value === overlayOpacity,
                click: () => setOverlayOpacity(value),
            })),
        },
        {label: 'Open in browser', click: () => shell.openExternal(OVERLAY_URL)},
        {label: `Version ${app.getVersion()}`, enabled: false},
        {type: 'separator'},
        {label: 'Exit', click: quit},
    )

    return template
}

const updateTray = () => {
    if (!tray) return

    const hint = shortcutRegistered ? TOGGLE_SHORTCUT : `hotkey ${TOGGLE_SHORTCUT} unavailable`

    tray.setToolTip(`PUBG Map Overlay (${hint})`)
    tray.setContextMenu(Menu.buildFromTemplate(buildTrayMenuTemplate()))
}

const createTray = () => {
    const icon = nativeImage.createFromPath(TRAY_ICON_PATH)

    tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon)
    tray.on('click', toggleOverlay)
    updateTray()
}

if (!app.requestSingleInstanceLock()) {
    app.quit()
} else {
    app.on('second-instance', () => {
        showOverlay()
    })

    app.whenReady().then(() => {
        app.dock?.hide()

        shortcutRegistered = globalShortcut.register(TOGGLE_SHORTCUT, toggleOverlay)
        if (!shortcutRegistered) console.error(`Failed to register global shortcut ${TOGGLE_SHORTCUT}`)

        screen.on('display-removed', syncOverlayBounds)
        screen.on('display-metrics-changed', syncOverlayBounds)

        createTray()
    })

    app.on('will-quit', () => {
        globalShortcut.unregisterAll()
    })

    app.on('window-all-closed', (event) => {
        event.preventDefault()
    })
}
