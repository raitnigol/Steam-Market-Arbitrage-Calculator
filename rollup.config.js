import { readFileSync } from 'fs';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import path from 'path';
import typescript from '@rollup/plugin-typescript';

// Read the entire metadata block
const metadata = readFileSync('src/config/metadata.ts', 'utf8')
  .split('`')[1]
  .split('`')[0]
  .trim();

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/steam-market-arbitrage.user.js',
    format: 'iife',
    banner: metadata,
    sourcemap: false,
    inlineDynamicImports: true,
    compact: false,
    generatedCode: {
      constBindings: true
    }
  },
  plugins: [
    alias({
      entries: [
        { find: '@components', replacement: path.resolve('src/components') },
        { find: '@services', replacement: path.resolve('src/services') },
        { find: '@utils', replacement: path.resolve('src/utils') },
        { find: '@config', replacement: path.resolve('src/config') }
      ]
    }),
    resolve({
      browser: true,
      extensions: ['.js', '.ts'],
      mainFields: ['browser', 'module', 'main']
    }),
    commonjs({
      transformMixedEsModules: true,
      include: /node_modules/
    }),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: false,
      inlineSources: false,
      compilerOptions: {
        target: 'es2018',
        module: 'esnext'
      }
    })
  ]
};