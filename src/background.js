import {
  getLastUpdate,
  loadRankedSongs,
  fetchRankedSongs,
  isBusy,
  updateUserScores,
  getLastUpdateUserScores,
} from './js/integration/scoresaber';
import { KEY_BOOKMARK, KEY_FAVORITE, readStorage, writeStorage } from './js/storage';

chrome.runtime.onInstalled.addListener(async ()=>{
  console.log('installed');
  const last = await getLastUpdate();
  if ( !last || Date.now() - last >= 86400000 ) {
    await fetchRankedSongs();
  }
  loadRankedSongs().then(()=>{
    console.log('finished to load ranked list.');
  });
  if ( !await readStorage(KEY_FAVORITE) ) await writeStorage(KEY_FAVORITE, []);
  if ( !await readStorage(KEY_BOOKMARK) ) await writeStorage(KEY_BOOKMARK, []);
});

async function asyncRespond(request,sender,sendResponse) {
  if ( request.getRanked ) {
    await loadRankedSongs();
    if ( !isBusy() ) await fetchRankedSongs(request.getRanked);
    sendResponse({updateFinished:await getLastUpdate()});
  }
  else if ( request.isBusy ) {
    sendResponse({busy: isBusy()});
  }
  else if ( request.updateScores ) {
    if ( !isBusy() ) await updateUserScores();
    sendResponse({
      updateFinished: await getLastUpdateUserScores()
    });
  }
  else console.error('illegal request.', request);
}

chrome.runtime.onMessage.addListener((...args)=>{
  asyncRespond(...args);
  return true;
});

