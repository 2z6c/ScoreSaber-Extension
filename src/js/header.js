async function addUserIcon() {
  const {uid,username,avatar} = await new Promise(r=>chrome.storage.local.get(['uid','username','avatar'],r));
  if ( !uid ) return;
  const icon = document.createElement('img');
  icon.src = avatar;
  // icon.addEventListener('error',set404avatar);
  const a = document.createElement('a');
  a.appendChild(icon);
  a.id = 'link-to-user-profile';
  a.setAttribute('href',`/u/${uid}`);
  a.setAttribute('role',`button`);
  a.setAttribute('title',username);
  a.classList.add('navbar-item');
  const parent = document.querySelector('.navbar-start');
  parent.insertAdjacentElement('afterbegin',a);
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
 * @param {MouseEvent} e
 */
function toggleSearchMode(e) {
  searchMode = 0|!searchMode;
  const mode = SEARCH_MODE[searchMode];
  const button = e.currentTarget;
  const form = button.closest('form');
  button.setAttribute('title',mode.placeholder);
  button.classList.replace(`fa-${SEARCH_MODE[0|!searchMode].icon}`,`fa-${mode.icon}`);
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
  searchMode = (form.getAttribute('action') === '/global')|0;
  button.parentNode.insertAdjacentHTML('beforebegin',makeSearchSwitcher(SEARCH_MODE[searchMode]));
  const toggle = form.querySelector('i');
  toggle.addEventListener('click',toggleSearchMode);
}

window.addEventListener('load',()=>{
  addUserIcon();
  modifySearchForm();
  overwriteHeader();
});