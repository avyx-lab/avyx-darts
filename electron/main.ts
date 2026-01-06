import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
// import { isElectron } from '../src/core/platform' // Removed to avoid rootDir issue

// Note: We avoid importing from src/ directly in main process if not compiled together.
// For simplicity, we keep main process logic isolated or use a shared build.

process.env.DIST = join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : join(__dirname, '../public')

let win: BrowserWindow | null = null
// Here, you can also set up preload script
const preload = join(__dirname, './preload.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow() {
    win = new BrowserWindow({
        title: 'Avyx Core',
        width: 1200,
        height: 800,
        icon: join(process.env.VITE_PUBLIC || '', 'favicon.ico'),
        webPreferences: {
            preload,
            nodeIntegration: false,
            contextIsolation: true,
        },
    })

    // Disable menu for cleaner look (can be re-enabled or custom menu added)
    // win.setMenu(null)

    if (process.env.VITE_DEV_SERVER_URL) {
        await win.loadURL(url!)
        win.webContents.openDevTools()
    } else {
        await win.loadFile(indexHtml)
    }

    // Open external links in default browser
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) shell.openExternal(url)
        return { action: 'deny' }
    })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    win = null
    if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
    if (win) {
        // Focus on the main window if the user tried to open another
        if (win.isMinimized()) win.restore()
        win.focus()
    }
})

app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows()
    if (allWindows.length === 0) createWindow()
})

// Example IPC handler
ipcMain.handle('get-app-version', () => {
    return app.getVersion()
})
