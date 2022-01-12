const { app, BrowserWindow, ipcMain, desktopCapturer } = require('electron')

// https://github.com/electron/electron/issues/23254
app.commandLine.appendSwitch('webrtc-max-cpu-consumption-percentage', '100')

app.whenReady().then(() => {
	const win = new BrowserWindow({
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
