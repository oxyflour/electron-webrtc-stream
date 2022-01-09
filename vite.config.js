// @ts-check
import middleware from './lib/node/middleware'

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
