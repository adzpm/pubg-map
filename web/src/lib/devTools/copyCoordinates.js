const formatPoint = ({x, y}) => `{ x: ${x}, y: ${y}, name: '...' }`

const writeToClipboard = async (text) => {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        return
    }
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
}

export const copyCoordinatesTool = {
    id: 'copyCoordinates',
    name: 'Copy coordinates',
    description: 'Click anywhere on the map to copy { x, y, name } JSON',
    icon: 'bi-clipboard',
    defaultEnabled: true,
    handlers: {
        onMapClick: async ({x, y}) => {
            try {
                await writeToClipboard(formatPoint({x, y}))
            } catch (err) {
                console.error('[devTools] copyCoordinates failed', err)
            }
        },
    },
}
