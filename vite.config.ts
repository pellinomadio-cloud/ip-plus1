import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'IQ-PLUS Trading',
          short_name: 'IQ-PLUS',
          description: 'Premium multi-asset trading platform for Crypto, Forex, Indices, and Commodities with live markets.',
          theme_color: '#070A0F',
          background_color: '#070A0F',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
      {
        name: 'bank-verification-api-middleware',
        configureServer(server) {
          const handleVerification = (req: any, res: any) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

            if (req.method === 'OPTIONS') {
              res.statusCode = 204;
              return res.end();
            }

            let body = '';
            req.on('data', (chunk: Buffer) => {
              body += chunk.toString();
            });

            req.on('end', async () => {
              let bankCode = '';
              let accountNumber = '';

              if (body) {
                try {
                  const json = JSON.parse(body);
                  bankCode = json.bank_code || json.bankCode || '';
                  accountNumber = json.account_number || json.accountNumber || '';
                } catch {
                  const params = new URLSearchParams(body);
                  bankCode = params.get('bank_code') || params.get('bankCode') || '';
                  accountNumber = params.get('account_number') || params.get('accountNumber') || '';
                }
              }

              // Fallback to query
              if (!bankCode || !accountNumber) {
                const url = new URL(req.url || '', 'http://localhost');
                bankCode = url.searchParams.get('bank_code') || url.searchParams.get('bankCode') || '';
                accountNumber = url.searchParams.get('account_number') || url.searchParams.get('accountNumber') || '';
              }

              if (!bankCode || !accountNumber) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                return res.end('Error: Missing bank code or account number');
              }

              try {
                const postParams = new URLSearchParams();
                postParams.append('bank_code', bankCode.trim());
                postParams.append('account_number', accountNumber.trim());

                const apiRes = await fetch('https://api.wtproject.space/vrf/verify.php', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: postParams.toString(),
                });

                const text = await apiRes.text();
                res.statusCode = apiRes.status;
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.end(text.trim());
              } catch {
                res.statusCode = 502;
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.end('Error: Failed to connect to verification server');
              }
            });
          };

          server.middlewares.use('/api/verify-bank', handleVerification);
          server.middlewares.use('/api/verify', handleVerification);
          server.middlewares.use('/api/proxy-verify', handleVerification);
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
