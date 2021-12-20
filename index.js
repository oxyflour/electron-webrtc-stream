const { app, BrowserWindow } = require('electron')

// https://github.com/electron/electron/issues/23254
app.commandLine.appendSwitch('webrtc-max-cpu-consumption-percentage', '100')

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
	win.loadURL(process.env.STARTUP_URL)
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})
