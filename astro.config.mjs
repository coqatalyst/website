import { defineConfig } from 'astro/config';

export default defineConfig({
  base: '/website/',
  redirects: {
    '/website/blog': '/website/under-construction',
    '/website/contact': '/website/under-construction',
    '/website/about': '/website/under-construction',
  }
});