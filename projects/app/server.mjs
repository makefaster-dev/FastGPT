/**
 * 生产自定义服务器：优先返回 scripts/precompress-static.mjs 生成的预压缩静态资源
 * （brotli / gzip 副本），其余请求全部交给 Next 的请求处理器。
 *
 * 仅拦截 GET/HEAD 且无 Range 头的静态资源请求（/_next/static/** 与 public/**），
 * 找不到预压缩副本时按原路径回退到 Next，行为与 `next start` 保持一致。
 * 注意：Docker 镜像使用 Next standalone 的 server.js 入口，不经过本文件；
 * 本入口服务于 `pnpm start` 直连部署路径。
 */
import { createServer } from 'http';
import { promises as fs, createReadStream } from 'fs';
import path from 'path';
import { parse } from 'url';
import next from 'next';
import { fileURLToPath } from 'url';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const port = parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.HOSTNAME || '0.0.0.0';

const nextStaticDir = path.join(appDir, '.next', 'static');
const publicDir = path.join(appDir, 'public');

const CONTENT_TYPES = {
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

/** 根据 URL 路径解析出磁盘上的静态文件位置；返回 null 表示不由本服务器处理。 */
const resolveStaticFile = (pathname) => {
  if (pathname.includes('..') || pathname.includes('\0')) return null;
  if (pathname.startsWith('/_next/static/')) {
    return {
      file: path.join(nextStaticDir, pathname.slice('/_next/static/'.length)),
      // 内容哈希文件：与 next start 相同的一年 immutable 缓存
      cacheControl: 'public, max-age=31536000, immutable'
    };
  }
  const ext = path.extname(pathname);
  if (CONTENT_TYPES[ext] && !pathname.startsWith('/_next/')) {
    return {
      file: path.join(publicDir, pathname),
      // public 目录：与 next start 默认一致，依赖 ETag 重新验证
      cacheControl: 'public, max-age=0'
    };
  }
  return null;
};

/** 从 Accept-Encoding 里挑出可用的预压缩编码，brotli 优先（密度更高）。 */
const pickEncodings = (acceptEncoding) => {
  const list = [];
  if (/\bbr\b/.test(acceptEncoding)) list.push({ enc: 'br', ext: '.br' });
  if (/\bgzip\b/.test(acceptEncoding)) list.push({ enc: 'gzip', ext: '.gz' });
  return list;
};

const app = next({ dev: false, dir: appDir, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

createServer(async (req, res) => {
  try {
    const parsedUrl = parse(req.url, true);

    if ((req.method === 'GET' || req.method === 'HEAD') && !req.headers.range) {
      const target = resolveStaticFile(parsedUrl.pathname || '');
      if (target) {
        const acceptEncoding = String(req.headers['accept-encoding'] || '');
        for (const { enc, ext } of pickEncodings(acceptEncoding)) {
          const compressedPath = `${target.file}${ext}`;
          let stat;
          try {
            stat = await fs.stat(compressedPath);
          } catch {
            continue;
          }

          const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
          if (req.headers['if-none-match'] === etag) {
            res.writeHead(304, { ETag: etag, Vary: 'Accept-Encoding' });
            res.end();
            return;
          }

          res.writeHead(200, {
            'Content-Type': CONTENT_TYPES[path.extname(target.file)] || 'application/octet-stream',
            'Content-Encoding': enc,
            'Content-Length': stat.size,
            'Cache-Control': target.cacheControl,
            Vary: 'Accept-Encoding',
            ETag: etag,
            'X-Content-Type-Options': 'nosniff'
          });
          if (req.method === 'HEAD') {
            res.end();
            return;
          }
          createReadStream(compressedPath).pipe(res);
          return;
        }
      }
    }

    await handle(req, res, parsedUrl);
  } catch (error) {
    console.error('server error', error);
    if (!res.headersSent) res.statusCode = 500;
    res.end('internal server error');
  }
}).listen(port, hostname, () => {
  console.log(`> FastGPT ready on http://${hostname}:${port}`);
});
