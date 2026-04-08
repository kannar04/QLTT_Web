const INLINE_ACTION_ATTR = 'data-inline-action';
const APP_UNDO_LIMIT = 20;
const APP_AUDIT_LOG_LIMIT = 1200;
const APP_AUDIT_RETENTION_KEY = 'studyhome-audit-retention-days';
const APP_AUDIT_RETENTION_DEFAULT_DAYS = 180;
const TABLE_PAGE_SIZE_MAP = {
  account: 12,
  studentProfile: 12,
  invoice: 10
};
const TABLE_VIRTUAL_THRESHOLD = 150;

const appUndoStack = [];
const virtualTableStates = {};
let inlineDelegationBound = false;
let inlineNormalizeObserver = null;
let undoShortcutBound = false;
let auditOverlayBound = false;
let backupImportInput = null;

function resolveFunctionPath(path) {
  if (!path) {
    return null;
  }
  const parts = String(path).split('.');
  let ctx = window;
  let i;
  for (i = 0; i < parts.length - 1; i++) {
    if (!ctx || typeof ctx !== 'object') {
      return null;
    }
    ctx = ctx[parts[i]];
  }
  if (!ctx) {
    return null;
  }
  const fn = ctx[parts[parts.length - 1]];
  if (typeof fn !== 'function') {
    return null;
  }
  return { ctx: ctx, fn: fn };
}

function parseInlineArgs(argsText, event, element) {
  if (!argsText || !argsText.trim()) {
    return [];
  }
  return Function('event', 'element', 'return [' + argsText + '];')(event, element);
}

function executeDelegatedInlineAction(actionText, event, element) {
  if (!actionText) {
    return;
  }
  const statements = String(actionText).split(';');
  let i;
  for (i = 0; i < statements.length; i++) {
    let stmt = statements[i].trim();
    if (!stmt) {
      continue;
    }
    if (stmt === 'event.stopPropagation()') {
      event.stopPropagation();
      continue;
    }
    if (stmt === 'event.preventDefault()') {
      event.preventDefault();
      continue;
    }
    if (stmt === 'return false') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (stmt.indexOf('return ') === 0) {
      stmt = stmt.slice(7).trim();
    }
    const callMatch = stmt.match(/^([A-Za-z_$][\w$.]*)\((.*)\)$/);
    if (!callMatch) {
      continue;
    }
    const resolved = resolveFunctionPath(callMatch[1]);
    if (!resolved) {
      continue;
    }
    const args = parseInlineArgs(callMatch[2], event, element);
    resolved.fn.apply(resolved.ctx, args);
  }
}

function normalizeInlineHandlersToDelegation(scope) {
  const root = scope || document;
  const nodes = root.querySelectorAll('[onclick]');
  let i;
  for (i = 0; i < nodes.length; i++) {
    const expr = nodes[i].getAttribute('onclick');
    if (!expr) {
      continue;
    }
    if (!nodes[i].getAttribute(INLINE_ACTION_ATTR)) {
      nodes[i].setAttribute(INLINE_ACTION_ATTR, expr.trim());
    }
    nodes[i].removeAttribute('onclick');
  }
}

function bindInlineActionDelegation() {
  if (inlineDelegationBound) {
    return;
  }
  document.addEventListener('click', function (event) {
    const target = event.target.closest('[' + INLINE_ACTION_ATTR + ']');
    if (!target) {
      return;
    }
    const actionText = target.getAttribute(INLINE_ACTION_ATTR);
    if (!actionText) {
      return;
    }
    executeDelegatedInlineAction(actionText, event, target);
  });
  inlineDelegationBound = true;
}

function startInlineNormalizationObserver() {
  if (inlineNormalizeObserver || !document.body || typeof MutationObserver !== 'function') {
    return;
  }
  inlineNormalizeObserver = new MutationObserver(function (mutations) {
    let i;
    for (i = 0; i < mutations.length; i++) {
      const nodes = mutations[i].addedNodes;
      let j;
      for (j = 0; j < nodes.length; j++) {
        if (nodes[j] && nodes[j].nodeType === 1) {
          normalizeInlineHandlersToDelegation(nodes[j]);
        }
      }
    }
  });
  inlineNormalizeObserver.observe(document.body, { childList: true, subtree: true });
}

function ensureAuditLogs() {
  if (!db || !Array.isArray(db.auditLogs)) {
    db.auditLogs = [];
  }
}

function getAuditRetentionDays() {
  const raw = typeof safeStorageGet === 'function' ? safeStorageGet(APP_AUDIT_RETENTION_KEY) : null;
  const parsed = Number(raw || APP_AUDIT_RETENTION_DEFAULT_DAYS);
  if (!parsed || parsed < 1) {
    return APP_AUDIT_RETENTION_DEFAULT_DAYS;
  }
  return Math.min(3650, Math.floor(parsed));
}

function setAuditRetentionDays(days) {
  const safeDays = Math.max(1, Math.min(3650, Number(days) || APP_AUDIT_RETENTION_DEFAULT_DAYS));
  if (typeof safeStorageSet === 'function') {
    safeStorageSet(APP_AUDIT_RETENTION_KEY, String(safeDays));
  }
  return safeDays;
}

function applyAuditRetentionPolicy(days, silent) {
  ensureAuditLogs();
  const retentionDays = setAuditRetentionDays(days);
  const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
  const before = db.auditLogs.length;
  db.auditLogs = db.auditLogs.filter(function (row) {
    const rowTime = Date.parse(row.at || '');
    if (!rowTime) {
      return true;
    }
    return rowTime >= cutoffTime;
  });
  if (db.auditLogs.length > APP_AUDIT_LOG_LIMIT) {
    db.auditLogs.length = APP_AUDIT_LOG_LIMIT;
  }
  const removed = before - db.auditLogs.length;
  if (removed > 0 && !silent && typeof toast === 'function') {
    toast('Đã dọn ' + removed + ' bản ghi audit quá hạn.');
  }
  if (removed > 0 && typeof scheduleAppSnapshotSave === 'function') {
    scheduleAppSnapshotSave();
  }
  return removed;
}

function getAuditActor() {
  const user = typeof getAccountById === 'function' ? getAccountById(state.currentUserId) : null;
  if (user) {
    return { id: user.id, role: user.role, name: user.name };
  }
  return { id: 'guest', role: 'guest', name: 'Khách' };
}

function logAuditAction(action, detail, meta) {
  ensureAuditLogs();
  applyAuditRetentionPolicy(getAuditRetentionDays(), true);
  const actor = getAuditActor();
  const item = {
    id: 'AL' + Date.now() + String(Math.floor(Math.random() * 1000)).padStart(3, '0'),
    at: new Date().toISOString(),
    actorId: actor.id,
    actorRole: actor.role,
    actorName: actor.name,
    screenId: typeof getActiveScreenId === 'function' ? getActiveScreenId() : '',
    action: action || 'action',
    detail: detail || '',
    meta: typeof cloneData === 'function' ? cloneData(meta || {}) : (meta || {})
  };
  db.auditLogs.unshift(item);
  if (db.auditLogs.length > APP_AUDIT_LOG_LIMIT) {
    db.auditLogs.length = APP_AUDIT_LOG_LIMIT;
  }
  if (typeof scheduleAppSnapshotSave === 'function') {
    scheduleAppSnapshotSave();
  }
  return item;
}

function pushUndoAction(label, restoreHandler, meta) {
  if (typeof restoreHandler !== 'function') {
    return;
  }
  appUndoStack.push({
    label: label || 'Thao tác',
    restore: restoreHandler,
    meta: meta || {},
    at: Date.now()
  });
  if (appUndoStack.length > APP_UNDO_LIMIT) {
    appUndoStack.shift();
  }
  if (typeof announceStatus === 'function') {
    announceStatus('Đã lưu thao tác hoàn tác: ' + label, 'polite');
  }
}

function undoLastAction(silent) {
  const latest = appUndoStack.pop();
  if (!latest) {
    if (!silent && typeof toast === 'function') {
      toast('Không có thao tác để hoàn tác.');
    }
    return false;
  }
  try {
    latest.restore();
    if (typeof scheduleAppSnapshotSave === 'function') {
      scheduleAppSnapshotSave();
    }
    logAuditAction('undo', 'Hoàn tác: ' + latest.label, latest.meta || {});
    if (typeof toast === 'function') {
      toast('Đã hoàn tác: ' + latest.label);
    }
    return true;
  } catch (e) {
    if (typeof toast === 'function') {
      toast('Không thể hoàn tác thao tác gần nhất.', 'error');
    }
    return false;
  }
}

function isEditableTarget(target) {
  if (!target) {
    return false;
  }
  const tag = String(target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    return true;
  }
  return !!target.isContentEditable;
}

function bindUndoShortcut() {
  if (undoShortcutBound) {
    return;
  }
  document.addEventListener('keydown', function (event) {
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') {
      return;
    }
    if (isEditableTarget(event.target)) {
      return;
    }
    if (typeof getOpenModal === 'function' && getOpenModal()) {
      return;
    }
    event.preventDefault();
    undoLastAction(false);
  });
  undoShortcutBound = true;
}

function getBackupPayload() {
  const statePayload = typeof getPersistedStateSnapshot === 'function' ? getPersistedStateSnapshot() : {};
  const dbPayload = typeof getPersistedDbSnapshot === 'function' ? getPersistedDbSnapshot() : {};
  return {
    schema: 'studyhome-local-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    state: statePayload,
    db: dbPayload
  };
}

function triggerJsonDownload(fileName, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportLocalSnapshotJson() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  triggerJsonDownload('studyhome-backup-' + stamp + '.json', getBackupPayload());
  logAuditAction('backup-export', 'Xuất backup local JSON', {});
  if (typeof toast === 'function') {
    toast('Đã xuất backup dữ liệu local.');
  }
}

function restoreBackupPayload(payload, sourceName) {
  if (!payload || payload.schema !== 'studyhome-local-backup') {
    throw new Error('INVALID_SCHEMA');
  }
  if (!payload.state || !payload.db) {
    throw new Error('INVALID_PAYLOAD');
  }
  if (typeof applyPersistedDbSnapshot === 'function') {
    applyPersistedDbSnapshot(payload.db);
  }
  if (typeof applyPersistedStateSnapshot === 'function') {
    applyPersistedStateSnapshot(payload.state);
  }
  if (typeof scheduleAppSnapshotSave === 'function') {
    scheduleAppSnapshotSave();
  }
  const targetScreen = payload.state && payload.state.lastScreenId && typeof byId === 'function' && byId(payload.state.lastScreenId)
    ? payload.state.lastScreenId
    : 's-landing';
  if (typeof show === 'function') {
    show(targetScreen, true);
  }
  logAuditAction('backup-import', 'Nhập backup local JSON', { source: sourceName || '' });
}

function importLocalSnapshotJson() {
  if (!backupImportInput) {
    backupImportInput = document.createElement('input');
    backupImportInput.type = 'file';
    backupImportInput.accept = 'application/json,.json';
    backupImportInput.style.display = 'none';
    backupImportInput.addEventListener('change', function () {
      const file = backupImportInput.files && backupImportInput.files[0] ? backupImportInput.files[0] : null;
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const payload = JSON.parse(String(reader.result || ''));
          restoreBackupPayload(payload, file.name);
          if (typeof toast === 'function') {
            toast('Khôi phục dữ liệu thành công từ ' + file.name + '.');
          }
        } catch (e) {
          if (typeof toast === 'function') {
            toast('Không thể nhập backup JSON. Vui lòng kiểm tra tệp.', 'error');
          }
        }
      };
      reader.readAsText(file);
      backupImportInput.value = '';
    });
    document.body.appendChild(backupImportInput);
  }
  backupImportInput.click();
}

function parseAuditDateStart(value) {
  if (!value) {
    return 0;
  }
  const date = new Date(value + 'T00:00:00');
  return Number(date.getTime()) || 0;
}

function parseAuditDateEnd(value) {
  if (!value) {
    return 0;
  }
  const date = new Date(value + 'T23:59:59.999');
  return Number(date.getTime()) || 0;
}

function getFilteredAuditLogs() {
  ensureAuditLogs();
  const role = byId('auditRoleFilter') ? byId('auditRoleFilter').value : 'all';
  const actorText = byId('auditActorFilter') ? byId('auditActorFilter').value.trim().toLowerCase() : '';
  const actionText = byId('auditActionFilter') ? byId('auditActionFilter').value.trim().toLowerCase() : '';
  const fromDate = byId('auditFromFilter') ? byId('auditFromFilter').value : '';
  const toDate = byId('auditToFilter') ? byId('auditToFilter').value : '';
  const startTime = parseAuditDateStart(fromDate);
  const endTime = parseAuditDateEnd(toDate);

  const filtered = [];
  let i;
  for (i = 0; i < db.auditLogs.length; i++) {
    const row = db.auditLogs[i];
    if (role !== 'all' && row.actorRole !== role) {
      continue;
    }
    const actorHaystack = String((row.actorId || '') + ' ' + (row.actorName || '')).toLowerCase();
    if (actorText && actorHaystack.indexOf(actorText) < 0) {
      continue;
    }
    const actionHaystack = String((row.action || '') + ' ' + (row.detail || '')).toLowerCase();
    if (actionText && actionHaystack.indexOf(actionText) < 0) {
      continue;
    }
    const rowTime = Date.parse(row.at || '');
    if (startTime && rowTime && rowTime < startTime) {
      continue;
    }
    if (endTime && rowTime && rowTime > endTime) {
      continue;
    }
    filtered.push(row);
  }
  return filtered;
}

function exportAuditLogJson() {
  const logs = getFilteredAuditLogs();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  triggerJsonDownload('studyhome-audit-log-' + stamp + '.json', {
    schema: 'studyhome-audit-log',
    version: 2,
    exportedAt: new Date().toISOString(),
    retentionDays: getAuditRetentionDays(),
    logs: logs
  });
  if (typeof toast === 'function') {
    toast('Đã xuất audit log (' + logs.length + ' bản ghi).');
  }
}

function applyAuditRetentionFromUi() {
  const select = byId('auditRetentionDays');
  const days = select ? Number(select.value) : getAuditRetentionDays();
  const removed = applyAuditRetentionPolicy(days, false);
  renderAuditLogTable();
  if (removed === 0 && typeof toast === 'function') {
    toast('Không có bản ghi audit quá hạn để dọn.');
  }
}

function ensureAuditOverlay() {
  let overlay = byId('auditLogOverlay');
  if (overlay) {
    return overlay;
  }
  overlay = document.createElement('div');
  overlay.id = 'auditLogOverlay';
  overlay.className = 'shortcut-help-overlay';
  overlay.innerHTML =
    '<div class="shortcut-help-panel audit-log-panel" role="dialog" aria-modal="true" aria-labelledby="auditLogTitle">' +
    '<div class="shortcut-help-head">' +
    '<div id="auditLogTitle" class="shortcut-help-title">Audit Log thao tác</div>' +
    '<button class="shortcut-help-close" type="button" aria-label="Đóng" ' + INLINE_ACTION_ATTR + '="closeAuditLogOverlay()">Esc</button>' +
    '</div>' +
    '<div class="audit-log-toolbar">' +
    '<label for="auditRoleFilter">Vai trò</label>' +
    '<select id="auditRoleFilter" class="fi"><option value="all">Tất cả</option><option value="staff">Nhân viên</option><option value="teacher">Giáo viên</option><option value="student">Học viên</option><option value="guest">Khách</option></select>' +
    '<input id="auditActorFilter" class="fi" type="text" placeholder="Lọc người dùng / mã">' +
    '<input id="auditActionFilter" class="fi" type="text" placeholder="Lọc hành động / chi tiết">' +
    '<label for="auditFromFilter">Từ</label><input id="auditFromFilter" class="fi" type="date">' +
    '<label for="auditToFilter">Đến</label><input id="auditToFilter" class="fi" type="date">' +
    '<label for="auditLimitFilter">Giới hạn</label>' +
    '<select id="auditLimitFilter" class="fi"><option value="120">120</option><option value="240" selected>240</option><option value="500">500</option><option value="1000">1000</option></select>' +
    '<label for="auditRetentionDays">Lưu</label>' +
    '<select id="auditRetentionDays" class="fi"><option value="7">7 ngày</option><option value="30">30 ngày</option><option value="90">90 ngày</option><option value="180">180 ngày</option><option value="365">365 ngày</option></select>' +
    '<button class="btn btn-outline btn-xs" type="button" ' + INLINE_ACTION_ATTR + '="applyAuditRetentionFromUi()">Dọn quá hạn</button>' +
    '<button class="btn btn-outline btn-xs" type="button" ' + INLINE_ACTION_ATTR + '="exportAuditLogJson()">Xuất JSON</button>' +
    '</div>' +
    '<div class="overflow-x-auto"><table class="tbl audit-log-table"><thead><tr><th>Thời gian</th><th>Người dùng</th><th>Vai trò</th><th>Hành động</th><th>Chi tiết</th></tr></thead><tbody id="auditLogTableBody"></tbody></table></div>' +
    '</div>';
  overlay.addEventListener('mousedown', function (event) {
    if (event.target === overlay) {
      closeAuditLogOverlay();
    }
  });
  document.body.appendChild(overlay);

  const filterIds = ['auditRoleFilter', 'auditActorFilter', 'auditActionFilter', 'auditFromFilter', 'auditToFilter', 'auditLimitFilter'];
  let i;
  for (i = 0; i < filterIds.length; i++) {
    const node = byId(filterIds[i]);
    if (!node || node.dataset.bound === '1') {
      continue;
    }
    node.addEventListener('input', renderAuditLogTable);
    node.addEventListener('change', renderAuditLogTable);
    node.dataset.bound = '1';
  }
  const retention = byId('auditRetentionDays');
  if (retention) {
    retention.value = String(getAuditRetentionDays());
  }
  return overlay;
}

function renderAuditLogTable() {
  const body = byId('auditLogTableBody');
  if (!body) {
    return;
  }
  const filtered = getFilteredAuditLogs();
  const limit = byId('auditLimitFilter') ? Math.max(1, Number(byId('auditLimitFilter').value) || 240) : 240;
  const rows = filtered.slice(0, limit);
  let html = '';
  let i;
  for (i = 0; i < rows.length; i++) {
    const row = rows[i];
    html += '<tr>' +
      '<td>' + new Date(row.at).toLocaleString('vi-VN') + '</td>' +
      '<td>' + (row.actorName || row.actorId || '-') + '</td>' +
      '<td>' + (row.actorRole || '-') + '</td>' +
      '<td>' + (row.action || '-') + '</td>' +
      '<td>' + (row.detail || '-') + '</td>' +
      '</tr>';
  }
  body.innerHTML = html || '<tr><td colspan="5">Không có bản ghi phù hợp.</td></tr>';
  if (typeof announceStatus === 'function') {
    announceStatus('Audit log hiển thị ' + rows.length + '/' + filtered.length + ' bản ghi.', 'polite');
  }
}

function openAuditLogOverlay() {
  const overlay = ensureAuditOverlay();
  if (typeof rememberFocusContext === 'function') {
    rememberFocusContext('overlay:audit', document.activeElement);
  }
  overlay.classList.add('show');
  renderAuditLogTable();
}

function closeAuditLogOverlay() {
  const overlay = byId('auditLogOverlay');
  if (!overlay) {
    return;
  }
  overlay.classList.remove('show');
  if (typeof restoreFocusContext === 'function' && restoreFocusContext('overlay:audit')) {
    return;
  }
  if (typeof focusMainContent === 'function') {
    focusMainContent();
  }
}

function maybeCloseAuditWithEscape(event) {
  if (event.key !== 'Escape') {
    return;
  }
  const overlay = byId('auditLogOverlay');
  if (!overlay || !overlay.classList.contains('show')) {
    return;
  }
  event.preventDefault();
  closeAuditLogOverlay();
}

function bindAuditOverlayShortcut() {
  if (auditOverlayBound) {
    return;
  }
  document.addEventListener('keydown', maybeCloseAuditWithEscape);
  auditOverlayBound = true;
}

function getCurrentRole() {
  const user = typeof getAccountById === 'function' ? getAccountById(state.currentUserId) : null;
  return user ? user.role : 'guest';
}

function buildRuntimeActionCatalog() {
  return [
    { kind: 'action', id: 'undo-last', title: 'Hoàn tác thao tác gần nhất', subtitle: 'Khôi phục hành động phá hủy vừa thực hiện', roles: ['staff', 'teacher'], keywords: 'undo hoan tac xoa khoa so' },
    { kind: 'action', id: 'backup-export', title: 'Xuất backup JSON', subtitle: 'Tải snapshot local ra tệp', roles: ['guest', 'staff', 'teacher', 'student'], keywords: 'backup export json snapshot' },
    { kind: 'action', id: 'backup-import', title: 'Nhập backup JSON', subtitle: 'Khôi phục dữ liệu từ tệp', roles: ['guest', 'staff', 'teacher', 'student'], keywords: 'backup import json restore' },
    { kind: 'action', id: 'audit-view', title: 'Xem audit log', subtitle: 'Theo dõi thao tác nhân viên/giáo viên', roles: ['staff', 'teacher'], keywords: 'audit log truy vet thao tac' },
    { kind: 'action', id: 'audit-export', title: 'Xuất audit log JSON', subtitle: 'Tải lịch sử thao tác', roles: ['staff', 'teacher'], keywords: 'audit export json' }
  ];
}

function buildRuntimeDataCatalog() {
  const role = getCurrentRole();
  const items = [];
  if (role === 'staff') {
    let i;
    let studentCount = 0;
    for (i = 0; i < db.accounts.length; i++) {
      const acc = db.accounts[i];
      if (acc.role !== 'student') {
        continue;
      }
      items.push({
        kind: 'data',
        dataType: 'student',
        entityId: acc.id,
        title: acc.id + ' - ' + acc.name,
        subtitle: 'Học viên | ' + (acc.classCode || '-'),
        roles: ['staff'],
        keywords: 'hoc vien student ' + acc.id + ' ' + acc.name
      });
      studentCount += 1;
      if (studentCount >= 80) {
        break;
      }
    }
    let invoiceCount = 0;
    for (i = 0; i < db.invoices.length; i++) {
      const inv = db.invoices[i];
      items.push({
        kind: 'data',
        dataType: 'invoice',
        entityId: inv.id,
        title: inv.id + ' - ' + inv.studentId,
        subtitle: (inv.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán') + ' | ' + formatCurrency(inv.totalAmount),
        roles: ['staff'],
        keywords: 'hoa don invoice hoc phi ' + inv.id + ' ' + inv.studentId
      });
      invoiceCount += 1;
      if (invoiceCount >= 80) {
        break;
      }
    }
  }

  let c;
  for (c = 0; c < db.classes.length; c++) {
    const cls = db.classes[c];
    items.push({
      kind: 'data',
      dataType: 'class',
      entityId: cls.code,
      title: cls.code + ' - ' + cls.subject,
      subtitle: 'Lớp | Sĩ số ' + cls.studentIds.length + '/' + cls.capacity,
      roles: ['staff', 'teacher', 'student'],
      keywords: 'lop class ' + cls.code + ' ' + cls.subject + ' ' + cls.name
    });
  }
  return items;
}

function handleRuntimeAction(id) {
  if (id === 'undo-last') {
    undoLastAction(false);
    return true;
  }
  if (id === 'backup-export') {
    exportLocalSnapshotJson();
    return true;
  }
  if (id === 'backup-import') {
    importLocalSnapshotJson();
    return true;
  }
  if (id === 'audit-view') {
    openAuditLogOverlay();
    return true;
  }
  if (id === 'audit-export') {
    exportAuditLogJson();
    return true;
  }
  return false;
}

function handleRuntimeDataQuickSearch(item) {
  if (!item || item.kind !== 'data') {
    return false;
  }
  if (item.dataType === 'student') {
    state.selectedAccountId = item.entityId;
    if (typeof renderStudentDetail === 'function') {
      renderStudentDetail(item.entityId);
    }
    if (typeof show === 'function') {
      show('s-student-profile-detail');
    }
    return true;
  }
  if (item.dataType === 'class') {
    state.selectedClassCode = item.entityId;
    const user = typeof getAccountById === 'function' ? getAccountById(state.currentUserId) : null;
    if (user && user.role === 'staff' && typeof openClassDetail === 'function') {
      openClassDetail(item.entityId);
      return true;
    }
    if (user && user.role === 'teacher' && typeof show === 'function') {
      show('s-teacher-class-detail');
      return true;
    }
    if (user && user.role === 'student' && typeof show === 'function') {
      show('s-student-class-detail');
      return true;
    }
    return false;
  }
  if (item.dataType === 'invoice') {
    state.selectedInvoiceId = item.entityId;
    state.selectedInvoiceFilter = 'all';
    if (typeof show === 'function') {
      show('s-staff-invoice-manage');
    }
    if (typeof renderStaffInvoiceList === 'function') {
      renderStaffInvoiceList();
    }
    return true;
  }
  return false;
}

function patchQuickSearchCatalog() {
  const originalCatalog = typeof getQuickSearchCatalog === 'function' ? getQuickSearchCatalog : null;
  if (originalCatalog && !window.__studyhomeCatalogPatched) {
    window.getQuickSearchCatalog = function () {
      const base = originalCatalog();
      return base.concat(buildRuntimeActionCatalog(), buildRuntimeDataCatalog());
    };
    window.__studyhomeCatalogPatched = true;
  }

  const originalExecute = typeof executeQuickSearchItem === 'function' ? executeQuickSearchItem : null;
  if (originalExecute && !window.__studyhomeQuickExecutePatched) {
    window.executeQuickSearchItem = function (item) {
      if (!item) {
        return;
      }
      if (item.kind === 'action' && handleRuntimeAction(item.id)) {
        if (typeof closeQuickSearch === 'function') {
          closeQuickSearch();
        }
        return;
      }
      if (item.kind === 'data' && handleRuntimeDataQuickSearch(item)) {
        if (typeof closeQuickSearch === 'function') {
          closeQuickSearch();
        }
        return;
      }
      originalExecute(item);
    };
    window.__studyhomeQuickExecutePatched = true;
  }
}

function ensureTablePagerElement(tableBodyId, pagerId) {
  const body = byId(tableBodyId);
  if (!body) {
    return null;
  }
  let pager = byId(pagerId);
  if (pager) {
    return pager;
  }
  const host = body.closest('.overflow-x-auto') || body.closest('.tbl-wrap') || body.parentElement;
  if (!host || !host.parentElement) {
    return null;
  }
  pager = document.createElement('div');
  pager.id = pagerId;
  pager.className = 'table-pager';
  host.parentElement.insertBefore(pager, host.nextSibling);
  return pager;
}

function renderTablePager(pager, currentPage, totalPages, totalRows, onChangeFn) {
  if (!pager) {
    return;
  }
  if (totalPages <= 1) {
    pager.innerHTML = totalRows ? '<div class="table-pager-label">Tổng ' + totalRows + ' mục</div>' : '';
    return;
  }
  const prev = Math.max(1, currentPage - 1);
  const next = Math.min(totalPages, currentPage + 1);
  pager.innerHTML =
    '<div class="table-pager-inner">' +
    '<button class="btn btn-outline btn-xs" type="button" ' + INLINE_ACTION_ATTR + '="' + onChangeFn + '(' + prev + ')"' + (currentPage === 1 ? ' disabled' : '') + '>Trước</button>' +
    '<span class="table-pager-label">Trang ' + currentPage + '/' + totalPages + ' - ' + totalRows + ' mục</span>' +
    '<button class="btn btn-outline btn-xs" type="button" ' + INLINE_ACTION_ATTR + '="' + onChangeFn + '(' + next + ')"' + (currentPage === totalPages ? ' disabled' : '') + '>Sau</button>' +
    '</div>';
  normalizeInlineHandlersToDelegation(pager);
}

function clearVirtualizedTable(bodyId) {
  const stateRef = virtualTableStates[bodyId];
  if (!stateRef) {
    return;
  }
  if (stateRef.host && stateRef.scrollHandler) {
    stateRef.host.removeEventListener('scroll', stateRef.scrollHandler);
  }
  if (stateRef.host) {
    stateRef.host.style.maxHeight = '';
    stateRef.host.style.overflowY = '';
  }
  delete virtualTableStates[bodyId];
}

function renderVirtualizedTableRows(options) {
  const cfg = options || {};
  const bodyId = cfg.bodyId;
  const body = byId(bodyId);
  if (!body || !Array.isArray(cfg.rows) || typeof cfg.renderRow !== 'function') {
    return false;
  }
  const threshold = Math.max(1, Number(cfg.threshold) || TABLE_VIRTUAL_THRESHOLD);
  if (cfg.rows.length < threshold) {
    clearVirtualizedTable(bodyId);
    return false;
  }
  const host = body.closest('.tbl-wrap') || body.closest('.overflow-x-auto') || body.parentElement;
  if (!host) {
    return false;
  }

  const maxHeight = Math.max(260, Number(cfg.maxHeight) || 520);
  const rowHeight = Math.max(28, Number(cfg.rowHeight) || 46);
  const overscan = Math.max(2, Number(cfg.overscan) || 8);
  const colCount = Math.max(1, Number(cfg.colCount) || 1);
  const signature = String(cfg.signature || (bodyId + '|' + cfg.rows.length));

  let stateRef = virtualTableStates[bodyId];
  if (!stateRef || stateRef.host !== host) {
    clearVirtualizedTable(bodyId);
    stateRef = { host: host, scrollHandler: null, signature: '' };
    virtualTableStates[bodyId] = stateRef;
  }

  stateRef.rows = cfg.rows;
  stateRef.renderRow = cfg.renderRow;
  stateRef.colCount = colCount;
  stateRef.rowHeight = rowHeight;
  stateRef.overscan = overscan;
  stateRef.maxHeight = maxHeight;
  stateRef.signature = signature;

  host.style.maxHeight = maxHeight + 'px';
  host.style.overflowY = 'auto';

  function drawVirtualRows() {
    const rows = stateRef.rows || [];
    if (!rows.length) {
      body.innerHTML = '';
      return;
    }
    const viewportHeight = Math.max(host.clientHeight || maxHeight, rowHeight * 4);
    const visibleCount = Math.ceil(viewportHeight / rowHeight) + (overscan * 2);
    const rawStart = Math.floor(host.scrollTop / rowHeight) - overscan;
    const start = Math.max(0, rawStart);
    const end = Math.min(rows.length, start + visibleCount);
    const topSpace = start * rowHeight;
    const bottomSpace = Math.max(0, (rows.length - end) * rowHeight);

    let html = '';
    if (topSpace > 0) {
      html += '<tr class="virtual-spacer" aria-hidden="true"><td colspan="' + colCount + '" style="height:' + topSpace + 'px;padding:0;border:0;"></td></tr>';
    }
    let i;
    for (i = start; i < end; i++) {
      html += stateRef.renderRow(rows[i], i);
    }
    if (bottomSpace > 0) {
      html += '<tr class="virtual-spacer" aria-hidden="true"><td colspan="' + colCount + '" style="height:' + bottomSpace + 'px;padding:0;border:0;"></td></tr>';
    }
    body.innerHTML = html;
    if (typeof normalizeInlineHandlersToDelegation === 'function') {
      normalizeInlineHandlersToDelegation(body);
    }
  }

  if (!stateRef.scrollHandler) {
    stateRef.scrollHandler = (typeof createDebounced === 'function')
      ? createDebounced(drawVirtualRows, 14)
      : drawVirtualRows;
    host.addEventListener('scroll', stateRef.scrollHandler, { passive: true });
  }

  drawVirtualRows();
  return true;
}

function getTablePageSize(key) {
  return TABLE_PAGE_SIZE_MAP[key] || 10;
}

function createDebounced(fn, waitMs) {
  let timer = 0;
  return function () {
    const args = arguments;
    const context = this;
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, waitMs || 200);
  };
}

function initRuntimeUpgradeServices() {
  ensureAuditLogs();
  applyAuditRetentionPolicy(getAuditRetentionDays(), true);
  bindInlineActionDelegation();
  startInlineNormalizationObserver();
  bindUndoShortcut();
  bindAuditOverlayShortcut();
  patchQuickSearchCatalog();
  normalizeInlineHandlersToDelegation(document);
}

window.createDebounced = createDebounced;
window.ensureTablePagerElement = ensureTablePagerElement;
window.renderTablePager = renderTablePager;
window.renderVirtualizedTableRows = renderVirtualizedTableRows;
window.clearVirtualizedTable = clearVirtualizedTable;
window.getTablePageSize = getTablePageSize;
window.normalizeInlineHandlersToDelegation = normalizeInlineHandlersToDelegation;
window.logAuditAction = logAuditAction;
window.pushUndoAction = pushUndoAction;
window.undoLastAction = undoLastAction;
window.exportLocalSnapshotJson = exportLocalSnapshotJson;
window.importLocalSnapshotJson = importLocalSnapshotJson;
window.exportAuditLogJson = exportAuditLogJson;
window.applyAuditRetentionFromUi = applyAuditRetentionFromUi;
window.openAuditLogOverlay = openAuditLogOverlay;
window.closeAuditLogOverlay = closeAuditLogOverlay;
window.initRuntimeUpgradeServices = initRuntimeUpgradeServices;
