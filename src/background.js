import {
  getLastUpdate,
  loadRankedSongs,
  fetchRankedSongs,
  isBusy,
  updateUserScores,
} from './js/integration/scoresaber';
import { profileManager } from './js/profileManager';
import { predictScoreGain, sortPPAsc } from './js/scoreComparator';
import { scoreManager } from './js/scoreManager';
import { snipe } from './js/snipe';
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

const api = {
  async getRanked(query) {
    await loadRankedSongs();
    if ( !isBusy() ) await fetchRankedSongs(query);
    return {updateFinished:await getLastUpdate()};
  },
  async isBusy() {
    return {busy: isBusy()};
  },
  async getScore({leaderboardId,userId}) {
    return await scoreManager.getScore(userId,leaderboardId);
  },
  async updateScores({id}) {
    if ( isBusy() ) return { busy: true };
    await updateUserScores(id);
    return { updateFinished: Date.now() };
  },
  async predictScore(newScore) {
    const {id: userId} = await profileManager.get();
    if ( !userId ) return;
    const {accumlatedScores} = await scoreManager.getUser(userId);
    const score = sortPPAsc( await scoreManager.getUserScore(userId));
    return await predictScoreGain( {score,accumlatedScores}, newScore );
  }
};

async function asyncRespond(request,sender,sendResponse) {
  for ( const key of Object.keys(request) ) {
    if ( !api[key] ) continue;
    const res = await api[key](request[key]);
    sendResponse(res);
    return;
  }
  console.log('no message is responded.', request);
}

chrome.runtime.onMessage.addListener((...args)=>{
  asyncRespond(...args);
  return true;
});

const CONNECTION_API = {
  async snipe({targetId, threshold=20}, port) {
    return await snipe(targetId, threshold, port);
  }
};

chrome.runtime.onConnect.addListener((port)=>{
  console.log(`connection [${port.name}] opened.`);
  if ( !CONNECTION_API[port.name] ) return;
  port.onMessage.addListener(msg=>{
    if ( msg.query ) CONNECTION_API[port.name](msg.query, port);
  });
});