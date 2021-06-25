import { fetchPlayer, fetchPlayerScore } from './integration/scoresaber';
import { readStorage } from './storage';
import { downloadJson } from './util';

export async function snipe( targetId, threshold=20 ) {
  const myScores = await readStorage('scores');
  const target = await fetchPlayer( targetId );
  const songs = [];
  for await ( const score of fetchPlayerScore( targetId, 'top' ) ) {
    const myScore = myScores[score.leaderboardId];
    if ( score.pp * score.weight < threshold ) break;
    if ( !myScore || score.pp - myScore.pp > threshold ) {
      songs.push({hash: score.songHash});
    }
  }
  console.log(songs);
  downloadJson({
    playlistTitle: `Snipe ${target.playerInfo.playerName}`,
    playlistAuthor: (await readStorage('user'))?.name || 'ScoreSaber-Extension',
    image: await createPlayerAvatorBase64(target.playerInfo.avatar),
    songs,
  }, `snipe_${target.playerInfo.playerName}`);
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