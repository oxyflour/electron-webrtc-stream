import connect from './connect'

async function getConstrain({ width, height }: {
	width: number
	height: number
}) {
	const id = document.title = Math.random().toString(16).slice(2, 10),
		{ ipcRenderer } = require('electron')
	await new Promise((resolve) => setTimeout(resolve, 200))
	const sources = await ipcRenderer.invoke('desktop-get-sources', { types: ['window'] }),
		source = sources.find(item => item.name.includes(id))
	if (!source) {
		throw Error(`source ${id} is not found`)
	}
	return {
		audio: false,
		video: {
			mandatory: {
				chromeMediaSource: 'desktop',
				chromeMediaSourceId: source.id,
				minWidth: width || 1280,
				maxWidth: width || 1280,
				maxHeight: height || 720,
				minHeight: height || 720,
			}
		}
	}
}

export default async function send(channel: string, opts: any) {
	const conn = new RTCPeerConnection(),
		api = await connect(channel)
	api.on('icecandidate', data => {
		data && conn.addIceCandidate(new RTCIceCandidate(data))
	})
	conn.addEventListener('icecandidate', evt => {
		api.send('icecandidate', evt.candidate)
	})
	conn.addEventListener('connectionstatechange', () => {
		const state = conn.connectionState
		if (state === 'connected' || state === 'failed') {
			api.close()
		}
	})

	const data = conn.createDataChannel('cmd'),
		constrain = await getConstrain(opts),
		stream = await navigator.mediaDevices.getUserMedia(constrain as any)
	for (const track of stream.getTracks()) {
		conn.addTrack(track)
	}

	const offer = await conn.createOffer()
	await conn.setLocalDescription(offer)
	await api.send('offer', offer)
	const answer = await api.wait('answer')
	await conn.setRemoteDescription(new RTCSessionDescription(answer))
	return { conn, data }
}
