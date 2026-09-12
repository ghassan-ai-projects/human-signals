import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const CONTENT_META = resolve(import.meta.dirname, 'public/content/build-meta.json');

/** The exact content manifest pointer produced by the last `content:build`. */
function readContentMeta(): { manifestPath: string; contentVersion: string; buildId: string } {
  if (!existsSync(CONTENT_META)) {
    return { manifestPath: 'content/manifest.json', contentVersion: 'unbuilt', buildId: 'unbuilt' };
  }
  return JSON.parse(readFileSync(CONTENT_META, 'utf8')) as ReturnType<typeof readContentMeta>;
}

/**
 * Injects the Content Security Policy and, for preview builds, the noindex directive.
 * Document 10 forbids `unsafe-eval` and external script, style, font and connect sources.
 */
function securityHeaders(mode: string): PluginOption {
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    // Vite injects a small inline style block for CSS code splitting.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'none'",
  ].join('; ');
  return {
    name: 'human-signals-security-headers',
    transformIndexHtml(html) {
      const tags: string[] = [`<meta http-equiv="Content-Security-Policy" content="${csp}">`];
      if (mode !== 'production') {
        tags.push('<meta name="robots" content="noindex, nofollow">');
      }
      return html.replace('<!--security-meta-->', tags.join('\n    '));
    },
  };
}

export default defineConfig(({ mode }) => {
  const meta = readContentMeta();
  return {
    base: process.env['VITE_BASE'] ?? '/',
    plugins: [react(), securityHeaders(mode)],
    define: {
      __CONTENT_MANIFEST_PATH__: JSON.stringify(meta.manifestPath),
      __CONTENT_VERSION__: JSON.stringify(meta.contentVersion),
      __CONTENT_BUILD_ID__: JSON.stringify(meta.buildId),
      __APP_MODE__: JSON.stringify(mode),
    },
    build: {
      target: 'es2022',
      sourcemap: true,
      reportCompressedSize: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/three') || id.includes('@react-three')) return 'anatomy3d';
            return undefined;
          },
        },
      },
    },
    server: { port: 5173, strictPort: true },
  };
});
