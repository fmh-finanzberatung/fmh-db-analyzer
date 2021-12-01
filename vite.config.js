import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';

// https://vitejs.dev/config/
export default defineConfig({
  root: './front/', 
  plugins: [svelte({
    preprocess: sveltePreprocess()
  })],
});
