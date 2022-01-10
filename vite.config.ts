import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import middleware from './src/middleware'

export default defineConfig({
	plugins: [react(), {
		name: 'api',
		configureServer(server) {
			server.middlewares.use(middleware)
		}
	}]
})
