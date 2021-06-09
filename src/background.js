import { getLastUpdate, loadRankedSongs,fetchRankedSongs } from './js/scoresaber';

chrome.runtime.onInstalled.addListener(async ()=>{
  console.log('installed');
  const last = await getLastUpdate();
  if ( !last || Date.now() - last >= 86400000 ) {
    await fetchRankedSongs();
  }
  loadRankedSongs().then(r=>{
    console.log(r);
  });
});