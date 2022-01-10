import { EventEmitter } from 'events'

export default async function connect(channel: string, role = '') {
	const id = Math.random().toString(16).slice(2, 10),
		url = `/channel/${channel}/${role || 'peer'}/${id}`,
		sse = new EventSource(url),
		ret = new EventEmitter()
	sse.onmessage = event => {
		const { evt, data } = JSON.parse(event.data)
		ret.emit(evt, data)
	}
	sse.onerror = err => {
		ret.emit('error', err)
	}
	return Object.assign(ret, {
		async send(evt: string, data = { } as any) {
			const req = await fetch(url, {
					method: 'POST',
					body: JSON.stringify({ evt, data })
				}),
				{ err, ret } = await req.json()
			if (err) {
				throw Object.assign(new Error(), err)
			}
			return ret
		},
		wait(evt: string) {
			return new Promise<any>(resolve => ret.once(evt, resolve))
		},
		close() {
			sse.close()
		},
	})
}

type Unwarp<T> = T extends Promise<infer U> ? U : T
export type Api = Unwarp<ReturnType<typeof connect>>
