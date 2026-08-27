/**
 * 构建后为静态文本资源生成预压缩副本（.br / .gz），供生产服务器直接返回，
 * 避免运行时压缩且允许使用最高压缩等级（brotli 11 / gzip 9）。
 *
 * 处理范围：.next/static/**（内容哈希、immutable）与 public/**（图标、SVG 等）。
 * 仅当压缩结果比原文件小时才保留副本；重复执行是幂等的。
 */
import { promises as fs } from 'fs';
import path from 'path';
import { brotliCompress, gzip, constants } from 'zlib';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const brotliAsync = promisify(brotliCompress);
const gzipAsync = promisify(gzip);

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(rootDir, '..');

const TARGET_DIRS = [path.join(appDir, '.next', 'static'), path.join(appDir, 'public')];
// 只压缩文本类资源；woff2/png 等本身已压缩，跳过。
const COMPRESSIBLE_EXT = new Set(['.js', '.css', '.svg', '.json', '.txt', '.xml', '.webmanifest']);
const MIN_SIZE = 1024;

const walk = async (dir) => {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
};

const main = async () => {
  const files = (await Promise.all(TARGET_DIRS.map(walk))).flat();
  let brCount = 0;
  let gzCount = 0;
  let savedBytes = 0;

  for (const file of files) {
    const ext = path.extname(file);
    if (!COMPRESSIBLE_EXT.has(ext)) continue;

    const data = await fs.readFile(file);
    if (data.length < MIN_SIZE) continue;

    const [br, gz] = await Promise.all([
      brotliAsync(data, {
        params: {
          [constants.BROTLI_PARAM_QUALITY]: 11,
          [constants.BROTLI_PARAM_SIZE_HINT]: data.length
        }
      }),
      gzipAsync(data, { level: 9 })
    ]);

    if (br.length < data.length) {
      await fs.writeFile(`${file}.br`, br);
      brCount += 1;
      savedBytes += data.length - br.length;
    }
    if (gz.length < data.length) {
      await fs.writeFile(`${file}.gz`, gz);
      gzCount += 1;
    }
  }

  console.log(
    `[precompress-static] ${brCount} brotli / ${gzCount} gzip siblings written, ~${Math.round(savedBytes / 1024)}KB saved vs raw (brotli)`
  );
};

await main();
