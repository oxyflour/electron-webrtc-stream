import { Scene, Engine, Vector3, HemisphericLight, Mesh, FreeCamera } from 'babylonjs'
import EventEmitter from 'event-emitter'

async function post(url, data) {
	const req = await fetch(url, {
		method: 'POST',
		body: JSON.stringify(data)
	})
	return await req.json()
}

async function recv(url) {
	const sse = new EventSource(url),
		ret = EventEmitter()
	sse.onmessage = evt => {
		const { event, data } = JSON.parse(evt.data)
		ret.emit(event, data)
	}
	sse.onerror = err => {
		ret.emit('error', err)
	}
	return ret
}

function makeVideo() {
	const video = document.createElement('video')
	document.body.style.margin = document.body.style.padding = '0'
	video.width = window.innerWidth
	video.height = window.innerHeight
	document.body.appendChild(video)
	return video
}

function startRendering() {
	const canvas = document.createElement('canvas')
	document.body.style.margin = document.body.style.padding = '0'
	canvas.width = window.innerWidth
	canvas.height = window.innerHeight
	document.body.appendChild(canvas)

	const engine = new Engine(canvas, true),
		scene = new Scene(engine),
		camera = new FreeCamera('cm', new Vector3(0, 5, 0))
	camera.setTarget(Vector3.Zero())
	camera.attachControl(canvas, false)

	const light = new HemisphericLight('lg', new Vector3(0, 1, 0), scene),
		shpere = Mesh.CreateSphere('sp', 16, 2, scene)
	engine.runRenderLoop(() => scene.render())
	window.addEventListener('resize', () => engine.resize())
}

function getStream(conn) {
	return new Promise((resolve, reject) => {
		setTimeout(() => reject(Error(`timeout`)), 30 * 1000)
		conn.addEventListener('track', event => {
			const [stream] = event.streams
			if (stream) {
				resolve(stream)
			} else if (event.track) {
				const stream = new MediaStream()
				stream.addTrack(event.track)
				resolve(stream)
			} else {
				reject(Error(`no stream`))
			}
		})
	})
}

async function startRecving(id) {
	const conn = new RTCPeerConnection(),
		sse = await recv(`/peer/${id}/client`)
	sse.on('candidate', data => {
		data && conn.addIceCandidate(new RTCIceCandidate(data))
	})
	conn.addEventListener('icecandidate', evt => {
		post('/api/proxy', { server: id, event: 'candidate', data: evt.candidate })
	})
	const ret = getStream(conn)
	const offer = await new Promise(resolve => sse.once('offer', resolve))
	await conn.setRemoteDescription(new RTCSessionDescription(offer))
	const answer = await conn.createAnswer()
	await conn.setLocalDescription(answer)
	await post('/api/proxy', { server: id, event: 'answer', data: answer })
	return await ret
}

async function getConstrain() {
	const id = document.title = Math.random().toString(16).slice(2, 10),
		{ desktopCapturer } = require('electron'),
		sources = await desktopCapturer.getSources({ types: ['window'] }),
		source = sources.find(item => item.name.includes(id))
	if (!source) {
		throw Error(`source is not found`)
	}
	return {
		audio: false,
		video: {
			mandatory: {
				chromeMediaSource: 'desktop',
				chromeMediaSourceId: source.id,
				minWidth: 1280,
				maxWidth: 1280,
				minHeight: 720,
				minHeight: 720,
			}
		}
	}
}

async function startCapturing(id) {
	const conn = new RTCPeerConnection(),
		sse = await recv(`/peer/${id}/server`)
	sse.on('candidate', data => {
		data && conn.addIceCandidate(new RTCIceCandidate(data))
	})
	conn.addEventListener('icecandidate', evt => {
		post('/api/proxy', { client: id, event: 'candidate', data: evt.candidate })
	})
	const constrain = await getConstrain(),
		stream = await navigator.mediaDevices.getUserMedia(constrain)
	for (const track of stream.getTracks()) {
		conn.addTrack(track)
	}
	const offer = await conn.createOffer()
	await conn.setLocalDescription(offer)
	await post('/api/proxy', { client: id, event: 'offer', data: offer })
	const answer = await new Promise(resolve => sse.once('answer', resolve))
	await conn.setRemoteDescription(new RTCSessionDescription(answer))
}

if (location.search.startsWith('?render-')) {
	const id = location.search.slice('?render-'.length),
		video = makeVideo()
	startRecving(id).then(src => {
		video.srcObject = src
		video.controls = true
	})
} else if (location.search.startsWith('?serve-')) {
	const id = location.search.slice('?serve-'.length)
	startRendering()
	startCapturing(id)
} else {
	location.search = 'render-' + Math.random().toString(16).slice(2, 10)
}
