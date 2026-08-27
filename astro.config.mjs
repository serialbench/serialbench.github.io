import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://serialbench.github.io',
  integrations: [vue()],
  vite: {
    plugins: [tailwindcss()],
  },
});
