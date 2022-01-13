import { debounce } from "debounce"
import { useEffect, useRef, useState } from "react"
import connect, { Api } from "../www/connect"
import recv from "../www/recv"

export default function Receiver({ channel, children, peerOpts, ...rest }: {
	channel: string
	peerOpts?: RTCConfiguration
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
		setLoading(true)
		const width = video.width = video.scrollWidth,
			height = video.height = video.scrollHeight,
			{ devicePixelRatio } = window,
			{ href } = location,
			opts = { width, height, devicePixelRatio },
			id = Math.random().toString(16).slice(2, 10)
		try {
			await api.send('start', { id, opts, href })
			const peer = await recv(id, peerOpts)
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
		if (api && video) {
			start(api, video)
		}
		api?.on('pong', ({ now }) => {
			console.log('ping', Date.now() - now)
		})
		const timer = setInterval(() => {
			api?.send('ping', { now: Date.now() })
		}, 10000)
		return () => clearInterval(timer)
	}, [api])

	useEffect(() => {
		const cbs = [
			'pointerdown', 'pointermove', 'pointerup',
			'mousedown', 'mousemove', 'mouseup', 'click', 'dblclick',
			'wheel',
		].map((type => {
			function func({ button, clientX, clientY, deltaX, deltaY }: any) {
				const [channel] = peer.channels,
					evt = type === 'wheel' ? 'wheel' :
						type.startsWith('pointer') ? 'pointer' :
						'mouse',
					data = { type, button, clientX, clientY, deltaX, deltaY }
				channel?.send(JSON.stringify({ evt, data }))
			}
			window.addEventListener(type as any, func)
			return { type, func } as any
		}))
		const onWindowResize = debounce(() => api && video && start(api, video), 500)
		window.addEventListener('resize', onWindowResize)
		const onStateChange = () => peer.conn?.connectionState === 'failed' && setErr('connect failed')
		peer.conn?.addEventListener('connectionstatechange', onStateChange)
		return () => {
			cbs.forEach(({ type, func }) => window.removeEventListener(type, func))
			window.removeEventListener('resize', onWindowResize)
			peer.conn?.removeEventListener('connectionstatechange', onStateChange)
			peer.conn?.close()
		}
	}, [peer])

	return <>
		{
			(err || loading) &&
			<div style={{
				position: 'absolute',
				zIndex: 100,
				left: '50%',
				top: '50%',
				transform: 'translate(-50%, -50%)',
				background: '#ddd',
				textAlign: 'center',
				padding: 8,
			}}>
			{
				err ? <div style={{ cursor: 'pointer' }}
						onClick={ () => api && video && start(api, video) }>
					Error: { `${err && err.meessage || err}` }, click to retry
				</div> :
				<div>
					loading...
				</div>
			}
			</div>
		}
		<video muted ref={ ref } style={{ objectFit: 'cover' }} { ...rest } />
	</>
}
