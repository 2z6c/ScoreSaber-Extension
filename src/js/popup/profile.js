import { profileManager } from '../profileManager';
import { BASE_URL, ScoreSaberIntegration } from '../integration/scoresaber';
import { postToBackground } from '../util';

const $ = id => document.getElementById(id);

export class FormProfile {
  locked = false;
  constructor() {
    this.$avatar = $('avatar');
    this.$flag = $('country-flag');
    this.$globalRank = $('global-rank');
    this.$countryRank = $('country-rank');
    this.$wrapper = $('player-info');
    this.$inputUserId = $('user-id');
    this.$inputUserId.addEventListener('change', e=>this.onChangedUserID(e));
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
    this.$userName.href = `${BASE_URL}/u/${user.id}`;
    this.$avatar.src = user.avatar;
    this.$flag.src = `${BASE_URL}/imports/images/flags/${user.country}.png`;
    this.$globalRank.textContent = `#${user.globalRank.toLocaleString()}`;
    this.$countryRank.textContent = `#${user.countryRank.toLocaleString()}`;
    this.$inputUserId.value = user.id;
    this.$inputUserId.disabled = this.locked = user.locked;
    this.lock( this.locked );
    this.$lastUpdate.textContent = new Date(user.lastUpdated).toLocaleString();
  }
  async lock(state) {
    state = await profileManager.lock(state);
    this.$lock.title = state ? 'Unlock' : 'Lock';
    const $i = this.$lock.querySelector('i');
    $i.className = 'fas ' + (state?'fa-lock':'fa-lock-open');
    this.$inputUserId.disabled = state;
  }
  /** @param {MouseEvent} e */
  async onChangedUserID(e) {
    if ( !/^\d+$/.test(this.$inputUserId.value) ) {
      this.showHint( 'Invalid user ID.', 'error' );
      return;
    }
    const data = await ScoreSaberIntegration.getUser(this.$inputUserId.value);
    if ( !data || data.error ) {
      this.showHint( 'User not found.', 'error' );
      return;
    }
    await profileManager.set(data);
    this.render();
  }
  showHint( msg, type='' ) {
    this.$hint.textContent = msg;
    this.$hint.className = `hint ${type}`;
  }
  async update() {
    this.$buttonUpdate.disabled = true;
    const user = await profileManager.get();
    try {
      this.showHint('Now loading');
      await postToBackground({updateScores:user});
      const data = await postToBackground({fetchUser:user.id});
      await profileManager.set(data);
      await this.render();
      this.showHint('Scceed to update.');
    } catch (e) {
      console.error(e);
      this.showHint('Failed to update.', 'error');
    }
    this.$buttonUpdate.disabled = false;
  }
}