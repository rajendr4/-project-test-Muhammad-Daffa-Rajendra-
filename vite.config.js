import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://suitmedia-backend.suitdev.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('Content-Type', 'application/json');
          });
          
          proxy.on('error', (err, req, res) => {
            console.error('API Proxy error:', err);
            res.writeHead(500, {
              'Content-Type': 'text/plain',
            });
            res.end('API proxy error');
          });
        }
      },
      
      
      '/proxy-image': {
        target: 'https://assets.suitdev.com',
        changeOrigin: true,
        secure: true,
        followRedirects: true,
        rewrite: (path) => {
          const newPath = path.replace(/^\/proxy-image/, '');
          console.log('Image proxy rewrite:', path, '->', newPath);
          return newPath;
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Image proxy request:', req.method, req.url);
            
          
            proxyReq.removeHeader('referer');
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('x-forwarded-for');
            proxyReq.removeHeader('x-forwarded-proto');
            proxyReq.removeHeader('x-forwarded-host');
            
      
            proxyReq.setHeader('Accept', 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8');
            proxyReq.setHeader('Accept-Encoding', 'gzip, deflate, br');
            proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
            proxyReq.setHeader('Cache-Control', 'no-cache');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            
            // Add timeout handling
            proxyReq.setTimeout(10000, () => {
              console.log('Image proxy request timeout');
              proxyReq.abort();
            });
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Image proxy response:', proxyRes.statusCode, proxyRes.statusMessage);
            
            if (proxyRes.statusCode === 200) {
              res.setHeader('Cache-Control', 'public, max-age=3600');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            }
          });
          
          proxy.on('error', (err, req, res) => {
            console.error('Image proxy error:', err.message);
            
            if (!res.headersSent) {
              res.writeHead(404, {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*'
              });
              res.end('Image not found');
            }
          });
        }
      }
    }
  },
  
  
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        }
      }
    }
  }
})