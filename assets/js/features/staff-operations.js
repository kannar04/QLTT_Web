function setLeaveApprovalTab(tab) {
  state.selectedLeaveApprovalTab = tab;
  renderStaffLeaveApproval();
}

function renderStaffLeaveApproval() {
  const body = byId('staffLeaveApprovalBody');
  if (!body) {
    return;
  }
  let html = '';
  let i;
  for (i = 0; i < db.leaveRequests.length; i++) {
    const r = db.leaveRequests[i];
    if (state.selectedLeaveApprovalTab === 'pending' && r.status !== 'pending') {
      continue;
    }
    if (state.selectedLeaveApprovalTab === 'approved' && r.status !== 'approved') {
      continue;
    }
    if (state.selectedLeaveApprovalTab === 'rejected' && r.status !== 'rejected') {
      continue;
    }
    const st = r.status === 'pending' ? 'Chờ duyệt' : (r.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối');
    const act = r.status === 'pending'
      ? '<button class="btn btn-green btn-xs" data-inline-action="approveLeaveRequest(\'' + r.id + '\')">Duyệt</button> <button class="btn btn-red btn-xs" data-inline-action="showRejectLeaveInput(\'' + r.id + '\')">Từ chối</button><div id="reject-' + r.id + '" class="inline-hidden mt8"><input class="fi" id="reject-input-' + r.id + '" placeholder="Nhập lý do từ chối"><button class="btn btn-red mt8" data-inline-action="rejectLeaveRequest(\'' + r.id + '\')">Gửi từ chối</button></div>'
      : '-';
    html += '<tr><td>' + r.id + '</td><td>' + r.studentId + '</td><td>' + (r.classCode || '-') + '</td><td>' + r.date + '</td><td>' + r.reason + (r.rejectReason ? '<br><em>Lý do từ chối: ' + r.rejectReason + '</em>' : '') + '</td><td>' + st + '</td><td>' + act + '</td></tr>';
  }
  body.innerHTML = html || '<tr><td colspan="7">Không có dữ liệu</td></tr>';
  if (typeof normalizeInlineHandlersToDelegation === 'function') {
    normalizeInlineHandlersToDelegation(body);
  }
  if (typeof announceStatus === 'function') {
    announceStatus('Danh sách đơn nghỉ hiển thị theo tab ' + state.selectedLeaveApprovalTab + '.', 'polite');
  }
}

function approveLeaveRequest(id) {
  const item = db.leaveRequests.find(function (x) { return x.id === id; });
  if (!item) {
    return;
  }
  item.status = 'approved';
  if (typeof logAuditAction === 'function') {
    logAuditAction('leave-approve', 'Duyệt đơn xin nghỉ', { leaveId: id, studentId: item.studentId, classCode: item.classCode });
  }
  scheduleAppSnapshotSave();
  renderStaffLeaveApproval();
  toast('Đã duyệt đơn xin nghỉ.');
}

function showRejectLeaveInput(id) {
  const el = byId('reject-' + id);
  if (el) {
    el.classList.remove('inline-hidden');
  }
}

function rejectLeaveRequest(id) {
  const input = byId('reject-input-' + id);
  const reason = input ? input.value.trim() : '';
  if (!reason) {
    if (input) {
      markInputError(input, 'Vui lòng nhập lý do từ chối');
    }
    toast('Vui lòng nhập lý do từ chối', 'error');
    return;
  }
  const item = db.leaveRequests.find(function (x) { return x.id === id; });
  if (!item) {
    return;
  }
  item.status = 'rejected';
  item.rejectReason = reason;
  if (typeof logAuditAction === 'function') {
    logAuditAction('leave-reject', 'Từ chối đơn xin nghỉ', { leaveId: id, studentId: item.studentId, classCode: item.classCode });
  }
  scheduleAppSnapshotSave();
  renderStaffLeaveApproval();
  toast('Đã từ chối đơn xin nghỉ.');
}

function renderInvoiceClassOptions() {
  const invSel = byId('invoiceClassSelect');
  const notifySel = byId('notifyClassSelect');
  let html = '<option value="">-- Chọn lớp học --</option>';
  let i;
  for (i = 0; i < db.classes.length; i++) {
    html += '<option value="' + db.classes[i].code + '">' + db.classes[i].code + ' - ' + db.classes[i].name + '</option>';
  }
  if (invSel) {
    invSel.innerHTML = html;
  }
  if (notifySel) {
    notifySel.innerHTML = html;
  }
}

function renderInvoiceClassPreview() {
  const classCode = byId('invoiceClassSelect').value;
  const c = getClassByCode(classCode);
  const body = byId('invoicePreviewBody');
  if (!body) {
    return;
  }
  if (!c) {
    body.innerHTML = '<tr><td colspan="5">Vui lòng chọn lớp học</td></tr>';
    return;
  }
  let html = '';
  let i;
  for (i = 0; i < c.studentIds.length; i++) {
    const s = getAccountById(c.studentIds[i]);
    if (!s) {
      continue;
    }
    const subjectCount = (s.subjectCodes || [s.classCode]).length;
    const base = 3200000;
    const discount = subjectCount >= 2 ? Math.round(base * db.comboDiscountRate) : 0;
    html += '<tr><td>' + s.name + '</td><td>' + subjectCount + '</td><td>' + formatCurrency(base) + '</td><td>' + formatCurrency(discount) + '</td><td>' + formatCurrency(base - discount) + '</td></tr>';
  }
  body.innerHTML = html || '<tr><td colspan="5">Không có học viên</td></tr>';
}

function createBulkInvoices() {
  const classCode = byId('invoiceClassSelect').value;
  const dueDate = byId('invoiceDueDate').value;
  const c = getClassByCode(classCode);
  if (!c || !dueDate) {
    toast('Vui lòng chọn lớp học và hạn nộp.', 'error');
    return;
  }
  let count = 0;
  let i;
  for (i = 0; i < c.studentIds.length; i++) {
    const s = getAccountById(c.studentIds[i]);
    if (!s) {
      continue;
    }
    const subjectCount = (s.subjectCodes || [s.classCode]).length;
    const base = 3200000;
    const discount = subjectCount >= 2 ? Math.round(base * db.comboDiscountRate) : 0;
    db.invoices.unshift({
      id: 'HD' + Date.now() + String(i),
      studentId: s.id,
      classCode: classCode,
      totalAmount: base - discount,
      discount: discount,
      status: 'unpaid',
      dueDate: dueDate,
      paidDate: '',
      method: '',
      note: 'Học phí lớp ' + c.name
    });
    count += 1;
  }
  if (typeof logAuditAction === 'function') {
    logAuditAction('invoice-bulk-create', 'Tạo hóa đơn hàng loạt', { classCode: classCode, count: count, dueDate: dueDate });
  }
  scheduleAppSnapshotSave();
  state.staffInvoiceTablePage = 1;
  renderStaffInvoiceList();
  toast('Đã tạo hóa đơn cho ' + count + ' học viên.');
}

function setInvoiceFilter(filter) {
  state.selectedInvoiceFilter = filter;
  state.staffInvoiceTablePage = 1;
  renderStaffInvoiceList();
}

function setStaffInvoicePage(page) {
  state.staffInvoiceTablePage = Math.max(1, Number(page) || 1);
  renderStaffInvoiceList();
}

function renderStaffInvoiceList() {
  const body = byId('staffInvoiceListBody');
  if (!body) {
    return;
  }
  const filtered = [];
  let i;
  for (i = 0; i < db.invoices.length; i++) {
    const inv = db.invoices[i];
    if (state.selectedInvoiceFilter === 'unpaid' && inv.status !== 'unpaid') {
      continue;
    }
    if (state.selectedInvoiceFilter === 'paid' && inv.status !== 'paid') {
      continue;
    }
    filtered.push(inv);
  }
  const pageSize = typeof getTablePageSize === 'function' ? getTablePageSize('invoice') : 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (!state.staffInvoiceTablePage || state.staffInvoiceTablePage > totalPages) {
    state.staffInvoiceTablePage = 1;
  }
  const start = (state.staffInvoiceTablePage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  let html = '';
  for (i = 0; i < pageRows.length; i++) {
    const inv = pageRows[i];
    const st = inv.status === 'paid' ? '<span class="badge badge-green">Đã thanh toán</span>' : '<span class="badge badge-red">Chưa thanh toán</span>';
    const action = inv.status === 'unpaid' ? '<button class="btn btn-cyan btn-xs" data-inline-action="openInvoicePaymentModal(\'' + inv.id + '\')">Xác nhận đã thu</button>' : '-';
    html += '<tr><td>' + inv.id + '</td><td>' + inv.studentId + '</td><td>' + formatCurrency(inv.totalAmount) + '</td><td>' + st + '</td><td>' + inv.dueDate + '</td><td>' + action + ' <button class="btn btn-outline btn-xs" data-inline-action="openReceipt(\'' + inv.id + '\')">Xem biên lai</button></td></tr>';
  }
  body.innerHTML = html || '<tr><td colspan="6">Không có hóa đơn</td></tr>';
  if (typeof normalizeInlineHandlersToDelegation === 'function') {
    normalizeInlineHandlersToDelegation(body);
  }
  if (typeof ensureTablePagerElement === 'function' && typeof renderTablePager === 'function') {
    const pager = ensureTablePagerElement('staffInvoiceListBody', 'staffInvoicePager');
    renderTablePager(pager, state.staffInvoiceTablePage, totalPages, filtered.length, 'setStaffInvoicePage');
  }
  if (typeof announceStatus === 'function') {
    announceStatus('Bảng hóa đơn có ' + filtered.length + ' mục, trang ' + state.staffInvoiceTablePage + '/' + totalPages + '.', 'polite');
  }
}

function openInvoicePaymentModal(invoiceId) {
  state.selectedInvoiceId = invoiceId;
  byId('invoicePaidDate').value = new Date().toISOString().slice(0, 10);
  openModal('invoicePaymentModal');
  announceStatus('Đã mở hộp thoại xác nhận thu học phí', 'polite');
}

function closeInvoicePaymentModal() {
  closeModal('invoicePaymentModal');
}

function submitInvoicePaid() {
  const inv = db.invoices.find(function (x) { return x.id === state.selectedInvoiceId; });
  if (!inv) {
    return;
  }
  inv.status = 'paid';
  inv.method = byId('invoicePaidMethod').value;
  inv.paidDate = byId('invoicePaidDate').value;
  if (typeof logAuditAction === 'function') {
    logAuditAction('invoice-mark-paid', 'Xác nhận thu học phí', { invoiceId: inv.id, studentId: inv.studentId, method: inv.method });
  }
  scheduleAppSnapshotSave();
  closeInvoicePaymentModal();
  renderStaffInvoiceList();
  renderTuition();
  toast('Đã xác nhận thanh toán hóa đơn.');
}

function openReceipt(invoiceId) {
  const inv = db.invoices.find(function (x) { return x.id === invoiceId; });
  if (!inv) {
    return;
  }
  const student = getAccountById(inv.studentId);
  const c = getClassByCode(inv.classCode);
  const box = byId('receiptContent');
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-labelledby', 'receiptModalTitle');
  box.setAttribute('aria-describedby', 'receiptModalDesc');
  box.innerHTML = '<div id="receiptModalTitle" class="receipt-title">StudyHome - Biên lai điện tử</div>' +
    '<div class="mt12" id="receiptModalDesc">Học viên: ' + (student ? student.name : inv.studentId) + ' (' + inv.studentId + ')<br>Lớp: ' + (c ? c.name : inv.classCode) + '<br>Số tiền đã đóng: ' + formatCurrency(inv.totalAmount) + '<br>Ngày đóng: ' + (inv.paidDate || '-') + '<br>Hình thức thanh toán: ' + (inv.method || '-') + '<br>Mã giao dịch: TX' + invoiceId.replace(/[^0-9]/g, '').slice(-8) + '</div>' +
    '<div class="mt12 receipt-actions"><button class="btn btn-outline" data-inline-action="closeModal(\'receiptModal\')">Đóng</button><button class="btn btn-green" data-inline-action="window.print()">In biên lai</button></div>';
  openModal('receiptModal');
  announceStatus('Đã mở biên lai', 'polite');
}

function toggleNotifyTarget() {
  const mode = document.querySelector('input[name="notifyMode"]:checked');
  byId('notifyTargetWrap').classList.toggle('inline-hidden', !mode || mode.value !== 'private');
}

function sendStaffNotification() {
  const title = byId('notifyTitle');
  const body = byId('notifyBody');
  clearInputError(title);
  clearInputError(body);
  if (!title.value.trim()) {
    markInputError(title, 'Tiêu đề thông báo là bắt buộc');
  }
  if (!body.value.trim()) {
    markInputError(body, 'Nội dung thông báo là bắt buộc');
  }
  if (!title.value.trim() || !body.value.trim()) {
    toast('Vui lòng nhập tiêu đề và nội dung thông báo.', 'error');
    return;
  }
  const mode = document.querySelector('input[name="notifyMode"]:checked').value;
  const classCode = byId('notifyClassSelect').value;
  const studentId = byId('notifyStudentInput').value.trim().toUpperCase();
  let targets = [];
  let targetLabel = 'Tất cả';
  if (mode === 'all') {
    targets = db.accounts.filter(function (a) { return a.role === 'student'; }).map(function (x) { return x.id; });
  } else if (studentId) {
    targets = [studentId];
    targetLabel = studentId;
  } else {
    const cls = getClassByCode(classCode);
    targets = cls ? cls.studentIds.slice() : [];
    targetLabel = classCode || 'Riêng';
  }
  let i;
  for (i = 0; i < targets.length; i++) {
    pushNotification({ to: targets[i], type: 'STAFF_NOTICE', title: title.value.trim(), body: body.value.trim(), read: false });
  }
  if (typeof logAuditAction === 'function') {
    logAuditAction('staff-notification-send', 'Gửi thông báo học viên', {
      mode: mode,
      targetLabel: targetLabel,
      targetCount: targets.length,
      title: title.value.trim()
    });
  }
  db.sentNotifications.unshift({ title: title.value.trim(), target: targetLabel, sentAt: new Date().toLocaleString('vi-VN'), status: 'Đã gửi' });
  title.value = '';
  body.value = '';
  byId('notifyStudentInput').value = '';
  clearDraftFields(['notifyTitle', 'notifyBody']);
  scheduleAppSnapshotSave();
  renderStaffNotificationHistory();
  toast('Đã gửi thông báo thành công');
}

function renderStaffNotificationHistory() {
  const body = byId('staffNotifyHistoryBody');
  if (!body) {
    return;
  }
  let html = '';
  let i;
  for (i = 0; i < db.sentNotifications.length; i++) {
    const n = db.sentNotifications[i];
    html += '<tr><td>' + n.title + '</td><td>' + n.target + '</td><td>' + n.sentAt + '</td><td>' + n.status + '</td></tr>';
  }
  body.innerHTML = html || '<tr><td colspan="4">Chưa có thông báo đã gửi</td></tr>';
}
