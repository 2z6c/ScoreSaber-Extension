import { fetchPlayer, fetchPlayerScore } from './integration/scoresaber';
import { profileManager } from './profileManager';
import { scoreManager } from './scoreManager';
// import { downloadJson } from './util';

/**
 * @param {string} targetId target user id
 * @param {number} threshold minimum pp gap
 * @param {chrome.runtime.Port} port
 * @returns {Promise<{playlist,title:string}>}
 */
export async function snipe( targetId, threshold = 20, port ) {
  const myProfile = await profileManager.get();
  if ( !myProfile ) return;
  if ( typeof targetId !== 'string' && typeof targetId !== 'number' ) throw new Error(`Invalid target id. ${targetId}`);
  const target = await fetchPlayer( targetId );
  const songs = [];
  for await ( const score of fetchPlayerScore( targetId, 'top' ) ) {
    const myScore = await scoreManager.getScore( myProfile.id, score.leaderboardId );
    if ( score.pp * score.weight < threshold ) break;
    if ( !myScore || score.pp - myScore.pp > threshold ) {
      songs.push({
        hash: score.songHash,
        songName: score.songName,
        levelAuthorName: score.levelAuthorName,
        difficulties: [{
          characteristic: 'Standard',
          name: score.difficultyRaw.split('_')[1],
        }]
      });
      port.postMessage({completed: songs.length});
    }
  }
  port.postMessage({
    playlist: {
      playlistTitle: `Snipe ${target.playerInfo.playerName}`,
      playlistAuthor: (await profileManager.get())?.name || 'ScoreSaber-Extension',
      image: await createPlayerAvatorBase64(target.playerInfo.avatar),
      songs,
    },
    title: `snipe_${target.playerInfo.playerName}`
  });
  port.disconnect();
}

async function createPlayerAvatorBase64(url) {
  const res = await fetch(`https://new.scoresaber.com${url}`);
  if ( !res.ok ) return;
  const blob = await res.blob();
  const reader = new FileReader();
  await new Promise( resolve => {
    reader.addEventListener('load', resolve);
    reader.readAsDataURL(blob);
  });
  return reader.result;
}