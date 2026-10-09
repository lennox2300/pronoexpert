import type { Plugin } from 'vite';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const SW_SOURCE = resolve(__dirname, '../public/sw.js');

export function generateSWVersionPlugin(): Plugin {
  return {
    name: 'sw-version-plugin',
    apply: 'build',
    closeBundle() {
      const timestamp = Date.now().toString();
      let content = readFileSync(SW_SOURCE, 'utf-8');
      content = content.replace(
        /const CACHE = 'pronoexpert-[^']*';/,
        `const CACHE = 'pronoexpert-${timestamp}';`
      );

      const outPath = resolve(__dirname, '../dist/sw.js');
      writeFileSync(outPath, content, 'utf-8');
      console.log(`[sw-version] Cache version set to pronoexpert-${timestamp}`);
    },
  };
}
