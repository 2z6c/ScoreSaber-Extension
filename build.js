const watch = process.env.WATCH = !!process.argv[3];
import esbuild from 'esbuild';
import {sassPlugin} from 'esbuild-sass-plugin';
esbuild.build({
  entryPoints: [
    'src/js/userProfile.js',
    'src/js/header.js',
    'src/js/songPage.js',
    'src/js/popup.js',
    'src/js/leaderboard.js',
    'src/js/rankingRequest.js',
    'src/background.js',
  ],
  
  bundle: true,
  loader: { '.json': 'text' },
  outdir: 'dist',
  define: {
    'process.env.NODE_ENV': process.env.NODE_ENV,
  },
  minify: process.argv[2] === 'production',
  sourcemap: process.argv[2] === 'development',
  target: ['chrome88'],
  watch,
}).catch(()=>process.exit(1));

esbuild.build({
  entryPoints: [
    'src/scss/popup.scss',
    'src/scss/header.scss',
    'src/scss/leaderboard.scss',
    'src/scss/songPage.scss',
    'src/scss/userProfile.scss',
  ],
  bundle: true,
  plugins: [sassPlugin({
    async transform(css, resolveDir) {
      const {outputFiles:[out]} = await esbuild.build({
        stdin: {
          contents: css,
          resolveDir,
          loader: "css",
        },
        bundle: true,
        format: "esm",
        write: false,
      });
      return out.text;
    }
  })],
  outdir: 'dist/css',
  define: {
    'process.env.NODE_ENV': process.env.NODE_ENV,
  },
  minify: process.argv[2] === 'production',
  sourcemap: process.argv[2] === 'development',
  target: ['chrome88'],
  watch,
}).catch(()=>process.exit(1));

import {promises as fs} from 'fs';
fs.copyFile('src/manifest.json','dist/manifest.json');