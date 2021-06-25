import {
  getLastUpdate,
  loadRankedSongs,
  fetchRankedSongs,
  isBusy,
  updateUserScores,
} from './js/integration/scoresaber';
import { predictScoreGain, sortPPAsc } from './js/scoreComparator';
import { scoreManager } from './js/scoreManager';
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

  await scoreManager.open();
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
    const {id} = request.updateScores;
    if ( !isBusy() ) await updateUserScores(id);
    sendResponse({
      updateFinished: Date.now()
    });
  }
  else if ( request.getScore ) {
    const {leaderboardId,userId} = request.getScore;
    sendResponse(await scoreManager.getScore(userId,leaderboardId));
  }
  else if ( request.predictScore ) {
    // const {leaderboardId,pp} = request.predictScore;
    const {id: userId} = await readStorage('user');
    const {accumlatedScores} = await scoreManager.getUser(userId);
    const score = sortPPAsc( await scoreManager.getUserScore(userId));
    sendResponse(await predictScoreGain( {score,accumlatedScores}, request.predictScore ));
  }
  else console.error('illegal request.', request);
}

chrome.runtime.onMessage.addListener((...args)=>{
  asyncRespond(...args);
  return true;
});

