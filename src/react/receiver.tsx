import { useEffect, useRef, useState } from "react"
import connect, { Api } from "../www/connect"
import recv from "../www/recv"

export default function Receiver({ channel, ...rest }: {
	channel: string
} & React.DetailedHTMLProps<React.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>) {
	const ref = useRef<HTMLVideoElement>(),
		video = ref.current,
		[err, setErr] = useState<any>(),
		[api, setApi] = useState<Api | undefined>(),
		[loading, setLoading] = useState(false),
		[peer, setPeer] = useState({
			conn: null as null | RTCPeerConnection,
			streams: [] as MediaStream[],
			channels: [] as RTCDataChannel[]
		})

	async function start(api: Api, video: HTMLVideoElement) {
		setErr(null)
		setPeer({ conn: null, streams: [], channels: [] })
		setLoading(true)
		const width = video.width = video.scrollWidth,
			height = video.height = video.scrollHeight,
			id = Math.random().toString(16).slice(2, 10)
		try {
			await api.send('start', { id, opts: { width, height } })
			const peer = await recv(id)
			video.srcObject = peer.streams[0]
			video.play()
			setPeer(peer)
		} catch (err) {
			setErr(err)
		}
		setLoading(false)
	}

	useEffect(() => {
		let api: Api
		connect(channel, 'recv')
			.then(ret => setApi(api = ret))
			.catch(err => setErr(err))
		return () => api?.close()
	}, [channel])

	useEffect(() => {
		api?.on('pong', ({ now }) => {
			console.log('ping', Date.now() - now)
		})
		const timer = setInterval(() => {
			api?.send('ping', { now: Date.now() })
		}, 10000)
		return () => clearInterval(timer)
	}, [api])

	useEffect(() => {
		let isDown = false
		const cbs = [
			'pointerdown', 'pointermove', 'pointerup',
			'mousedown', 'mousemove', 'mouseup',
			'click', 'dblclick',
		].map((type => {
			function func({ button, clientX, clientY }: PointerEvent | MouseEvent) {
				if (type.endsWith('down')) isDown = true
				if (type.endsWith('up')) isDown = false
				if (type.endsWith('move') && !isDown) return
				const [channel] = peer.channels
				channel?.send(JSON.stringify({
					evt: type.startsWith('pointer') ? 'pointer' : 'mouse',
					data: { type, button, clientX, clientY }
				}))
			}
			window.addEventListener(type as any, func)
			return { type, func } as any
		}))
		function onStateChange() {
			const state = peer.conn?.connectionState
			console.log(state)
			if (state === 'failed') {
				setErr('connection ' + state)
			}
		}
		peer.conn?.addEventListener('connectionstatechange', onStateChange)
		return () => {
			cbs.forEach(({ type, func }) => window.removeEventListener(type, func))
			peer.conn?.removeEventListener('connectionstatechange', onStateChange)
		}
	}, [peer])

	return <>
		<div style={{ position: 'absolute', bottom: 0, padding: 8, zIndex: 100 }}>
		{
			err && <div>
				{ err && err.message || `${err}` }
			</div>
		}
		{
			api && video ? <div>
				<button
					disabled={ loading }
					onClick={ () => start(api, video) }>
					connect
				</button>
			</div> :
			<div>
				loading...
			</div>
		}
		</div>
		<video ref={ ref } { ...rest } />
	</>
}
