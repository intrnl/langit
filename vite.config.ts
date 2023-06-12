import * as path from 'node:path';
import { defineConfig } from 'vite';

import solid from 'vite-plugin-solid';

import router from './lib/router-plugin';
import { flatRoutes } from './lib/router-plugin/flat-routes';

export default defineConfig({
	plugins: [
		solid(),
		router({
			dir: 'src/routes',
			routeDist: 'src/router-routes.ts',
			typedDist: 'src/router.ts',
			routes: (path) => {
				return flatRoutes(path);
			},
		}),
	],
	build: {
		minify: 'terser',
		sourcemap: true,
		target: 'esnext',
		modulePreload: {
			polyfill: false,
		},
	},
	resolve: {
		alias: {
			'~': path.join(__dirname, './src'),
		},
	},
});
