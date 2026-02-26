import { defineConfig } from 'astro/config';

export default defineConfig({
  base: '/website/',
  redirects: {
    '/blog': '/under-construction',
    '/contact': '/under-construction',
    '/about': '/under-construction',
  }
});
