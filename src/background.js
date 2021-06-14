import {
  getLastUpdate,
  loadRankedSongs,
  fetchRankedSongs,
  isBusy,
} from './js/integration/scoresaber';
import { KEY_BOOKMARK, KEY_FAVORITE, readStorage, writeStorage } from './js/storage';

chrome.runtime.onInstalled.addListener(async ()=>{
  console.log('installed');
  const last = await getLastUpdate();
  if ( !last || Date.now() - last >= 86400000 ) {
    await fetchRankedSongs();
  }
  loadRankedSongs().then(r=>{
    console.log(r);
  });
  if ( await readStorage(KEY_FAVORITE) ) await writeStorage(KEY_FAVORITE, []);
  if ( await readStorage(KEY_BOOKMARK) ) await writeStorage(KEY_BOOKMARK, []);
});

chrome.runtime.onMessage.addListener(async (request,sender,sendResponse)=>{
  if ( request.getRanked ) {
    await loadRankedSongs();
    if ( !isBusy() ) await fetchRankedSongs(request.getRanked);
    sendResponse({updateFinished:await getLastUpdate()});
  }
  else if ( request.isBusy ) {
    sendResponse({busy: isBusy()});
  }
});

