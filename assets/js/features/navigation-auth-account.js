function getActiveScreenId() {
  const active = document.querySelector('.screen.active');
  return active ? active.id : '';
}

function getLoginScreenByRole(role) {
  if (role === 'staff') {
    return 's-login-staff';
  }
  if (role === 'teacher') {
    return 's-login-teacher';
  }
  return 's-login-student';
}

function focusLoginAccountInput(screenOrRole) {
  const screenId = (screenOrRole || '').indexOf('s-login-') === 0
    ? screenOrRole
    : getLoginScreenByRole(screenOrRole || 'student');
  const root = byId(screenId);
  if (!root) {
    return;
  }
  const accountInput = root.querySelector('input[type="text"]');
  if (accountInput) {
    accountInput.focus();
    accountInput.select();
  }
}

function renderLandingRoleHint() {
  const node = byId('landingRoleHint');
  if (!node) {
    return;
  }
  node.textContent = 'Chọn vai trò để tiếp tục đăng nhập.';
}

function chooseLoginRole(role) {
  const resolvedRole = role === 'staff' || role === 'teacher' ? role : 'student';
  const target = getLoginScreenByRole(resolvedRole);
  show(target);
  setTimeout(function () {
    focusLoginAccountInput(target);
  }, 20);
}

function togglePasswordVisibility(inputId, triggerNode) {
  const input = byId(inputId);
  if (!input) {
    return;
  }
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  if (triggerNode) {
    triggerNode.textContent = isPassword ? 'Ẩn' : 'Hiện';
    triggerNode.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
  }
}

function getLoginRoleLabel(role) {
  if (role === 'staff') {
    return 'Nhân viên';
  }
  if (role === 'teacher') {
    return 'Giáo viên';
  }
  return 'Học viên';
}

function setForgotPasswordResult(message, type) {
  const node = byId('forgotPasswordResult');
  if (!node) {
    return;
  }
  node.textContent = message || '';
  if (type === 'error') {
    node.style.color = '#b42318';
    return;
  }
  if (type === 'success') {
    node.style.color = '#166534';
    return;
  }
  node.style.color = '';
}

function openForgotPassword(role) {
  const resolvedRole = role === 'staff' || role === 'teacher' ? role : 'student';
  state.forgotPasswordRole = resolvedRole;

  const roleInput = byId('forgotPasswordRoleLabel');
  if (roleInput) {
    roleInput.value = getLoginRoleLabel(resolvedRole);
  }

  const accountInput = byId('forgotPasswordAccountId');
  if (accountInput) {
    const loginRoot = byId('s-login-' + resolvedRole);
    const loginAccount = loginRoot ? loginRoot.querySelector('input[type="text"]') : null;
    accountInput.value = loginAccount && loginAccount.value ? loginAccount.value.trim().toUpperCase() : '';
    clearInputError(accountInput);
  }

  setForgotPasswordResult('Mật khẩu sẽ được khôi phục về 111111.', '');

  if (typeof openModal === 'function') {
    openModal('forgotPasswordModal');
  }

  setTimeout(function () {
    if (accountInput) {
      accountInput.focus();
      accountInput.select();
    }
  }, 20);
}

function submitForgotPasswordLookup() {
  const role = state.forgotPasswordRole === 'staff' || state.forgotPasswordRole === 'teacher'
    ? state.forgotPasswordRole
    : 'student';
  const accountInput = byId('forgotPasswordAccountId');
  const accountId = accountInput && accountInput.value ? accountInput.value.trim().toUpperCase() : '';

  clearInputError(accountInput);
  if (!accountId) {
    markInputError(accountInput, 'Vui lòng nhập mã tài khoản');
    setForgotPasswordResult('Vui lòng nhập mã tài khoản trước khi khôi phục.', 'error');
    toast('Vui lòng nhập mã tài khoản', 'error');
    return;
  }

  let found = null;
  let i;
  for (i = 0; i < db.accounts.length; i++) {
    if (db.accounts[i].role === role && db.accounts[i].id === accountId) {
      found = db.accounts[i];
      break;
    }
  }

  if (!found) {
    markInputError(accountInput, 'Không tìm thấy tài khoản thuộc vai trò đã chọn');
    setForgotPasswordResult('Không tìm thấy tài khoản ' + accountId + ' trong nhóm ' + getLoginRoleLabel(role) + '.', 'error');
    toast('Không tìm thấy tài khoản để khôi phục', 'error');
    return;
  }

  found.password = '111111';
  if (typeof scheduleAppSnapshotSave === 'function') {
    scheduleAppSnapshotSave();
  }
  if (typeof logAuditAction === 'function') {
    logAuditAction('password-reset', 'Khôi phục mật khẩu tài khoản đăng nhập', { role: role, userId: found.id, resetTo: '111111' });
  }

  const loginRoot = byId('s-login-' + role);
  const loginPass = getLoginPasswordInput(loginRoot);
  if (loginPass) {
    loginPass.value = '111111';
    clearInputError(loginPass);
  }

  setForgotPasswordResult('Đã khôi phục mật khẩu cho ' + found.id + ' (' + found.name + '). Mật khẩu mới: 111111.', 'success');
  toast('Đã khôi phục mật khẩu về 111111');
}

function bindLandingLoginShortcuts() {
  if (window.__studyhomeLandingShortcutsBound) {
    return;
  }
  document.addEventListener('keydown', function (event) {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (typeof getOpenModal === 'function' && getOpenModal()) {
      return;
    }
    const active = getActiveScreenId();
    if (active.indexOf('s-login-') === 0 && event.key === 'Escape') {
      event.preventDefault();
      show('s-landing', true);
      renderLandingRoleHint();
    }
  });
  window.__studyhomeLandingShortcutsBound = true;
}

function setLoginButtonBusy(role, busy) {
  const btn = byId('btn-login-' + role);
  if (!btn) {
    return;
  }
  btn.disabled = !!busy;
  btn.classList.toggle('is-busy', !!busy);
}

function getLoginPasswordInput(root) {
  if (!root) {
    return null;
  }
  return root.querySelector('.login-password-wrap input') || root.querySelector('input[type="password"]');
}

function setLoginCapsHint(input, event) {
  if (!input || !input.id) {
    return;
  }
  const hint = byId(input.id + 'CapsHint');
  if (!hint) {
    return;
  }
  const isCapsOn = !!(event && typeof event.getModifierState === 'function' && event.getModifierState('CapsLock'));
  hint.textContent = isCapsOn ? 'Caps Lock đang bật.' : '';
}

function bindLoginCapsLockHints() {
  if (window.__studyhomeLoginCapsBound) {
    return;
  }
  const screens = ['s-login-staff', 's-login-teacher', 's-login-student'];
  let i;
  for (i = 0; i < screens.length; i++) {
    const root = byId(screens[i]);
    const passInput = getLoginPasswordInput(root);
    if (!passInput) {
      continue;
    }
    passInput.addEventListener('keydown', function (event) {
      setLoginCapsHint(event.target, event);
    });
    passInput.addEventListener('keyup', function (event) {
      setLoginCapsHint(event.target, event);
    });
    passInput.addEventListener('blur', function (event) {
      setLoginCapsHint(event.target, null);
    });
  }
  window.__studyhomeLoginCapsBound = true;
}

window.chooseLoginRole = chooseLoginRole;
window.togglePasswordVisibility = togglePasswordVisibility;
window.openForgotPassword = openForgotPassword;
window.submitForgotPasswordLookup = submitForgotPasswordLookup;
window.bindLandingLoginShortcuts = bindLandingLoginShortcuts;
window.bindLoginCapsLockHints = bindLoginCapsLockHints;
window.renderLandingRoleHint = renderLandingRoleHint;

function animateScreenEnter(el) {
  if (!el) {
    return;
  }
  el.classList.remove('screen-enter');
  void el.offsetWidth;
  el.classList.add('screen-enter');
}

function show(id, fromHistory) {
  const currentUser = getAccountById(state.currentUserId);
  const role = currentUser ? currentUser.role : '';

  if (!role) {
    if (id.indexOf('s-staff-') === 0 || id.indexOf('s-student-') === 0 || id.indexOf('s-teacher-') === 0) {
      return;
    }
  }

  // Nhân viên không được vào màn học viên (trừ 2 màn hồ sơ dành cho nhân viên xem)
  if (role === 'staff') {
    if (id === 's-student-profile') {
      id = 's-student-profile-search';
    }
    if (
      id.indexOf('s-student-') === 0 &&
      id !== 's-student-profile-search' &&
      id !== 's-student-profile-detail'
    ) {
      id = 's-student-profile-search';
    }
  }

  // Học viên/giáo viên không được vào màn nhân viên
  if (role === 'student' || role === 'teacher') {
    if (
      id.indexOf('s-staff-') === 0 ||
      id.indexOf('s-account-') === 0 ||
      id === 's-staff-home' ||
      id === 's-class-manage' ||
      id === 's-class-detail' ||
      id === 's-timetable' ||
      id === 's-revenue' ||
      id === 's-report' ||
      id === 's-report-grade' ||
      id === 's-report-attendance' ||
      id === 's-student-profile-search' ||
      id === 's-student-profile-detail'
    ) {
      return;
    }
  }

  const current = getActiveScreenId();
  if (!fromHistory && current && current !== id) {
    state.screenHistory.push(current);
    if (state.screenHistory.length > 120) {
      state.screenHistory.shift();
    }
  }

  if (typeof startScreenLoading === 'function') {
    startScreenLoading();
  }

  const screens = document.querySelectorAll('.screen');
  let i;
  for (i = 0; i < screens.length; i++) {
    screens[i].classList.remove('active');
  }
  const el = byId(id);
  if (el) {
    el.classList.add('active');
    animateScreenEnter(el);
    window.scrollTo(0, 0);
    syncScreen(id);
    if (id.indexOf('s-login-') === 0) {
      setTimeout(function () {
        focusLoginAccountInput(id);
      }, 20);
    }
    if (id === 's-landing') {
      renderLandingRoleHint();
    }
    state.lastScreenId = id;
    if (typeof scheduleAppSnapshotSave === 'function') {
      scheduleAppSnapshotSave();
    }
    if (typeof finishScreenLoading === 'function') {
      finishScreenLoading();
    }
  } else {
    console.warn('Screen not found:', id);
    if (typeof finishScreenLoading === 'function') {
      finishScreenLoading();
    }
  }
}

function goBack() {
  if (!state.screenHistory.length) {
    show('s-landing', true);
    return;
  }
  const previous = state.screenHistory.pop();
  if (!previous) {
    show('s-landing', true);
    return;
  }
  show(previous, true);
}

function initScreens() {
  const active = document.querySelector('.screen.active');
  if (!active) {
    const fallback = byId('s-landing');
    if (fallback) {
      fallback.classList.add('active');
    }
  }
}

function setAccountTablePage(page) {
  state.accountTablePage = Math.max(1, Number(page) || 1);
  renderAccountTable();
}

function setStudentProfileTablePage(page) {
  state.studentProfileTablePage = Math.max(1, Number(page) || 1);
  renderStudentProfileTable();
}

function loginByRole(role, targetScreen) {
  const root = byId('s-login-' + role);
  if (!root) {
    return;
  }
  const accountInput = root.querySelector('input[type="text"]');
  const passInput = getLoginPasswordInput(root);
  const accountId = accountInput && accountInput.value ? accountInput.value.trim().toUpperCase() : '';
  const password = passInput && passInput.value ? passInput.value.trim() : '';
  clearInputError(accountInput);
  clearInputError(passInput);
  if (!accountId) {
    markInputError(accountInput, 'Vui lòng nhập mã tài khoản');
    toast('Vui lòng nhập mã tài khoản', 'error');
    return;
  }
  if (!password) {
    markInputError(passInput, 'Vui lòng nhập mật khẩu');
    toast('Vui lòng nhập mật khẩu', 'error');
    return;
  }

  let found = null;
  let i;
  for (i = 0; i < db.accounts.length; i++) {
    if (db.accounts[i].role === role && db.accounts[i].id === accountId) {
      found = db.accounts[i];
      break;
    }
  }
  if (!found) {
    markInputError(accountInput, 'Mã tài khoản không tồn tại trong hệ thống');
    toast('Mã tài khoản không tồn tại trong hệ thống', 'error');
    return;
  }
  if ((found.status || 'active') === 'inactive') {
    toast('Tài khoản đã bị khóa. Vui lòng liên hệ nhân viên trung tâm.', 'error');
    return;
  }
  if (found.password !== password) {
    markInputError(passInput, 'Sai mật khẩu, vui lòng nhập lại');
    toast('Sai mật khẩu, vui lòng nhập lại', 'error');
    return;
  }

  setLoginButtonBusy(role, true);
  setTimeout(function () {
    state.currentUserId = found.id;
    state.selectedAccountId = found.id;
    state.screenHistory = [];
    if (role === 'teacher' && found.classCodes && found.classCodes.length) {
      state.selectedClassCode = found.classCodes[0];
    } else if (found.classCode) {
      state.selectedClassCode = found.classCode;
    }
    if (typeof logAuditAction === 'function') {
      logAuditAction('login', 'Đăng nhập thành công', { role: role, userId: found.id, targetScreen: targetScreen });
    }
    toast('Đăng nhập thành công: ' + found.name);
    setLoginButtonBusy(role, false);
    show(targetScreen);
  }, 160);
}

function renderAccountTable() {
  const body = byId('accountTableBody');
  if (!body) {
    return;
  }
  const qInput = byId('accountSearchInput');
  const roleSortInput = byId('accountRoleSort');
  const q = qInput && qInput.value ? qInput.value.trim().toLowerCase() : '';

  function normalizeAccountRoleSort(value) {
    if (value === 'student' || value === 'staff' || value === 'teacher') {
      return value;
    }
    return 'all';
  }

  let roleSort = normalizeAccountRoleSort(state.accountRoleSort);
  if (roleSortInput) {
    if (roleSortInput.value !== roleSort) {
      roleSortInput.value = roleSort;
    }
    roleSort = normalizeAccountRoleSort(roleSortInput.value);
  }
  state.accountRoleSort = roleSort;

  const filtered = [];
  let i;
  for (i = 0; i < db.accounts.length; i++) {
    const item = db.accounts[i];
    if (roleSort !== 'all' && item.role !== roleSort) {
      continue;
    }
    if (q && item.id.toLowerCase().indexOf(q) === -1 && item.name.toLowerCase().indexOf(q) === -1) {
      continue;
    }
    filtered.push(item);
  }

  if (typeof renderVirtualizedTableRows === 'function' && filtered.length >= 150) {
    const virtualized = renderVirtualizedTableRows({
      bodyId: 'accountTableBody',
      rows: filtered,
      signature: 'account|' + q + '|' + roleSort + '|' + filtered.length,
      colCount: 7,
      rowHeight: 52,
      maxHeight: 540,
      threshold: 150,
      renderRow: function (a) {
        const roleClass = 'role-' + a.role;
        const subjectDisplay = a.classCode ? getSubjectDisplay(a.classCode) : '-';
        return '<tr>' +
          '<td>' + a.id + '</td>' +
          '<td><div class="fw700">' + a.name + '</div></td>' +
          '<td>' + (a.birthYear || '-') + '</td>' +
          '<td>' + (a.gender || '-') + '</td>' +
          '<td><span class="role-badge ' + roleClass + '">' + getRoleLabel(a.role) + '</span></td>' +
          '<td>' + subjectDisplay + '</td>' +
          '<td><button class="btn btn-cyan btn-sm" data-inline-action="openAccountEdit(\'' + a.id + '\')">Chỉnh sửa</button></td>' +
          '</tr>';
      }
    });
    if (virtualized) {
      const pagerVirtual = typeof ensureTablePagerElement === 'function' ? ensureTablePagerElement('accountTableBody', 'accountTablePager') : null;
      if (pagerVirtual) {
        pagerVirtual.innerHTML = '<div class="table-pager-label">Đang dùng cuộn ảo cho ' + filtered.length + ' mục</div>';
      }
      if (typeof announceStatus === 'function') {
        announceStatus('Bảng tài khoản có ' + filtered.length + ' kết quả, đang hiển thị ở chế độ cuộn ảo.', 'polite');
      }
      return;
    }
  }

  if (typeof clearVirtualizedTable === 'function') {
    clearVirtualizedTable('accountTableBody');
  }

  const pageSize = typeof getTablePageSize === 'function' ? getTablePageSize('account') : 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (!state.accountTablePage || state.accountTablePage > totalPages) {
    state.accountTablePage = 1;
  }
  const start = (state.accountTablePage - 1) * pageSize;
  const slice = filtered.slice(start, start + pageSize);
  let html = '';
  for (i = 0; i < slice.length; i++) {
    const a = slice[i];
    const roleClass = 'role-' + a.role;
    const subjectDisplay = a.classCode ? getSubjectDisplay(a.classCode) : '-';
    html += '<tr>' +
      '<td>' + a.id + '</td>' +
      '<td><div class="fw700">' + a.name + '</div></td>' +
      '<td>' + (a.birthYear || '-') + '</td>' +
      '<td>' + (a.gender || '-') + '</td>' +
      '<td><span class="role-badge ' + roleClass + '">' + getRoleLabel(a.role) + '</span></td>' +
      '<td>' + subjectDisplay + '</td>' +
      '<td><button class="btn btn-cyan btn-sm" data-inline-action="openAccountEdit(\'' + a.id + '\')">Chỉnh sửa</button></td>' +
      '</tr>';
  }
  body.innerHTML = html || '<tr><td colspan="7" class="txt-center">Không có dữ liệu</td></tr>';
  if (typeof normalizeInlineHandlersToDelegation === 'function') {
    normalizeInlineHandlersToDelegation(body);
  }
  if (typeof ensureTablePagerElement === 'function' && typeof renderTablePager === 'function') {
    const pager = ensureTablePagerElement('accountTableBody', 'accountTablePager');
    renderTablePager(pager, state.accountTablePage, totalPages, filtered.length, 'setAccountTablePage');
  }
  if (typeof announceStatus === 'function') {
    const roleFilterLabel = roleSort === 'all'
      ? ''
      : (roleSort === 'student' ? ', lọc học viên' : (roleSort === 'staff' ? ', lọc nhân viên' : ', lọc giáo viên'));
    announceStatus('Bảng tài khoản có ' + filtered.length + ' kết quả' + roleFilterLabel + ', trang ' + state.accountTablePage + '/' + totalPages + '.', 'polite');
  }
}

function openAccountEdit(id) {
  const a = getAccountById(id);
  if (!a) {
    return;
  }
  state.selectedAccountId = id;
  byId('editAccountCode').value = a.id;
  byId('editAccountPassword').value = a.password;
  byId('editAccountName').value = a.name;
  byId('editAccountBirthYear').value = a.birthYear;
  byId('editAccountGender').value = a.gender;
  byId('editAccountEmail').value = a.email || '';
  byId('editAccountPhone').value = a.phone || '';
  byId('editAccountClassCode').value = a.classCode;
  show('s-account-edit');
}

function validateAccountForm(formId) {
  const isCreate = formId === 's-account-create';
  const fields = {
    id: byId(isCreate ? 'createAccountCode' : 'editAccountCode'),
    name: byId(isCreate ? 'createAccountName' : 'editAccountName'),
    password: byId(isCreate ? 'createAccountPassword' : 'editAccountPassword'),
    role: byId(isCreate ? 'createAccountRole' : null),
    email: byId(isCreate ? 'createAccountEmail' : 'editAccountEmail'),
    phone: byId(isCreate ? 'createAccountPhone' : 'editAccountPhone'),
    gender: byId(isCreate ? 'createAccountGender' : 'editAccountGender')
  };

  let ok = true;
  function checkRequired(input, message) {
    if (!input) {
      return;
    }
    clearInputError(input);
    input.oninput = function () { clearInputError(input); };
    if (!input.value || !input.value.trim()) {
      markInputError(input, message);
      ok = false;
    }
  }

  checkRequired(fields.id, 'Vui lòng nhập mã tài khoản');
  checkRequired(fields.name, 'Vui lòng nhập họ và tên');
  checkRequired(fields.password, 'Vui lòng nhập mật khẩu');
  if (isCreate) {
    checkRequired(fields.role, 'Vui lòng nhập vai trò');
  }

  if (fields.email && fields.email.value.trim()) {
    fields.email.oninput = function () { clearInputError(fields.email); };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value.trim())) {
      markInputError(fields.email, 'Email không đúng định dạng');
      ok = false;
    }
  }

  if (fields.phone && fields.phone.value.trim()) {
    fields.phone.oninput = function () { clearInputError(fields.phone); };
    if (!/^[0-9]{1,10}$/.test(fields.phone.value.trim())) {
      markInputError(fields.phone, 'Số điện thoại chỉ chứa số, tối đa 10 chữ số');
      ok = false;
    }
  }

  if (fields.gender && fields.gender.value.trim()) {
    const g = fields.gender.value.trim();
    fields.gender.oninput = function () { clearInputError(fields.gender); };
    if (g !== 'Nam' && g !== 'Nữ') {
      markInputError(fields.gender, 'Giới tính chỉ chấp nhận Nam hoặc Nữ');
      ok = false;
    }
  }

  return ok;
}

function createAccount() {
  if (!validateAccountForm('s-account-create')) {
    toast('Vui lòng kiểm tra lại thông tin tài khoản', 'error');
    return;
  }
  const id = byId('createAccountCode').value.trim().toUpperCase();
  const name = byId('createAccountName').value.trim();
  const pwd = byId('createAccountPassword').value.trim();
  const pwd2 = byId('createAccountPasswordConfirm').value.trim();
  const role = byId('createAccountRole').value.trim().toLowerCase();
  if (pwd !== pwd2) {
    toast('Mật khẩu xác nhận không khớp.', 'error');
    return;
  }
  if (getAccountById(id)) {
    toast('Tài khoản đã tồn tại.', 'error');
    return;
  }
  db.accounts.unshift({
    id: id,
    password: pwd,
    role: role,
    name: name,
    birthYear: 2000,
    gender: byId('createAccountGender').value.trim() || 'Nam',
    classCode: '',
    phone: byId('createAccountPhone').value.trim(),
    email: byId('createAccountEmail').value.trim(),
    address: ''
  });
  if (typeof logAuditAction === 'function') {
    logAuditAction('account-create', 'Tạo tài khoản mới', { accountId: id, role: role });
  }
  renderStaffSidebarStats();
  toast('Đã tạo tài khoản mới.');
  show('s-account-list');
  renderAccountTable();
}

function updateAccount() {
  if (!validateAccountForm('s-account-edit')) {
    toast('Vui lòng kiểm tra lại dữ liệu cập nhật', 'error');
    return;
  }
  const id = state.selectedAccountId;
  const a = getAccountById(id);
  if (!a) {
    return;
  }
  const previous = {
    name: a.name,
    role: a.role,
    classCode: a.classCode
  };
  a.password = byId('editAccountPassword').value.trim() || a.password;
  a.name = byId('editAccountName').value.trim() || a.name;
  a.birthYear = Number(byId('editAccountBirthYear').value.trim() || a.birthYear);
  a.gender = byId('editAccountGender').value.trim() || a.gender;
  a.email = byId('editAccountEmail').value.trim();
  a.phone = byId('editAccountPhone').value.trim();
  a.classCode = byId('editAccountClassCode').value.trim().toUpperCase() || '';
  if (typeof logAuditAction === 'function') {
    logAuditAction('account-update', 'Cập nhật tài khoản', {
      accountId: id,
      beforeName: previous.name,
      afterName: a.name,
      beforeClassCode: previous.classCode,
      afterClassCode: a.classCode
    });
  }
  toast('Đã cập nhật tài khoản.');
  if (state.editAccountFromProfile) {
    state.editAccountFromProfile = false;
    renderStudentDetail(state.selectedAccountId);
    show('s-student-profile-detail');
  } else {
    show('s-account-list');
  }
  renderAccountTable();
  renderStudentProfileTable();
}

function cancelAccountEdit() {
  if (state.editAccountFromProfile) {
    state.editAccountFromProfile = false;
    show('s-student-profile-detail');
    return;
  }
  show('s-account-list');
}

function renderStudentProfileTable() {
  const body = byId('studentProfileTableBody');
  if (!body) {
    return;
  }
  const qInput = byId('studentProfileSearchInput');
  const q = qInput && qInput.value ? qInput.value.trim().toLowerCase() : '';
  const filtered = [];
  let i;
  for (i = 0; i < db.accounts.length; i++) {
    const a = db.accounts[i];
    if (a.role !== 'student') {
      continue;
    }
    if (q && a.id.toLowerCase().indexOf(q) === -1 && a.name.toLowerCase().indexOf(q) === -1) {
      continue;
    }
    filtered.push(a);
  }

  if (typeof renderVirtualizedTableRows === 'function' && filtered.length >= 150) {
    const virtualized = renderVirtualizedTableRows({
      bodyId: 'studentProfileTableBody',
      rows: filtered,
      signature: 'student-profile|' + q + '|' + filtered.length,
      colCount: 7,
      rowHeight: 52,
      maxHeight: 540,
      threshold: 150,
      renderRow: function (a) {
        return '<tr>' +
          '<td>' + a.id + '</td>' +
          '<td><div class="fw700">' + a.name + '</div></td>' +
          '<td>' + (a.birthYear || '-') + '</td>' +
          '<td>' + (a.gender || '-') + '</td>' +
          '<td><span class="role-badge role-student">Học viên</span></td>' +
          '<td>' + getSubjectDisplay(a.classCode) + '</td>' +
          '<td><button class="btn btn-cyan btn-sm" data-inline-action="viewStudentProfileDetail(\'' + a.id + '\')">Xem chi tiết</button></td>' +
          '</tr>';
      }
    });
    if (virtualized) {
      const pagerVirtual = typeof ensureTablePagerElement === 'function' ? ensureTablePagerElement('studentProfileTableBody', 'studentProfileTablePager') : null;
      if (pagerVirtual) {
        pagerVirtual.innerHTML = '<div class="table-pager-label">Đang dùng cuộn ảo cho ' + filtered.length + ' mục</div>';
      }
      if (typeof announceStatus === 'function') {
        announceStatus('Bảng hồ sơ học viên có ' + filtered.length + ' kết quả, đang hiển thị ở chế độ cuộn ảo.', 'polite');
      }
      return;
    }
  }

  if (typeof clearVirtualizedTable === 'function') {
    clearVirtualizedTable('studentProfileTableBody');
  }

  const pageSize = typeof getTablePageSize === 'function' ? getTablePageSize('studentProfile') : 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (!state.studentProfileTablePage || state.studentProfileTablePage > totalPages) {
    state.studentProfileTablePage = 1;
  }
  const start = (state.studentProfileTablePage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  let html = '';
  for (i = 0; i < pageRows.length; i++) {
    const a = pageRows[i];
    html += '<tr>' +
      '<td>' + a.id + '</td>' +
      '<td><div class="fw700">' + a.name + '</div></td>' +
      '<td>' + (a.birthYear || '-') + '</td>' +
      '<td>' + (a.gender || '-') + '</td>' +
      '<td><span class="role-badge role-student">Học viên</span></td>' +
      '<td>' + getSubjectDisplay(a.classCode) + '</td>' +
      '<td><button class="btn btn-cyan btn-sm" data-inline-action="viewStudentProfileDetail(\'' + a.id + '\')">Xem chi tiết</button></td>' +
      '</tr>';
  }
  body.innerHTML = html || '<tr><td colspan="7" class="txt-center">Không có dữ liệu</td></tr>';
  if (typeof normalizeInlineHandlersToDelegation === 'function') {
    normalizeInlineHandlersToDelegation(body);
  }
  if (typeof ensureTablePagerElement === 'function' && typeof renderTablePager === 'function') {
    const pager = ensureTablePagerElement('studentProfileTableBody', 'studentProfileTablePager');
    renderTablePager(pager, state.studentProfileTablePage, totalPages, filtered.length, 'setStudentProfileTablePage');
  }
  if (typeof announceStatus === 'function') {
    announceStatus('Bảng hồ sơ học viên có ' + filtered.length + ' kết quả, trang ' + state.studentProfileTablePage + '/' + totalPages + '.', 'polite');
  }
}

function viewStudentProfileDetail(studentId) {
  state.selectedAccountId = studentId;
  renderStudentDetail(studentId);
  show('s-student-profile-detail');
}

function openStudentProfileDetail(studentId) {
  viewStudentProfileDetail(studentId);
}

function openStudentEditFromDetail() {
  const studentId = state.selectedAccountId;
  if (!studentId) {
    toast('Không tìm thấy thông tin học viên.', 'error');
    return;
  }
  state.editAccountFromProfile = true;
  openAccountEdit(studentId);
}

function renderStudentDetail(studentId) {
  const s = getAccountById(studentId || state.selectedAccountId);
  if (!s) {
    return;
  }
  const classCodes = getStudentSubjectCodes(s);
  const classNames = [];
  let i;
  for (i = 0; i < classCodes.length; i++) {
    classNames.push(getSubjectDisplay(classCodes[i]));
  }

  function setText(id, value) {
    const el = byId(id);
    if (el) {
      el.textContent = value;
    }
  }

  const birthDate = s.birthDate || ('01/09/' + (s.birthYear || '----'));
  setText('studentDetailCode', s.id || '-');
  setText('studentDetailPassword', s.password || '-');
  setText('studentDetailName', s.name || '-');
  setText('studentDetailRole', getRoleLabel(s.role));
  setText('studentDetailBirth', birthDate);
  setText('studentDetailGender', s.gender || '-');
  setText('studentDetailEmail', s.email || '(chưa cập nhật)');
  setText('studentDetailPhone', s.phone || '(chưa cập nhật)');
  setText('studentDetailAddress', s.address || '(chưa cập nhật)');
  setText('studentDetailClasses', classNames.length ? classNames.join(', ') : '(chưa có lớp)');
}

