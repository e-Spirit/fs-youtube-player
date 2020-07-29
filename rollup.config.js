import { name } from './package.json';
import { terser } from 'rollup-plugin-terser';
import serve from 'rollup-plugin-serve';

const isWatched = process.argv.includes('-w') || process.argv.includes('--watch');

export default {
  input: './src/fs-youtube-player.js',
  output: [
    { file: `./dist/${name}.js`, format: 'esm', sourcemap: true },
    { file: `./dist/${name}.umd.js`, format: 'umd', sourcemap: true },
  ],
  plugins: [terser(), ...(isWatched ? [serve({ port: 3000, contentBase: './', open: true, openPage: '/demo/' })] : [])],
};
