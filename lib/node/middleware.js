// @ts-check
import { spawn } from 'child_process'
import query from '../common/query'

/**
 * @type {Record<string, import('http').ServerResponse>}
 */
const servers = { }

/**
 * @type {Record<string, import('http').ServerResponse>}
 */
const clients = { }

/**
 * 
 * @param { string } id 
 * @param { object } opts 
 */
async function start(id, opts) {
	const search = query.join({ send: id, opts: JSON.stringify(opts) }),
		STARTUP_URL = `http://localhost:3000/?${search}`,
		cmd = 'npx electron lib/electron/main.js',
		proc = spawn(cmd, [], { env: { ...process.env, STARTUP_URL }, shell: true })
	proc.stdout.pipe(process.stdout)
	proc.stderr.pipe(process.stderr)
	let retry = 10
	while ((retry --) > 0 && !servers[id]) {
		console.log(`waiting ${id} to connect, retry ${retry}`)
		await new Promise(resolve => setTimeout(resolve, 1000))
	}
	if (!servers[id]) {
		throw Error(`fork timeout`)
	}
}

/**
 * 
 * @param {import('vite').Connect.IncomingMessage} req 
 * @param {import('http').ServerResponse} res 
 * @param {import('vite').Connect.NextFunction} next 
 */
export default async (req, res, next) => {
	const { url = '', method } = req
	if (url.startsWith('/peer/')) {
		const [path = '', search = ''] = url.split('?'),
			[, , id, action] = path.split('/')
		if (method === 'GET') {
			res.writeHead(200, {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
				'Access-Control-Allow-Origin': '*'
			})
			if (action === 'send') {
				servers[id] = res
				res.on('close', () => delete servers[id])
			} else if (action === 'recv') {
				clients[id] = res
				res.on('close', () => delete clients[id])
				if (!servers[id]) {
					try {
						await start(id, JSON.parse(query.parse(search).opts))
						res.write(`data: ${JSON.stringify({ evt: 'ready' })}\n\n`)
					} catch (err) {
						res.write(`data: ${JSON.stringify({ evt: 'error' })}\n\n`)
					}
				} else {
					res.write(`data: ${JSON.stringify({ evt: 'ready' })}\n\n`)
				}
			}
		} else if (method === 'POST') {
			const data = await new Promise((resolve, reject) => {
				let ret = ''
				req.on('data', chunk => ret += chunk + '')
				req.on('error', err => reject(err))
				req.on('end', () => resolve(ret))
			})
			if (action === 'send') {
				const peer = clients[id]
				peer && peer.write(`data: ${data}\n\n`)
			} else if (action === 'recv') {
				const peer = servers[id]
				peer && peer.write(`data: ${data}\n\n`)
			}
			res.end('{}')
		}
	} else {
		next()
	}
}
