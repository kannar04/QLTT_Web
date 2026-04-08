function getQuickSearchRole() {
  const user = getAccountById(state.currentUserId);
  return user ? user.role : 'guest';
}

function getQuickSearchCatalog() {
  return [
    { kind: 'screen', id: 's-landing', title: 'Trang chính', subtitle: 'Màn hình chào', roles: ['guest', 'staff', 'teacher', 'student'], keywords: 'landing trang chu chao mung' },
    { kind: 'screen', id: 's-login-staff', title: 'Đăng nhập nhân viên', subtitle: 'Khối nhân viên', roles: ['guest'], keywords: 'login staff nhan vien' },
    { kind: 'screen', id: 's-login-teacher', title: 'Đăng nhập giáo viên', subtitle: 'Khối giáo viên', roles: ['guest'], keywords: 'login teacher giao vien' },
    { kind: 'screen', id: 's-login-student', title: 'Đăng nhập học viên', subtitle: 'Khối học viên', roles: ['guest'], keywords: 'login student hoc vien' },

    { kind: 'screen', id: 's-staff-home', title: 'Trang chủ nhân viên', subtitle: 'Tổng quan vận hành', roles: ['staff'], keywords: 'nhan vien home tong quan' },
    { kind: 'screen', id: 's-account-list', title: 'Danh sách tài khoản', subtitle: 'Quản lý tài khoản', roles: ['staff'], keywords: 'tai khoan account' },
    { kind: 'screen', id: 's-account-create', title: 'Tạo tài khoản', subtitle: 'Tạo mới người dùng', roles: ['staff'], keywords: 'tao tai khoan create' },
    { kind: 'screen', id: 's-class-manage', title: 'Quản lý lớp học', subtitle: 'Danh sách lớp', roles: ['staff'], keywords: 'lop hoc class' },
    { kind: 'screen', id: 's-class-detail', title: 'Chi tiết lớp học', subtitle: 'Danh sách học viên theo lớp', roles: ['staff'], keywords: 'chi tiet lop' },
    { kind: 'screen', id: 's-timetable', title: 'Thời khóa biểu', subtitle: 'Xếp lịch lớp học', roles: ['staff'], keywords: 'thoi khoa bieu lich hoc' },
    { kind: 'screen', id: 's-student-profile-search', title: 'Tra cứu hồ sơ học viên', subtitle: 'Tìm theo mã/họ tên', roles: ['staff'], keywords: 'ho so hoc vien profile' },
    { kind: 'screen', id: 's-staff-leave-approval', title: 'Duyệt đơn nghỉ', subtitle: 'Xử lý đơn học viên', roles: ['staff'], keywords: 'duyet don nghi leave' },
    { kind: 'screen', id: 's-staff-invoice-manage', title: 'Quản lý học phí', subtitle: 'Hóa đơn và thu học phí', roles: ['staff'], keywords: 'hoc phi hoa don invoice' },
    { kind: 'screen', id: 's-staff-notification-send', title: 'Gửi thông báo', subtitle: 'Thông báo học viên', roles: ['staff'], keywords: 'thong bao notify' },
    { kind: 'screen', id: 's-revenue', title: 'Thống kê doanh thu', subtitle: 'Báo cáo tài chính', roles: ['staff'], keywords: 'doanh thu revenue' },
    { kind: 'screen', id: 's-report', title: 'Báo cáo tổng hợp', subtitle: 'Báo cáo điểm và chuyên cần', roles: ['staff'], keywords: 'bao cao report' },

    { kind: 'screen', id: 's-teacher-dashboard', title: 'Tổng quan giáo viên', subtitle: 'Danh sách lớp phụ trách', roles: ['teacher'], keywords: 'giao vien dashboard' },
    { kind: 'screen', id: 's-teacher-class-detail', title: 'Chi tiết lớp giáo viên', subtitle: 'Tác vụ môn học', roles: ['teacher'], keywords: 'chi tiet lop giao vien' },
    { kind: 'screen', id: 's-teacher-upload', title: 'Tải tài liệu', subtitle: 'Đăng tài liệu lớp', roles: ['teacher'], keywords: 'tai lieu upload' },
    { kind: 'screen', id: 's-teacher-homework', title: 'Tạo bài tập', subtitle: 'Giao bài tập mới', roles: ['teacher'], keywords: 'bai tap homework' },
    { kind: 'screen', id: 's-teacher-attendance', title: 'Điểm danh', subtitle: 'Theo dõi chuyên cần', roles: ['teacher'], keywords: 'diem danh attendance' },
    { kind: 'screen', id: 's-teacher-grades', title: 'Bảng điểm lớp', subtitle: 'Nhập điểm học viên', roles: ['teacher'], keywords: 'bang diem grade' },
    { kind: 'screen', id: 's-teacher-notifications', title: 'Thông báo giáo viên', subtitle: 'Thông báo gửi tới giáo viên', roles: ['teacher'], keywords: 'thong bao giao vien' },

    { kind: 'screen', id: 's-student-dashboard', title: 'Tổng quan học tập', subtitle: 'Môn học đang theo học', roles: ['student'], keywords: 'hoc vien dashboard' },
    { kind: 'screen', id: 's-student-class-detail', title: 'Chi tiết môn học', subtitle: 'Tài liệu và bài tập', roles: ['student'], keywords: 'chi tiet mon hoc' },
    { kind: 'screen', id: 's-student-materials', title: 'Tài liệu môn học', subtitle: 'Danh sách tài liệu', roles: ['student'], keywords: 'tai lieu hoc vien' },
    { kind: 'screen', id: 's-student-homework-list', title: 'Danh sách bài tập', subtitle: 'Theo dõi trạng thái nộp', roles: ['student'], keywords: 'bai tap hoc vien' },
    { kind: 'screen', id: 's-student-transcript', title: 'Bảng điểm học viên', subtitle: 'Kết quả các môn', roles: ['student'], keywords: 'bang diem hoc vien transcript' },
    { kind: 'screen', id: 's-student-timetable', title: 'Thời khóa biểu học viên', subtitle: 'Lịch học theo tuần', roles: ['student'], keywords: 'thoi khoa bieu hoc vien' },
    { kind: 'screen', id: 's-student-absence', title: 'Đơn xin nghỉ', subtitle: 'Tạo và theo dõi đơn nghỉ', roles: ['student'], keywords: 'don xin nghi' },
    { kind: 'screen', id: 's-student-tuition', title: 'Thông tin học phí', subtitle: 'Học phí và thanh toán', roles: ['student'], keywords: 'hoc phi thanh toan' },
    { kind: 'screen', id: 's-student-notifications', title: 'Thông báo học viên', subtitle: 'Danh sách thông báo', roles: ['student'], keywords: 'thong bao hoc vien' },
    { kind: 'screen', id: 's-student-profile', title: 'Hồ sơ học viên', subtitle: 'Thông tin cá nhân', roles: ['student'], keywords: 'ho so ca nhan profile' },

    { kind: 'action', id: 'toggle-motion', title: 'Bật/Tắt giảm chuyển động', subtitle: 'Tối ưu hiệu ứng chuyển cảnh', roles: ['guest', 'staff', 'teacher', 'student'], keywords: 'motion animation giam chuyen dong' },
    { kind: 'action', id: 'show-shortcuts', title: 'Xem phím tắt', subtitle: 'Mở bảng hướng dẫn phím tắt', roles: ['guest', 'staff', 'teacher', 'student'], keywords: 'shortcut phim tat' },
    { kind: 'action', id: 'clear-cache', title: 'Xóa lưu tạm local', subtitle: 'Xóa snapshot và draft biểu mẫu', roles: ['guest', 'staff', 'teacher', 'student'], keywords: 'xoa cache local snapshot draft' }
  ];
}

function ensureQuickSearchOverlay() {
  let overlay = byId('quickSearchOverlay');
  if (overlay) {
    return overlay;
  }
  overlay = document.createElement('div');
  overlay.id = 'quickSearchOverlay';
  overlay.className = 'quick-search-overlay';
  overlay.innerHTML =
    '<div class="quick-search-panel" role="dialog" aria-modal="true" aria-labelledby="quickSearchTitle">' +
    '<div class="quick-search-head">' +
    '<div id="quickSearchTitle" class="quick-search-title">Tìm kiếm nhanh</div>' +
    '<button class="quick-search-close" type="button" aria-label="Đóng" data-inline-action="closeQuickSearch()">Esc</button>' +
    '</div>' +
    '<input id="quickSearchInput" class="quick-search-input" type="text" placeholder="Tìm màn hình hoặc lệnh..." autocomplete="off">' +
    '<div id="quickSearchHint" class="quick-search-hint">Ctrl/Cmd + K để mở nhanh, Alt + / để xem phím tắt.</div>' +
    '<div id="quickSearchResults" class="quick-search-results"></div>' +
    '</div>';
  overlay.addEventListener('mousedown', function (e) {
    if (e.target === overlay) {
      closeQuickSearch();
    }
  });
  document.body.appendChild(overlay);

  const input = byId('quickSearchInput');
  if (input) {
    input.addEventListener('input', function () {
      renderQuickSearchResults(input.value || '');
    });
    input.addEventListener('keydown', function (e) {
      const items = Array.from(document.querySelectorAll('.quick-search-item'));
      if (!items.length) {
        return;
      }
      const active = document.activeElement;
      const idx = items.indexOf(active);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIdx = idx < 0 ? 0 : ((idx + 1) % items.length);
        items[nextIdx].focus();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIdx = idx < 0 ? (items.length - 1) : ((idx - 1 + items.length) % items.length);
        items[prevIdx].focus();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        items[0].click();
      }
    });
  }

  return overlay;
}

function executeQuickSearchItem(item) {
  if (!item) {
    return;
  }
  if (item.kind === 'screen') {
    closeQuickSearch();
    show(item.id);
    return;
  }
  if (item.id === 'toggle-motion') {
    toggleReducedMotionPreference();
    closeQuickSearch();
    return;
  }
  if (item.id === 'show-shortcuts') {
    closeQuickSearch();
    openShortcutHelp();
    return;
  }
  if (item.id === 'clear-cache') {
    clearAppSnapshot();
    toast('Đã xóa dữ liệu lưu tạm trên trình duyệt.');
    closeQuickSearch();
  }
}

function renderQuickSearchResults(query) {
  const wrap = byId('quickSearchResults');
  if (!wrap) {
    return;
  }
  const q = String(query || '').trim().toLowerCase();
  const role = getQuickSearchRole();
  const catalog = getQuickSearchCatalog();
  const filtered = [];
  let i;
  for (i = 0; i < catalog.length; i++) {
    const item = catalog[i];
    if (item.roles.indexOf(role) < 0) {
      continue;
    }
    if (item.kind === 'screen' && !byId(item.id)) {
      continue;
    }
    const haystack = (item.title + ' ' + item.subtitle + ' ' + item.keywords).toLowerCase();
    if (q && haystack.indexOf(q) < 0) {
      continue;
    }
    filtered.push(item);
  }

  if (!filtered.length) {
    wrap.innerHTML = '<div class="quick-search-empty">Không tìm thấy kết quả phù hợp.</div>';
    return;
  }

  const top = filtered.slice(0, QUICK_SEARCH_LIMIT);
  let html = '';
  for (i = 0; i < top.length; i++) {
    html += '<button class="quick-search-item" type="button" data-idx="' + i + '">' +
      '<span class="quick-search-item-title">' + top[i].title + '</span>' +
      '<span class="quick-search-item-sub">' + top[i].subtitle + '</span>' +
      '</button>';
  }
  wrap.innerHTML = html;

  const nodes = wrap.querySelectorAll('.quick-search-item');
  for (i = 0; i < nodes.length; i++) {
    nodes[i].addEventListener('click', (function (idx) {
      return function () {
        executeQuickSearchItem(top[idx]);
      };
    })(i));
  }
}

function openQuickSearch(seed) {
  const overlay = ensureQuickSearchOverlay();
  if (typeof rememberFocusContext === 'function') {
    rememberFocusContext('overlay:quick-search', document.activeElement);
  }
  overlay.classList.add('show');
  state.quickSearchOpen = true;
  const input = byId('quickSearchInput');
  if (input) {
    input.value = seed || '';
    renderQuickSearchResults(input.value);
    input.focus();
  }
}

function closeQuickSearch() {
  const overlay = byId('quickSearchOverlay');
  if (!overlay) {
    return;
  }
  overlay.classList.remove('show');
  state.quickSearchOpen = false;
  if (typeof restoreFocusContext === 'function' && restoreFocusContext('overlay:quick-search')) {
    return;
  }
  if (typeof focusMainContent === 'function') {
    focusMainContent();
  }
}

function ensureShortcutHelpOverlay() {
  let overlay = byId('shortcutHelpOverlay');
  if (overlay) {
    return overlay;
  }
  overlay = document.createElement('div');
  overlay.id = 'shortcutHelpOverlay';
  overlay.className = 'shortcut-help-overlay';
  overlay.innerHTML =
    '<div class="shortcut-help-panel" role="dialog" aria-modal="true" aria-labelledby="shortcutHelpTitle">' +
    '<div class="shortcut-help-head">' +
    '<div id="shortcutHelpTitle" class="shortcut-help-title">Phím tắt nhanh</div>' +
    '<button class="shortcut-help-close" type="button" aria-label="Đóng" data-inline-action="closeShortcutHelp()">Esc</button>' +
    '</div>' +
    '<div class="shortcut-help-list">' +
    '<div class="shortcut-help-item"><span>Ctrl/Cmd + K</span><span>Mở tìm kiếm nhanh</span></div>' +
    '<div class="shortcut-help-item"><span>Alt + /</span><span>Mở danh sách phím tắt</span></div>' +
    '<div class="shortcut-help-item"><span>Alt + M</span><span>Bật/Tắt giảm chuyển động</span></div>' +
    '<div class="shortcut-help-item"><span>Esc</span><span>Đóng hộp thoại/panel đang mở</span></div>' +
    '</div>' +
    '</div>';
  overlay.addEventListener('mousedown', function (e) {
    if (e.target === overlay) {
      closeShortcutHelp();
    }
  });
  document.body.appendChild(overlay);
  return overlay;
}

function openShortcutHelp() {
  const overlay = ensureShortcutHelpOverlay();
  if (typeof rememberFocusContext === 'function') {
    rememberFocusContext('overlay:shortcut-help', document.activeElement);
  }
  overlay.classList.add('show');
  state.shortcutHelpOpen = true;
}

function closeShortcutHelp() {
  const overlay = byId('shortcutHelpOverlay');
  if (!overlay) {
    return;
  }
  overlay.classList.remove('show');
  state.shortcutHelpOpen = false;
  if (typeof restoreFocusContext === 'function' && restoreFocusContext('overlay:shortcut-help')) {
    return;
  }
  if (typeof focusMainContent === 'function') {
    focusMainContent();
  }
}

function initGlobalKeyboardShortcuts() {
  if (window.__studyhomeShortcutsBound) {
    return;
  }
  document.addEventListener('keydown', function (e) {
    if (getOpenModal()) {
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openQuickSearch('');
      return;
    }
    if (e.altKey && e.key === '/') {
      e.preventDefault();
      openShortcutHelp();
      return;
    }
    if (e.altKey && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      toggleReducedMotionPreference();
      return;
    }
    if (e.key === 'Escape') {
      if (state.quickSearchOpen) {
        e.preventDefault();
        closeQuickSearch();
        return;
      }
      if (state.shortcutHelpOpen) {
        e.preventDefault();
        closeShortcutHelp();
      }
    }
  });
  window.__studyhomeShortcutsBound = true;
}

function initConnectivityWatcher() {
  if (window.__studyhomeConnectivityBound) {
    return;
  }
  window.addEventListener('online', function () {
    toast('Kết nối Internet đã được khôi phục.');
  });
  window.addEventListener('offline', function () {
    toast('Bạn đang offline. Dữ liệu sẽ được lưu tạm trên trình duyệt.', 'error');
  });
  window.__studyhomeConnectivityBound = true;
}

function bindDraftField(id) {
  const input = byId(id);
  if (!input || input.dataset.draftBound === '1') {
    return;
  }
  const key = APP_DRAFT_PREFIX + id;
  const saved = safeStorageGet(key);
  if (saved && !input.value) {
    input.value = saved;
  }
  input.addEventListener('input', function () {
    safeStorageSet(key, input.value || '');
  });
  input.dataset.draftBound = '1';
}

function initDraftPersistence() {
  let i;
  for (i = 0; i < APP_DRAFT_FIELDS.length; i++) {
    bindDraftField(APP_DRAFT_FIELDS[i]);
  }
}

function clearDraftField(id) {
  safeStorageRemove(APP_DRAFT_PREFIX + id);
}

function clearDraftFields(ids) {
  if (!Array.isArray(ids)) {
    return;
  }
  let i;
  for (i = 0; i < ids.length; i++) {
    clearDraftField(ids[i]);
  }
}

function initRuntimeEnhancements() {
  const restored = loadAppSnapshot();
  applyReducedMotionPreference(!!state.reducedMotion, true);
  ensureScreenLoadingBar();
  initScrollTopButton();
  initGlobalKeyboardShortcuts();
  initConnectivityWatcher();
  initDraftPersistence();
  startAppAutosaveHeartbeat();
  return restored;
}

function performLogout() {
  const wasLoggedIn = !!state.currentUserId;
  const previousUserId = state.currentUserId;
  if (wasLoggedIn && typeof logAuditAction === 'function') {
    logAuditAction('logout', 'Đăng xuất tài khoản', { userId: previousUserId });
  }
  state.currentUserId = '';
  state.selectedPaymentMethod = '';
  state.selectedTuitionInvoiceId = '';
  state.screenHistory = [];
  state.lastScreenId = 's-landing';
  closeQuickSearch();
  closeShortcutHelp();
  scheduleAppSnapshotSave();
  show('s-landing', true);
  if (wasLoggedIn) {
    toast('Đã đăng xuất tài khoản.');
  }
}
