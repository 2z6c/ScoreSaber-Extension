import rimraf from 'rimraf';

rimraf( 'dist/*', {
  glob: {
    ignore: '**/icons'
  }
}, () => process.exit() );