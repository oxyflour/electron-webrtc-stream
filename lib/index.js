// @ts-check
import { Scene, Engine, Vector3, HemisphericLight, Mesh, FreeCamera } from 'babylonjs'
import startRecving from './node/recv'
import startSending from './electron/send'

document.body.style.margin = document.body.style.padding = '0'

const { href } = location,
	url = new URL(href),
	{ searchParams } = url,
	opts = JSON.parse(searchParams.get('opts') || '{}')
if (searchParams.get('recv')) {
	const id = searchParams.get('recv'),
		video = document.createElement('video'),
		width = video.width = window.innerWidth,
		height = video.height = window.innerHeight
	document.body.appendChild(video)
	video.addEventListener('click', () => {
		startRecving(id, { width, height, href }).then(src => {
			video.srcObject = src
			video.play()
		})
	})

} else if (searchParams.has('recv')) {
	searchParams.set('recv', Math.random().toString(16).slice(2, 10))
	location.href = url.toString()

} else {
	const canvas = document.createElement('canvas')
	canvas.width = opts.width || window.innerWidth
	canvas.height = opts.height || window.innerHeight
	document.body.appendChild(canvas)

	const engine = new Engine(canvas, true),
		scene = new Scene(engine),
		camera = new FreeCamera('cm', new Vector3(5, 0, 0), scene)
	camera.setTarget(Vector3.Zero())
	camera.attachControl(canvas, false)

	const light = new HemisphericLight('lg', new Vector3(0, 1, 0), scene),
		shpere = Mesh.CreateSphere('sp', 16, 2, scene)
	engine.runRenderLoop(() => scene.render())
	window.addEventListener('resize', () => engine.resize())

	const id = searchParams.get('send')
	if (id) {
		if (opts.width && opts.height) {
			const width = opts.width + (window.outerWidth - window.innerWidth),
				height = opts.height + (window.outerHeight - window.innerHeight)
			window.resizeTo(width, height)
		}
		const { ipcRenderer } = require('electron')
		startSending(id, opts)
			.then(conn => {
				conn.addEventListener('connectionstatechange', evt => {
					const state = conn.connectionState
					if (state === 'disconnected' || state === 'failed') {
						ipcRenderer.invoke('app-exit', { message: 'disconnected' })
					}
				})
			})
			.catch(err => {
				console.error(err)
				ipcRenderer.invoke('app-exit', err)
			})
	}
}
