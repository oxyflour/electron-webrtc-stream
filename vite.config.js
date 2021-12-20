import { exec } from 'child_process'

/**
 * @type {Record<string, import('http').ServerResponse>}
 */
const servers = { }

/**
 * @type {Record<string, import('http').ServerResponse>}
 */
const clients = { }

async function start(id) {
	const STARTUP_URL = `http://localhost:3000/?serve-${id}`
	exec('npx electron .', { shell: true, env: { ...process.env, STARTUP_URL } })
	let retry = 10
	while ((retry --) > 0 && !servers[id]) {
		console.log(`waiting ${id} to connect, retry ${retry}`)
		await new Promise(resolve => setTimeout(resolve, 1000))
	}
	if (!servers[id]) {
		throw Error(`fork timeout`)
	}
}

async function api(req) {
	const { url = '' } = req,
		action = url.slice('/api/'.length),
		data = await new Promise((resolve, reject) => {
			let ret = ''
			req.on('data', chunk => ret += chunk + '')
			req.on('error', err => reject(err))
			req.on('end', () => resolve(ret))
		})
	if (action === 'proxy') {
		const { server, client } = JSON.parse(data),
			peer = server ? servers[server] : clients[client]
		if (peer) {
			peer.write(`data: ${data}\n\n`)
		} else {
			throw Error(`no peer found`)
		}
	}
}

/**
 * 
 * @param {import('vite').Connect.IncomingMessage} req 
 * @param {import('http').ServerResponse} res 
 * @param {import('vite').Connect.NextFunction} next 
 */
const middleware = (req, res, next) => {
	const { url = '' } = req
	if (url.startsWith('/peer/')) {
		const [, , id, action] = url.split('/')
		res.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
			'Access-Control-Allow-Origin': '*'
		})
		if (action === 'server') {
			servers[id] = res
			res.on('close', () => delete servers[id])
		} else if (action === 'client') {
			clients[id] = res
			res.on('close', () => delete clients[id])
			if (!servers[id]) {
				start(id)
			}
		}
	} else if (url.startsWith('/api/')) {
		api(req)
			.then(ret => res.end(JSON.stringify({ ret })))
			.catch(err => res.end(JSON.stringify({ err: { message: err.message } })))
	} else {
		next()
	}
}

/**
 * @type {import('vite').UserConfig}
 */
const config = {
	plugins: [{
		name: 'api',
		configureServer(server) {
			server.middlewares.use(middleware)
		}
	}]
}

export default config
