// @ts-check
import EventEmitter from 'event-emitter'

/**
 * 
 * @param { string } url 
 * @returns { Promise<import('event-emitter').Emitter & { emit: (evt: string, data: any) => Promise<any> }> }
 */
export default async function connect(url) {
	const sse = new EventSource(url),
		ret = EventEmitter(),
		emit = ret.emit.bind(ret)
	sse.onmessage = event => {
		const { evt, data } = JSON.parse(event.data)
		emit(evt, data)
	}
	sse.onerror = err => {
		emit('error', err)
	}
	/**
	 * 
	 * @param { string } evt 
	 * @param { any } data 
	 */
	ret.emit = async (evt, data) => {
		const req = await fetch(url, {
				method: 'POST',
				body: JSON.stringify({ evt, data })
			}),
			{ err, ret } = await req.json()
		if (err) {
			throw Object.assign(Error(), err)
		}
		return ret
	}
	// @ts-ignore
	return ret
}
