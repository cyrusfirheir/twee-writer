// vite.config.js
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
	base: "/twee-writer/",
	build: {
		rollupOptions: {
			input: {
				main: resolve(__dirname, 'index.html'),
				editor: resolve(__dirname, 'editor/index.html'),
			},
		},
	},
});