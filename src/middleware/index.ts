import { spawn } from 'child_process'
import { ServerResponse } from 'http'
import { Connect } from 'vite'

const peers = { } as Record<string, { id: string, role: string, res: ServerResponse }[]>

async function start(channel: string) {
	const cmd = 'npx electron -r ts-node/register src/electron/main.ts',
		url = `http://localhost:3000?send=${channel}`,
		env = { ...process.env, STARTUP_URL: url },
		proc = spawn(cmd, [], { env, shell: true })
	proc.stdout.pipe(process.stdout)
	proc.stderr.pipe(process.stderr)

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

			const { evt } = JSON.parse(`${data}`)
			if (evt === 'start' && !peers[channel]?.find(peer => peer.role === 'send')) {
				await start(channel)
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
