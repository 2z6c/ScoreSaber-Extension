const watch = process.env.WATCH = false;
import esbuild from 'esbuild';
esbuild.build({
  entryPoints: [
    'src/js/userProfile.js',
    'src/js/header.js',
    'src/js/songPage.js',
    'src/js/popup.js',
    'src/js/leaderboard.js',
    'src/background.js'
  ],
  bundle: true,
  outdir: 'dist',
  define: {
    'process.env.NODE_ENV': '"development"'
  },
  minify: false,
  sourcemap: true,
  target: ['chrome88'],
  watch,
}).catch(()=>process.exit(1));

import {promises as fs} from 'fs';
fs.copyFile('src/manifest.json','dist/manifest.json');