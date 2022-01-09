// @ts-check
import connect from '../common/connect'

/**
 * 
 * @param { Object } param0 
 * @param { number } param0.width
 * @param { number } param0.height
 * @returns { Promise<MediaStreamConstraints> }
 */
async function getConstrain({ width, height }) {
	const id = document.title = Math.random().toString(16).slice(2, 10),
		{ ipcRenderer } = require('electron')
	const sources = await ipcRenderer.invoke('desktop-get-sources', { types: ['window'] }),
		source = sources.find(item => item.name.includes(id))
	if (!source) {
		throw Error(`source is not found`)
	}
	return {
		audio: false,
		video: {
			// @ts-ignore
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

/**
 * 
 * @param { string } id 
 * @param { Object } opts
 * @param { number } opts.width
 * @param { number } opts.height
 */
export default async function start(id, { width, height }) {
	const conn = new RTCPeerConnection(),
		api = await connect(`/peer/${id}/send`)
	api.on('candidate', data => {
		data && conn.addIceCandidate(new RTCIceCandidate(data))
	})
	conn.addEventListener('icecandidate', evt => {
		api.emit('candidate', evt.candidate)
	})
	const constrain = await getConstrain({ width, height }),
		stream = await navigator.mediaDevices.getUserMedia(constrain)
	for (const track of stream.getTracks()) {
		conn.addTrack(track)
	}
	const offer = await conn.createOffer()
	await conn.setLocalDescription(offer)
	await api.emit('offer', offer)
	const answer = await new Promise(resolve => api.once('answer', resolve))
	await conn.setRemoteDescription(new RTCSessionDescription(answer))
	return conn
}
