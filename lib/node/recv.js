// @ts-check
import connect from '../common/connect'
import query from '../common/query'

/**
 * 
 * @param { RTCPeerConnection } conn 
 * @returns { Promise<MediaStream> }
 */
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

/**
 * 
 * @param { string } id 
 * @param { object } opts 
 * @param { number } opts.width
 * @param { number } opts.height
 * @param { string } opts.href
 * @returns { Promise<MediaStream> }
 */
export default async function start(id, opts) {
	const conn = new RTCPeerConnection(),
		search = query.join({ opts: JSON.stringify(opts) }),
		api = await connect(`/peer/${id}/recv?${search}`)
	await new Promise((resolve, reject) => {
		setTimeout(() => reject(new Error('timeout')), 10000)
		api.once('error', reject)
		api.once('ready', resolve)
	})
	api.on('candidate', data => {
		data && conn.addIceCandidate(new RTCIceCandidate(data))
	})
	conn.addEventListener('icecandidate', evt => {
		api.emit('candidate', evt.candidate)
	})
	const ret = getStream(conn)
	const offer = await new Promise(resolve => api.once('offer', resolve))
	await conn.setRemoteDescription(new RTCSessionDescription(offer))
	const answer = await conn.createAnswer()
	await conn.setLocalDescription(answer)
	await api.emit('answer', answer)
	return await ret
}
