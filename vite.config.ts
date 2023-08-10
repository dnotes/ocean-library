import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import polyfill from 'rollup-plugin-polyfill-node'

export default defineConfig({
	plugins: [sveltekit(),polyfill()],
	server: {
		fs: {
			allow: [
				'./content',
			]
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
