// import { scoreManager } from './db/scoreManager';
import { messageAPI } from './api/message';
import { extractHash } from './util';

/**
 * @typedef ScrapedScore
 * @property {string} hash
 * @property {number} leaderboardId
 * @property {number} pp
 * @property {number} wpp
 * @property {number} accuracy
 * @property {number} score
 * @property {number} timeSet
 * @typedef {import('./types/scoresaber').ScoreSaber.Score} ScoreSaberScore
 */

export class Scraper {
  /** @type {string} */
  userId = location.pathname.match(/\d+/)[0];
  constructor() {
  }
  /**
   * @param {HTMLTableRowElement} tr
   */
  scrapeSongScore( tr ) {
    /** @type {ScrapedScore} */
    const songScore = Object.create(null);
    songScore.hash = extractHash( tr.querySelector('img').src);
    songScore.leaderboardId = parseInt(new URL(tr.querySelector('.song a').getAttribute('href')).pathname.split('/').pop());
    const cell = tr.querySelector('.score');
    const ppRE = /[\d.]+(?=pp)/g;
    songScore.pp = parseFloat(ppRE.exec(cell.textContent)?.[0]);
    songScore.wpp = parseFloat(ppRE.exec(cell.textContent)?.[0]);
    songScore.accuracy = parseFloat(/[\d.]+(?=%)/.exec(cell.textContent)?.[0]);
    const score = /(?<=score:\s+)[\d,]+/.exec(cell.textContent)?.[0];
    if ( score ) songScore.score = parseInt(score.replace(/[^\d]/g,''));
    songScore.timeSet = new Date(tr.querySelector('.time[title]').getAttribute('title')).getTime();
    for ( let [key,value] of Object.entries(songScore) ) {
      tr.dataset[key] = `${value}`;
    }
    this.updateSongScore(songScore);
    return songScore;
  }
  /**
   * @param {ScrapedScore} score
   */
  async updateSongScore(score) {
    const oldScore = await messageAPI.getScore({ userId: this.userId, leaderboardId: score.leaderboardId });
    if ( oldScore && (
      (oldScore.date ?? 0) >= score.timeSet ||
      oldScore.pp > score.pp ||
      (oldScore.score ?? 0) > score.pp )) {
        // console.log(`updating score is canceled`, oldScore, score);
        return;
      }
    /** @type {any} */
    const psudeRaw = { ...score };
    // psudeRaw.maxScore ??= score.accuracy ? score.score / score.accuracy / 100: 0;
    // console.log(`song[${score.leaderboardId}] score has been updated`,oldScore,score);
    messageAPI.updateScore({userId:this.userId, score:psudeRaw});
  }
  updateUser() {
    /** @type {HTMLMetaElement} */
    const meta = document.querySelector('meta[property="og:description"]');
    const user = {
      userId: this.userId,
      rankGlobal: parseInt(
        /(?<=Ranking: #)[\d,]*/.exec(meta.content)[0].replace(/[^\d]/g,'')
      ),
      rankLocal: parseInt(
        document.querySelector('h5.title+ul li a:last-child')
        .textContent.trim().replace(/[^\d]/g,'')
      ),
      pp: parseFloat(/(?<=Performance Points:\s*)[\d,.]+(?=pp)/.exec(meta.content)[0].replace(/[^\d.]/g,'')),
    };
    messageAPI.updateUser(user);
  }
}