import { getLastUpdate, loadRankedSongs,fetchRankedSongs } from './js/scoresaber';
// import { writeStorage } from './js/storage';

chrome.runtime.onInstalled.addListener(async ()=>{
  console.log('installed');
  const last = await getLastUpdate();
  if ( !last || Date.now() - last >= 86400000 ) {
    await fetchRankedSongs();
  }
  loadRankedSongs().then(r=>{
    console.log(r);
  });
  // writeStorage('favorite', []);
  // writeStorage('bookmark', []);
});

chrome.runtime.onMessage.addListener(async (request,sender,sendResponse)=>{
  console.log('recieve message from popup;', request);
  if ( request.getRanked ) {
    await loadRankedSongs();
    await fetchRankedSongs(request.getRanked);
    sendResponse({updateFinished:await getLastUpdate()});
  }
});

