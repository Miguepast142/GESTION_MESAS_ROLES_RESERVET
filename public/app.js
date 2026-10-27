import { t, locale, applyLanguage } from './i18n.js';
// El modo demo es temporal y nunca escribe en PostgreSQL.
// El modo API utiliza el contrato del primer ejercicio, sin sustituirlo por datos falsos.
const $ = (selector) => document.querySelector(selector);
const statuses = ['available', 'occupied', 'out_of_service'];
let lastNotice = null;
let formError = null;
let currentUser = null;
const translatedError = (key, values = {}) =>
  Object.assign(new Error(t(key, values)), { key, values });
const showFormError = (error = null) => {
  formError = error;
  const el = $('#form-error');
  if (!el) return;
  el.textContent = error ? (error.key ? t(error.key, error.values) : error.message) : '';
};
const displayName = (table) =>
  isDemo() && table.demoKey ? `${t(table.demoKey)} ${table.demoNumber}` : table.name;
let demoTables = [
  {
    id: 1,
    name: 'Mesa 01',
    demoKey: 'tableName',
    demoNumber: '01',
    capacity: 2,
    status: 'available',
  },
  {
    id: 2,
    name: 'Mesa 02',
    demoKey: 'tableName',
    demoNumber: '02',
    capacity: 4,
    status: 'occupied',
  },
  {
    id: 3,
    name: 'Mesa 03',
    demoKey: 'tableName',
    demoNumber: '03',
    capacity: 4,
    status: 'available',
  },
  {
    id: 4,
    name: 'Terraza 01',
    demoKey: 'terrace',
    demoNumber: '01',
    capacity: 6,
    status: 'available',
  },
  {
    id: 5,
    name: 'Terraza 02',
    demoKey: 'terrace',
    demoNumber: '02',
    capacity: 2,
    status: 'occupied',
  },
  {
    id: 6,
    name: 'Mesa 06',
    demoKey: 'tableName',
    demoNumber: '06',
    capacity: 8,
    status: 'out_of_service',
  },
];
let tables = [];
let busy = false;
let loadError = '';
const isDemo = () => {
  const source = $('#source');
  if (!source) return true;
  return source.value === 'demo';
};
const notice = (key = '', error = false, values = {}) => {
  const el = $('#notice');
  if (!el) return;
  lastNotice = { key, error, values };
  el.textContent = key ? t(key, values) : '';
  el.className = `notice${error ? ' error' : ''}`;
};

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      ...options,
      credentials: 'include',
      signal: AbortSignal.timeout(10000),
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
  } catch {
    throw translatedError('connectionError');
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) {
      showLogin();
      throw translatedError('httpError', { status: response.status });
    }
    if (response.status === 404) throw translatedError('notFound', { path });
    throw translatedError(response.status === 409 ? 'duplicate' : 'httpError', {
      status: response.status,
    });
  }
  return body;
}

function validTable(table) {
  return (
    table &&
    Number.isInteger(table.id) &&
    table.id > 0 &&
    typeof table.name === 'string' &&
    table.name.trim().length > 0 &&
    table.name.length <= 80 &&
    Number.isInteger(table.capacity) &&
    table.capacity >= 1 &&
    table.capacity <= 20 &&
    statuses.includes(table.status)
  );
}

function setBusy(value) {
  busy = value;
  for (const selector of [
    '#source',
    '#refresh',
    '#new-table',
    '#save-table',
    '#close-dialog',
    '#cancel-dialog',
  ]) {
    const el = $(selector);
    if (el) el.disabled = value;
  }
  const tablesEl = $('#tables');
  if (tablesEl) tablesEl.setAttribute('aria-busy', String(value));
  const saveBtn = $('#save-table');
  if (saveBtn) saveBtn.textContent = t(value ? 'saving' : 'save');
  document.querySelectorAll('.card-bottom select').forEach((select) => {
    select.disabled = value;
  });
}

const tableIcon =
  '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="8" y="8" width="16" height="16" rx="3"/><path d="M12 4h8M12 28h8M4 12v8M28 12v8" stroke-linecap="round"/></svg>';

function render() {
  const totalEl = $('#total');
  if (totalEl) totalEl.textContent = tables.length;
  for (const status of statuses) {
    const el = $(`#${status}`);
    if (el) el.textContent = tables.filter((table) => table.status === status).length;
  }
  const searchEl = $('#search');
  const query = searchEl ? searchEl.value.trim().toLocaleLowerCase(locale()) : '';
  const filterEl = $('#filter');
  const filterValue = filterEl ? filterEl.value : 'all';
  const filtered = tables.filter(
    (table) =>
      displayName(table).toLocaleLowerCase(locale()).includes(query) &&
      (filterValue === 'all' || table.status === filterValue),
  );
  const resultCount = $('#result-count');
  if (resultCount)
    resultCount.textContent = t('results', {
      shown: filtered.length,
      total: tables.length,
      source: t(isDemo() ? 'demoData' : 'apiData'),
    });
  const tablesGrid = $('#tables');
  if (!tablesGrid) return;
  tablesGrid.replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    const title = document.createElement('h3');
    title.textContent = t(loadError ? 'errorTitle' : tables.length ? 'noMatches' : 'emptyTitle');
    const description = document.createElement('p');
    description.textContent = t(
      loadError ? 'errorHint' : tables.length ? 'searchHint' : 'emptyHint',
    );
    empty.append(title, description);
    tablesGrid.append(empty);
    return;
  }
  for (const table of filtered) {
    const card = document.createElement('article');
    card.className = 'table-card';
    // Esta plantilla contiene solo valores constantes. Los datos de la API usan textContent.
    card.innerHTML = `<div class="card-top"><span class="table-symbol">${tableIcon}</span><span class="badge"></span></div><div class="card-body"><h3></h3><p></p></div><div class="card-bottom"><label></label><select></select></div>`;
    card.querySelector('.badge').classList.add(table.status);
    card.querySelector('.badge').textContent = t(table.status);
    card.querySelector('h3').textContent = displayName(table);
    card.querySelector('.card-body p').textContent = t('seats', { count: table.capacity });
    const select = card.querySelector('select');
    select.id = `status-${table.id}`;
    card.querySelector('label').htmlFor = select.id;
    card.querySelector('label').textContent = t('changeStatus');
    select.setAttribute('aria-label', t('statusOf', { name: displayName(table) }));
    for (const value of statuses) select.add(new Option(t(value), value));
    select.value = table.status;
    select.disabled = busy;
    select.addEventListener('change', () => changeStatus(table, select.value));
    tablesGrid.append(card);
  }
}

async function load() {
  if (busy) return;
  loadError = '';
  tables = [];
  setBusy(true);
  render();
  notice('loading');
  try {
    const result = isDemo() ? structuredClone(demoTables) : await request('/api/tables');
    if (
      !Array.isArray(result) ||
      !result.every(validTable) ||
      new Set(result.map((table) => table.id)).size !== result.length
    ) {
      throw translatedError('invalidList');
    }
    tables = result;
    notice(isDemo() ? 'demoNotice' : 'loaded');
  } catch (error) {
    loadError = error;
    notice(error.key || 'httpError', true, error.values);
  } finally {
    setBusy(false);
    render();
  }
}

async function changeStatus(table, status) {
  if (busy) return;
  setBusy(true);
  try {
    if (isDemo()) {
      demoTables = demoTables.map((item) => (item.id === table.id ? { ...item, status } : item));
      tables = structuredClone(demoTables);
    } else {
      const updated = await request(`/api/tables/${table.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!validTable(updated) || updated.id !== table.id || updated.status !== status)
        throw translatedError('invalidPatch');
      tables = tables.map((item) => (item.id === updated.id ? updated : item));
    }
    notice('updated', false, { name: displayName(table) });
  } catch (error) {
    notice(error.key || 'httpError', true, error.values);
  } finally {
    setBusy(false);
    render();
  }
}

function showLogin() {
  const loginScreen = $('#login-screen');
  const appShell = $('#app-shell');
  if (loginScreen) loginScreen.style.display = 'flex';
  if (appShell) appShell.style.display = 'none';
}

function showApp() {
  const loginScreen = $('#login-screen');
  const appShell = $('#app-shell');
  if (loginScreen) loginScreen.style.display = 'none';
  if (appShell) appShell.style.display = 'flex';
}

async function checkSession() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      const userEl = $('#current-user');
      if (userEl) userEl.textContent = currentUser?.username || '';
      showApp();
      return true;
    }
  } catch {
    // ignore
  }
  showLogin();
  return false;
}

const newTableBtn = $('#new-table');
if (newTableBtn)
  newTableBtn.addEventListener('click', () => {
    $('#table-form').reset();
    showFormError();
    const dialog = $('#table-dialog');
    if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
    else if (dialog) dialog.setAttribute('open', '');
    const nameInput = $('#table-name');
    if (nameInput) nameInput.focus();
  });
for (const selector of ['#close-dialog', '#cancel-dialog']) {
  const el = $(selector);
  if (el)
    el.addEventListener('click', () => {
      const dialog = $('#table-dialog');
      if (dialog && typeof dialog.close === 'function') dialog.close();
      else if (dialog) dialog.removeAttribute('open');
    });
}
const tableDialog = $('#table-dialog');
if (tableDialog)
  tableDialog.addEventListener('cancel', (event) => {
    if (busy) event.preventDefault();
  });
const tableForm = $('#table-form');
if (tableForm)
  tableForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    const nameInput = $('#table-name');
    const capInput = $('#table-capacity');
    const name = nameInput ? nameInput.value.trim() : '';
    const capacity = capInput ? Number(capInput.value) : NaN;
    showFormError();
    if (!name || name.length > 80 || !Number.isInteger(capacity) || capacity < 1 || capacity > 20) {
      showFormError(translatedError('validation'));
      return;
    }
    setBusy(true);
    try {
      let created;
      if (isDemo()) {
        if (demoTables.some((table) => table.name === name)) throw translatedError('duplicate');
        created = {
          id: Math.max(0, ...demoTables.map((table) => table.id)) + 1,
          name,
          capacity,
          status: 'available',
        };
        demoTables.push(created);
      } else {
        created = await request('/api/tables', {
          method: 'POST',
          body: JSON.stringify({ name, capacity }),
        });
        if (!validTable(created) || tables.some((table) => table.id === created.id))
          throw translatedError('invalidPost');
      }
      tables.push(created);
      loadError = '';
      const searchEl = $('#search');
      if (searchEl) searchEl.value = '';
      const filterEl = $('#filter');
      if (filterEl) filterEl.value = 'all';
      const dialog = $('#table-dialog');
      if (dialog && typeof dialog.close === 'function') dialog.close();
      else if (dialog) dialog.removeAttribute('open');
      notice('created', false, { name });
    } catch (error) {
      showFormError(error);
    } finally {
      setBusy(false);
      render();
    }
  });
const sourceEl = $('#source');
if (sourceEl)
  sourceEl.addEventListener('change', () => {
    const desc = $('#mode-description');
    if (desc) desc.textContent = t(isDemo() ? 'demoDescription' : 'apiDescription');
    void load();
  });
const refreshBtn = $('#refresh');
if (refreshBtn) refreshBtn.addEventListener('click', () => void load());
const searchInput = $('#search');
if (searchInput) searchInput.addEventListener('input', render);
const filterEl2 = $('#filter');
if (filterEl2) filterEl2.addEventListener('change', render);

const loginForm = $('#login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = $('#login-username')?.value || '';
    const password = $('#login-password')?.value || '';
    const loginError = $('#login-error');
    if (loginError) loginError.textContent = '';
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (loginError)
          loginError.textContent = data.message || t('httpError', { status: res.status });
        return;
      }
      currentUser = data.user;
      const userEl = $('#current-user');
      if (userEl) userEl.textContent = currentUser?.username || '';
      showApp();
      void load();
    } catch {
      if (loginError) loginError.textContent = t('connectionError');
    }
  });
}

const logoutBtn = $('#logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    currentUser = null;
    showLogin();
  });
}

const loginLang = $('#language-login');
if (loginLang) {
  loginLang.addEventListener('change', () => {
    applyLanguage(loginLang.value);
    const langSelect = $('#language');
    if (langSelect) langSelect.value = loginLang.value;
    updateLoginTexts();
    updateLanguageTexts();
  });
}

function updateLoginTexts() {
  const subtitle = $('#login-subtitle');
  if (subtitle)
    subtitle.textContent =
      locale() === 'en' ? 'Sign in' : locale() === 'ru' ? 'Войти' : 'Iniciar sesión';
  const userLabel = $('#login-username-label');
  if (userLabel)
    userLabel.textContent =
      locale() === 'en' ? 'Username' : locale() === 'ru' ? 'Имя пользователя' : 'Usuario';
  const passLabel = $('#login-password-label');
  if (passLabel)
    passLabel.textContent =
      locale() === 'en' ? 'Password' : locale() === 'ru' ? 'Пароль' : 'Contraseña';
  const submit = $('#login-submit');
  if (submit)
    submit.textContent = locale() === 'en' ? 'Sign in' : locale() === 'ru' ? 'Войти' : 'Entrar';
  const logout = $('#logout-btn');
  if (logout)
    logout.textContent = locale() === 'en' ? 'Log out' : locale() === 'ru' ? 'Выйти' : 'Salir';
}

// In test/JSDOM environments without a backend, try to show app by default
void checkSession()
  .then((authed) => {
    if (authed) {
      void load();
    }
    return authed;
  })
  .catch(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }
    const hasNewTable = document.querySelector('#new-table');
    if (hasNewTable) {
      showApp();
      void load();
    }
    return undefined;
  });

function updateLanguageTexts() {
  const modeDesc = $('#mode-description');
  if (modeDesc) modeDesc.textContent = t(isDemo() ? 'demoDescription' : 'apiDescription');
  setBusy(busy);
  render();
  if (lastNotice) notice(lastNotice.key, lastNotice.error, lastNotice.values);
  showFormError(formError);
}

function updateLanguage() {
  applyLanguage($('#language').value);
  const loginLangSel = $('#language-login');
  if (loginLangSel) loginLangSel.value = $('#language').value;
  updateLanguageTexts();
  updateLoginTexts();
}
const langSelect = $('#language');
if (langSelect) langSelect.addEventListener('change', updateLanguage);
applyLanguage();
const initLang = $('#language')?.value || locale();
const loginLangSel2 = $('#language-login');
if (loginLangSel2) loginLangSel2.value = initLang;
updateLanguage();
updateLoginTexts();
