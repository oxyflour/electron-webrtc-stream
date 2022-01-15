import { spawn } from 'child_process'
import { ServerResponse } from 'http'
import { Connect } from 'vite'

const peers = { } as Record<string, { id: string, role: string, res: ServerResponse }[]>

async function start(channel: string, href: string) {
	const url = new URL(href)
	url.searchParams.set('send', channel)
	const cmd = `docker run ` +
			`--gpus all ` +
			`-e STARTUP_URL="${url.toString()}" ` +
			`-e DISPLAY="${process.env.DISPLAY}" ` +
			`-v /tmp/.X11-unix:/tmp/.X11-unix ` +
			`nvidia-electron`,
		env = { ...process.env, STARTUP_URL: url.toString() },
		proc = spawn(cmd, [], { env, shell: true })
	console.log(cmd)
	proc.stdout.pipe(process.stdout as any)
	proc.stderr.pipe(process.stderr as any)

	let retry = 10
	while ((retry -- > 0) && !peers[channel]?.find(peer => peer.role === 'send')) {
		await new Promise(resolve => setTimeout(resolve, 1000))
	}
	if (retry == 0) {
		throw Error(`start timeout`)
	}
}

export default async (req: Connect.IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
	const { url, method } = req
	if (url.startsWith('/channel/')) {
		const [, , channel, role, id] = url.split('/')
		if (method === 'GET') {
			res.writeHead(200, {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
				'Access-Control-Allow-Origin': '*'
			})
			const arr = peers[channel] || (peers[channel] = [])
			arr.push({ id, role, res })
			res.on('close', () => peers[channel] = peers[channel].filter(peer => peer.id !== id))
		} else if (method === 'POST') {
			const data = await new Promise((resolve, reject) => {
				let ret = ''
				req.on('data', chunk => ret += chunk + '')
				req.on('error', err => reject(err))
				req.on('end', () => resolve(ret))
			})

			const val = JSON.parse(`${data}`)
			if (val.evt === 'start' && !peers[channel]?.find(peer => peer.role === 'send')) {
				await start(channel, `${val.data?.href}`)
			}

			const arr = peers[channel] || []
			for (const { res } of arr.filter(peer => peer.id !== id)) {
				res.write(`data: ${data}\n\n`)
			}

			res.end('{}')
		}
	} else {
		next()
	}
}
