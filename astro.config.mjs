import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://coqatalyst.github.io/',
  base: '/website/',
  redirects: {
    '/blog': '/under-construction',
    '/contact': '/under-construction',
    '/about': '/under-construction',
  }
});
