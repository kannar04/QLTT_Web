const focusContextStore = {};

function getLiveRegion() {
  let region = byId('app-live-region');
  if (!region) {
    region = document.createElement('div');
    region.id = 'app-live-region';
    region.className = 'sr-only';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    document.body.appendChild(region);
  }
  return region;
}

function getActiveScreenElement() {
  return document.querySelector('.screen.active');
}

function getScreenLiveRegion() {
  const activeScreen = getActiveScreenElement();
  if (!activeScreen || !activeScreen.id) {
    return null;
  }
  const regionId = 'screen-live-region-' + activeScreen.id;
  let region = byId(regionId);
  if (!region) {
    region = document.createElement('div');
    region.id = regionId;
    region.className = 'sr-only';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    activeScreen.appendChild(region);
  }
  return region;
}

function rememberFocusContext(key, element) {
  if (!key) {
    return;
  }
  const target = element || document.activeElement;
  focusContextStore[key] = target || null;
}

function restoreFocusContext(key, fallback) {
  const target = focusContextStore[key];
  if (target && typeof target.focus === 'function' && document.contains(target)) {
    target.focus();
    return true;
  }
  if (fallback && typeof fallback.focus === 'function' && document.contains(fallback)) {
    fallback.focus();
    return true;
  }
  return false;
}

function announceStatus(message, mode) {
  const region = getLiveRegion();
  region.setAttribute('aria-live', mode === 'assertive' ? 'assertive' : 'polite');
  region.textContent = '';
  const screenRegion = getScreenLiveRegion();
  if (screenRegion) {
    screenRegion.setAttribute('aria-live', mode === 'assertive' ? 'assertive' : 'polite');
    screenRegion.textContent = '';
  }
  setTimeout(function () {
    region.textContent = message || '';
    if (screenRegion) {
      screenRegion.textContent = message || '';
    }
  }, 20);
}

function getFocusableElements(container) {
  if (!container) {
    return [];
  }
  const selectors = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll(selectors)).filter(function (el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  });
}

function getOpenModal() {
  if (state.activeModalId) {
    return byId(state.activeModalId);
  }
  return document.querySelector('.modal-overlay.show');
}

function openModal(modalId) {
  const modal = byId(modalId);
  if (!modal) {
    return;
  }
  state.lastFocusedElement = document.activeElement;
  rememberFocusContext('modal:' + modalId, document.activeElement);
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  state.activeModalId = modalId;
  const focusables = getFocusableElements(modal);
  if (focusables.length) {
    focusables[0].focus();
  }
}

function closeModal(modalId) {
  const modal = byId(modalId);
  if (!modal) {
    return;
  }
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  if (state.activeModalId === modalId) {
    state.activeModalId = '';
  }
  if (restoreFocusContext('modal:' + modalId, state.lastFocusedElement)) {
    return;
  }
  focusMainContent();
}

function handleModalKeyboard(e) {
  const modal = getOpenModal();
  if (!modal) {
    return;
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    closeModal(modal.id);
    announceStatus('Đã đóng hộp thoại', 'polite');
    return;
  }
  if (e.key !== 'Tab') {
    return;
  }
  const focusables = getFocusableElements(modal);
  if (!focusables.length) {
    e.preventDefault();
    return;
  }
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function initModalAccessibility() {
  const modalA11yMap = {
    invoicePaymentModal: { labelledby: 'invoicePaymentModalTitle', describedby: 'invoicePaymentModalDesc' },
    teacherWeightModal: { labelledby: 'teacherWeightModalTitle', describedby: 'teacherWeightModalDesc' },
    forgotPasswordModal: { labelledby: 'forgotPasswordModalTitle', describedby: 'forgotPasswordModalDesc' },
    userProfileModal: { labelledby: 'userProfileModalTitle', describedby: 'userProfileModalDesc' },
    headerPasswordModal: { labelledby: 'headerPasswordModalTitle', describedby: 'headerPasswordModalDesc' }
  };
  const overlays = document.querySelectorAll('.modal-overlay');
  let i;
  for (i = 0; i < overlays.length; i++) {
    const overlay = overlays[i];
    const box = overlay.querySelector('.modal-box');
    overlay.setAttribute('aria-hidden', 'true');
    if (box) {
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      if (!box.hasAttribute('tabindex')) {
        box.setAttribute('tabindex', '-1');
      }
      if (modalA11yMap[overlay.id]) {
        box.setAttribute('aria-labelledby', modalA11yMap[overlay.id].labelledby);
        box.setAttribute('aria-describedby', modalA11yMap[overlay.id].describedby);
      }
    }
    overlay.addEventListener('mousedown', function (e) {
      if (e.target === this) {
        closeModal(this.id);
      }
    });
  }
  document.addEventListener('keydown', handleModalKeyboard);
}

function focusMainContent() {
  const activeScreen = document.querySelector('.screen.active');
  if (!activeScreen) {
    return;
  }
  const target = activeScreen.querySelector('.content, .content-wide, .teacher-main');
  if (!target) {
    return;
  }
  if (!target.hasAttribute('tabindex')) {
    target.setAttribute('tabindex', '-1');
  }
  target.focus();
}

function initSkipLink() {
  if (byId('skipToMainContent')) {
    return;
  }
  const btn = document.createElement('button');
  btn.id = 'skipToMainContent';
  btn.className = 'skip-link';
  btn.type = 'button';
  btn.textContent = 'Chuyển tới nội dung chính';
  btn.addEventListener('click', focusMainContent);
  document.body.appendChild(btn);
}

function renderNextToast() {
  if (!toastQueue.length) {
    toastActive = false;
    return;
  }
  toastActive = true;
  const current = toastQueue.shift();
  let t = byId('app-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'app-toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = current.message;
  t.classList.remove('toast-error');
  if (current.type === 'error') {
    t.classList.add('toast-error');
  }
  announceStatus(current.message, current.type === 'error' ? 'assertive' : 'polite');
  t.classList.add('show');
  setTimeout(function () {
    t.classList.remove('show');
    setTimeout(renderNextToast, 80);
  }, 1850);
}

function toast(message, type) {
  if (!message) {
    return;
  }
  toastQueue.push({ message: message, type: type || '' });
  if (!toastActive) {
    renderNextToast();
  }
}

function clearInputError(input) {
  if (!input) {
    return;
  }
  input.classList.remove('input-error');
  input.removeAttribute('aria-invalid');
  input.removeAttribute('aria-describedby');
  const err = input.parentElement ? input.parentElement.querySelector('.field-error') : null;
  if (err) {
    err.remove();
  }
}

function markInputError(input, message) {
  if (!input) {
    return;
  }
  input.classList.add('input-error');
  input.setAttribute('aria-invalid', 'true');
  const row = input.parentElement;
  if (!row) {
    return;
  }
  let err = row.querySelector('.field-error');
  if (!err) {
    err = document.createElement('div');
    err.className = 'field-error';
    row.appendChild(err);
  }
  if (!err.id) {
    err.id = (input.id ? (input.id + '-error') : ('field-error-' + Date.now()));
  }
  input.setAttribute('aria-describedby', err.id);
  err.textContent = message;
}

function pushNotification(data) {
  const nowIso = new Date().toISOString();
  const item = {
    id: data.id || ('N' + Date.now()),
    to: data.to || data.audience || '',
    audience: data.audience || data.to || '',
    type: data.type || 'GENERAL',
    title: data.title || 'Thông báo',
    body: data.body || data.text || '',
    text: data.text || data.body || '',
    timestamp: data.timestamp || nowIso,
    time: data.time || new Date().toLocaleString('vi-VN'),
    read: data.read === true
  };
  db.notifications.unshift(item);
  scheduleAppSnapshotSave();
  return item;
}

function getNotificationsFor(userId, role) {
  const list = [];
  let i;
  for (i = 0; i < db.notifications.length; i++) {
    const n = db.notifications[i];
    const target = n.to || n.audience;
    if (target === userId || target === ('all-' + role)) {
      list.push(n);
    }
  }
  return list;
}

function getUnreadNotificationCount(userId, role) {
  const list = getNotificationsFor(userId, role);
  let count = 0;
  let i;
  for (i = 0; i < list.length; i++) {
    if (!list[i].read) {
      count += 1;
    }
  }
  return count;
}

window.rememberFocusContext = rememberFocusContext;
window.restoreFocusContext = restoreFocusContext;
