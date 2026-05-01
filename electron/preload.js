const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('overlay', {
    hide: () => ipcRenderer.invoke('overlay:hide'),
    onClickThrough: (cb) => ipcRenderer.on('overlay:click-through', (_e, value) => cb(value)),
})
