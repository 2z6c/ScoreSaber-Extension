const watch = process.env.WATCH = true;
import esbuild from 'esbuild';
esbuild.build({
  entryPoints: [
    'src/js/userProfile.js',
    'src/js/header.js',
    'src/js/songPage.js',
    'src/js/popup.js',
    'src/js/leaderboard.js',
    'src/js/rankingRequest.js',
    'src/background.js',
    'src/manifest.json'
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
