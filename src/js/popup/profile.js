import { profileManager } from '../profileManager';
import { BASE_URL, ScoreSaberIntegration } from '../integration/scoresaber';
import { messageAPI } from '../api/message';
// import { postToBackground } from '../util';

const $ = id => document.getElementById(id);

export class FormProfile {
  locked = false;
  $userName;
  constructor() {
    this.$avatar = $('avatar');
    this.$flag = $('country-flag');
    this.$globalRank = $('global-rank');
    this.$countryRank = $('country-rank');
    this.$wrapper = $('player-info');
    this.$inputUserId = $('user-id');
    this.$inputUserId.addEventListener('change', e=>this.onChangedUserID());
    this.$userName = $('user-name');
    this.$lock = $('lock-user-id');
    this.$lock.addEventListener('click',e=>this.lock());
    this.$hint = $('user-id-hint');
    this.$lastUpdate = $('last-update-user');
    this.$buttonUpdate = $('update-user-score');
    this.$buttonUpdate.addEventListener('click',e=>this.update());
  }
  async render() {
    const user = await profileManager.get();
    if ( !user ) {
      this.$wrapper.classList.add('hidden');
      return;
    } else this.$wrapper.classList.remove('hidden');
    this.$userName.textContent = user.name;
    this.$userName.setAttribute( 'href', `${BASE_URL}/u/${user.id}`);
    this.$avatar.setAttribute( 'src', user.avatar );
    this.$flag.setAttribute( 'src', `${BASE_URL}/imports/images/flags/${user.country}.png` );
    this.$globalRank.textContent = `#${user.globalRank.toLocaleString()}`;
    this.$countryRank.textContent = `#${user.countryRank.toLocaleString()}`;
    this.$inputUserId.setAttribute('value', user.id);
    // eslint-disable-next-line no-cond-assign
    if ( this.locked = user.locked ) {
      this.$inputUserId.setAttribute( 'disabled', '' );
    } else {
      this.$inputUserId.removeAttribute( 'disabled' );
    }
    this.lock( this.locked );
    this.$lastUpdate.textContent = new Date(user.lastUpdated).toLocaleString();
  }
  async lock(state) {
    state = await profileManager.lock(state);
    this.$lock.title = state ? 'Unlock' : 'Lock';
    const $i = this.$lock.querySelector('i');
    $i.className = 'fas ' + (state?'fa-lock':'fa-lock-open');
    this.$inputUserId.setAttribute( 'disabled', state );
  }
  async onChangedUserID() {
    if ( !/^\d+$/.test(this.$inputUserId.getAttribute('value')) ) {
      this.showHint( 'Invalid user ID.', 'error' );
      return;
    }
    const data = await ScoreSaberIntegration.getUser(this.$inputUserId.getAttribute('value'));
    if ( !data || data.error ) {
      this.showHint( 'User not found.', 'error' );
      return;
    }
    await profileManager.set(data);
    this.render();
  }
  showHint( msg, type='' ) {
    console.log(`hint[${type}]: ${msg}`);
    this.$hint.textContent = msg;
    this.$hint.className = `hint ${type}`;
  }
  async update() {
    this.$buttonUpdate.setAttribute('disabled','');
    const user = await profileManager.get();
    try {
      this.showHint('Now loading');
      await messageAPI.updateScores(user.id);
      const data = await messageAPI.fetchUser(user.id);
      await profileManager.set(data);
      await this.render();
      this.showHint('Scceed to update.');
    } catch (e) {
      console.error(e);
      this.showHint('Failed to update.', 'error');
    }
    this.$buttonUpdate.removeAttribute('disabled');
  }
}