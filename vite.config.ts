import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// Single-page app: Tauri serves the built files, and every route falls back to index.html.
			adapter: adapter({ fallback: 'index.html' })
		})
	],
	// Tauri expects the dev server on a fixed port and shows its own errors.
	clearScreen: false,
	server: {
		port: 5173,
		strictPort: true,
		watch: { ignored: ['**/src-tauri/**'] }
	},
	test: {
		expect: { requireAssertions: true },
		coverage: {
			provider: 'v8',
			// Logic outside the pages lives in src/lib; the generated shadcn-svelte files are excluded.
			include: ['src/lib/**/*.ts'],
			exclude: ['src/lib/**/*.test.ts', 'src/lib/components/ui/**', 'src/lib/utils.ts']
		},
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.test.ts']
				}
			}
		]
	}
});
