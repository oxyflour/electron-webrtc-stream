import { useEffect, useState } from "react"
import connect, { Api } from "../www/connect"
import send from "../www/send"

export default function Sender({ channel, children }: {
	channel: string
	children?: any
}) {
	const [api, setApi] = useState<Api | undefined>()

	useEffect(() => {
		let api: Api
		connect(channel, 'send')
			.then(ret => setApi(api = ret))
			.catch(err => console.error(err))
		return () => api?.close()
	}, [channel])

	useEffect(() => {
		api?.on('start', async ({ id, opts }) => {
			if (opts.width && opts.height) {
				const width = opts.width + (window.outerWidth - window.innerWidth),
					height = opts.height + (window.outerHeight - window.innerHeight)
				window.resizeTo(width, height)
			}
			const { data } = await send(id, opts)
			data.addEventListener('message', event => {
				const { evt, data } = JSON.parse(event.data),
					{ type, clientX, clientY, ...rest } = data || { },
					elem = document.elementFromPoint(clientX, clientY),
					params = { view: window, bubbles: true, cancelable: true, clientX, clientY, ...rest }
				if (evt === 'pointer') {
					elem && elem.dispatchEvent(new PointerEvent(type, params))
				} else if (evt === 'mouse') {
					elem && elem.dispatchEvent(new MouseEvent(type, params))
				} else if (evt === 'wheel') {
					elem && elem.dispatchEvent(new WheelEvent(type, params))
				}
			})
		})

		let lastActive = Date.now()
		api?.on('ping', data => {
			api.send('pong', data)
			lastActive = Date.now()
		})

		const timer = setInterval(() => {
			(Date.now() - lastActive > 60 * 1000) && window.close()
		}, 10000)
		return () => clearInterval(timer)
	}, [api])
	return <>
		{ children }
	</>
}
