import { profileManager } from './profileManager';

async function addUserIcon() {
  const user = await profileManager.get();
  if ( !user ) return;
  const parent = document.querySelector('.navbar-start');
  parent.insertAdjacentHTML('afterbegin',`
  <a
    id="link-to-user-profile"
    href="/u/${user.id}"
    role="button"
    title="${user.name}"
    class="navbar-item"
  >
    <img src="${user.avatar}">
  </a>`);
}

const makeSearchSwitcher = ({placeholder,icon}) => `
<i
  id="search-mode-icon"
  class="fas fa-${icon}"
  title="${placeholder}"
  role="button"
></i>`;

const SEARCH_MODE = [{
  placeholder: 'Search Song/Author',
  icon: 'music',
  action: '/'
}, {
  placeholder: 'Search Player',
  icon: 'user',
  action: '/global',
}];

let searchMode = 1;
/**
 * @param {MouseEvent & {currentTarget:HTMLButtonElement}} e
 */
function toggleSearchMode(e) {
  searchMode ^= 1;
  const mode = SEARCH_MODE[searchMode];
  const button = e.currentTarget;
  const form = button.closest('form');
  button.setAttribute('title',mode.placeholder);
  button.classList.replace(`fa-${SEARCH_MODE[1^searchMode].icon}`,`fa-${mode.icon}`);
  form.setAttribute('action',mode.action);
  const input = form.querySelector('input[name=search]');
  input.setAttribute('placeholder',mode.placeholder);
}

function overwriteHeader() {
  document.querySelectorAll('.navbar-item').forEach(item=>{
    const text = item.textContent.trim();
    if( text === 'FAQ & External Links' ) item.textContent = 'About';
    else if ( text === 'View Rank Requests') item.textContent = 'Rank Queue';
    else if ( text === 'Leaderboards' ) item.remove();
  });
}

function modifySearchForm() {
  const form = document.querySelector('form.navbar-item');
  const button = form.querySelector('button[type="submit"]');
  button.textContent = '';
  button.insertAdjacentHTML('beforeend','<i class="fas fa-search"></i>');
  const action = form.getAttribute('action');
  if ( action ) SEARCH_MODE[1].action = action;
  searchMode = action ? 1 : 0;
  button.parentElement.insertAdjacentHTML('beforebegin',makeSearchSwitcher(SEARCH_MODE[searchMode]));
  const toggle = form.querySelector('i');
  toggle.addEventListener('click',toggleSearchMode);
}

function init() {
  addUserIcon();
  modifySearchForm();
  overwriteHeader();
}

if ( document.readyState === 'loading' ) {
  document.addEventListener('DOMContentLoaded',init);
} else init();