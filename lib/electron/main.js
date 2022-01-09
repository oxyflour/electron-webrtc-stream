const { app, BrowserWindow, ipcMain, desktopCapturer } = require('electron')

// https://github.com/electron/electron/issues/23254
app.commandLine.appendSwitch('webrtc-max-cpu-consumption-percentage', '100')

/**
 * @type { BrowserWindow }
 */
app.whenReady().then(() => {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		}
	})
	win.setMenuBarVisibility(false)
	win.webContents.openDevTools({ mode: 'detach' })
	win.loadURL(process.env.STARTUP_URL)
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

ipcMain.handle('desktop-get-sources', async (_, opts) => {
	return desktopCapturer.getSources(opts)
})

ipcMain.handle('app-exit', async (_, err) => {
	err && console.error(err)
	app.exit(err ? -1 : 0)
})
