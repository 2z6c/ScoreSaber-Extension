import {
  getLastUpdate,
  SSUserScoreRequest,
  SSRankedSongsRequest,
} from './js/integration/scoresaber';
import { profileManager } from './js/profileManager';
import { predictScoreGain, sortPPAsc } from './js/scoreComparator';
import { scoreManager } from './js/db/scoreManager';
import { snipe } from './js/snipe';
import { KEY_BOOKMARK, KEY_FAVORITE, readStorage, writeStorage } from './js/storage';
import { RankedSongManageer } from './js/db/rankedSongManager';
const rankedSongManager = new RankedSongManageer();

chrome.runtime.onInstalled.addListener(async ()=>{
  console.log('installed');
  const last = await getLastUpdate();
  if ( !last || Date.now() - last >= 86400000 ) {
    const request = new SSRankedSongsRequest();
    await request.send();
  }
  if ( !await readStorage(KEY_FAVORITE) ) await writeStorage(KEY_FAVORITE, []);
  if ( !await readStorage(KEY_BOOKMARK) ) await writeStorage(KEY_BOOKMARK, []);
});

const api = {
  async getRanked(query) {
    const request = new SSRankedSongsRequest(query);
    await request.send();
    return {updateFinished: Date.now()};
  },
  async getScore({leaderboardId,userId}) {
    return await scoreManager.getScore(userId,leaderboardId);
  },
  async updateScores({id}) {
    const request = new SSUserScoreRequest(id);
    await request.send();
    return { updateFinished: Date.now() };
  },
  async predictScore(newScore) {
    const {id: userId} = await profileManager.get();
    if ( !userId ) return;
    const {accumlatedScores} = await scoreManager.getUser(userId);
    const score = sortPPAsc( await scoreManager.getUserScore(userId));
    return await predictScoreGain( {score,accumlatedScores}, newScore );
  },
  async getStar({hash, diffText}) {
    const song = await rankedSongManager.get(hash,diffText);
    if ( !song || isNaN(song.stars) ) return;
    return song.stars;
  },
  async deleteDB() {
    await rankedSongManager.destruct();
    await scoreManager.destruct();
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
  },
  async updateScores({id}) {
    const request = new SSUserScoreRequest(id);
    await request.send();
    return { updateFinished: Date.now() };
  },
};

chrome.runtime.onConnect.addListener((port)=>{
  if ( !CONNECTION_API[port.name] ) return;
  console.log(`connection [${port.name}] opened.`);
  port.onMessage.addListener(msg=>{
    if ( msg.query ) CONNECTION_API[port.name](msg.query, port);
  });
});