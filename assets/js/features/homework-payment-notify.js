function openHomework(id) {
  state.selectedHomeworkId = id;
  renderHomeworkDetail();
  show('s-student-homework-detail');
}

function renderHomeworkDetail() {
  const student = getCurrentStudent();
  const subjectCodes = getStudentSubjectCodes(student);
  const classCode = state.selectedClassCode && subjectCodes.indexOf(state.selectedClassCode) >= 0 ? state.selectedClassCode : subjectCodes[0];
  state.selectedClassCode = classCode;
  const list = db.homeworks[classCode] || [];
  let hw = null;
  let i;
  for (i = 0; i < list.length; i++) {
    if (list[i].id === state.selectedHomeworkId) {
      hw = list[i];
      break;
    }
  }
  if (!hw && list.length) {
    hw = list[0];
    state.selectedHomeworkId = hw.id;
  }
  if (!hw) {
    return;
  }
  byId('studentHomeworkTitle').textContent = hw.title;
  const now = new Date();
  const dueDate = new Date(hw.due + 'T23:59:59');
  let submission = null;
  let k;
  for (k = 0; k < db.submissions.length; k++) {
    if (db.submissions[k].homeworkId === hw.id && db.submissions[k].studentId === student.id) {
      submission = db.submissions[k];
      break;
    }
  }
  let statusText = 'Chưa nộp';
  let statusPanel = '<div><strong>Trạng thái:</strong> Chưa nộp</div>';
  if (submission) {
    statusText = 'Đã nộp - ' + new Date(submission.submittedAt).toLocaleString('vi-VN');
    statusPanel = '<div><strong>Thành công: Đã nộp lúc:</strong> ' + new Date(submission.submittedAt).toLocaleString('vi-VN') + '</div>' +
      '<div class="mt8"><strong>Tệp:</strong> ' + (submission.fileName || '(không có tên tệp)') + '</div>';
  } else if (now > dueDate) {
    statusText = 'Trễ hạn';
    statusPanel = '<div class="text-red"><strong>Lưu ý: Đã quá hạn nộp bài</strong></div><div class="mt8">Bạn vẫn có thể nộp muộn (Nộp trễ).</div>';
  }
  if (submission && submission.score !== '') {
    statusPanel += '<div class="mt8"><strong>Điểm:</strong> ' + submission.score + '/10 — <strong>Nhận xét:</strong> ' + (submission.comment || '') + '</div>';
  }
  byId('studentHomeworkMeta').innerHTML = 'Thời gian mở: ' + hw.open + '<br>Thời gian đóng: ' + hw.due + '<br>Trạng thái: ' + statusText;
  byId('studentHomeworkContent').textContent = hw.content;
  if (byId('homeworkSubmitStatus')) {
    byId('homeworkSubmitStatus').innerHTML = statusPanel;
  }
  const submitBtn = byId('btnSubmitHomework');
  if (submitBtn) {
    submitBtn.textContent = now > dueDate && !submission ? 'Nộp bài (Nộp trễ)' : 'Nộp bài';
  }
  renderSubjectContextLabels();
}

function submitHomework() {
  let input = byId('studentHomeworkFileInput');
  if (!input) {
    input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.png,.jpg,.zip';
    input.id = 'studentHomeworkFileInput';
    input.className = 'fi mt12';
    byId('btnSubmitHomework').insertAdjacentElement('beforebegin', input);
  }
  if (!input.files || !input.files.length) {
    toast('Vui lòng chọn tệp trước khi nộp bài.', 'error');
    return;
  }
  const student = getCurrentStudent();
  const payload = {
    id: 'SUB' + Date.now(),
    studentId: student.id,
    homeworkId: state.selectedHomeworkId,
    fileName: input.files[0].name,
    submittedAt: new Date().toISOString(),
    score: '',
    comment: ''
  };
  db.submissions.unshift(payload);
  pushNotification({
    to: student.id,
    type: 'HOMEWORK_SUBMIT',
    title: 'Nộp bài tập thành công',
    body: 'Bạn đã nộp bài ' + state.selectedHomeworkId + ' lúc ' + new Date(payload.submittedAt).toLocaleString('vi-VN'),
    read: false
  });
  scheduleAppSnapshotSave();
  toast('Thành công: Đã nộp lúc ' + new Date(payload.submittedAt).toLocaleTimeString('vi-VN'));
  renderHomeworkDetail();
}

function saveTeacherDocument() {
  const titleInput = byId('teacherDocTitle');
  const descInput = byId('teacherDocDesc');
  const fileInput = byId('teacherDocFile');
  clearInputError(titleInput);
  if (!titleInput || !titleInput.value.trim()) {
    markInputError(titleInput, 'Vui lòng nhập tiêu đề');
    toast('Vui lòng nhập tiêu đề tài liệu.', 'error');
    return;
  }
  const teacher = getCurrentTeacher();
  const classCode = state.selectedClassCode || (teacher && teacher.classCode) || 'L01';
  if (!db.materials[classCode]) {
    db.materials[classCode] = [];
  }
  const item = {
    id: 'DOC' + Date.now(),
    title: titleInput.value.trim(),
    session: descInput && descInput.value.trim() ? descInput.value.trim() : 'Tài liệu bổ sung',
    fileName: (fileInput && fileInput.files && fileInput.files[0]) ? fileInput.files[0].name : '',
    classCode: classCode,
    teacherId: teacher ? teacher.id : '',
    uploadedAt: new Date().toISOString()
  };
  db.materials[classCode].unshift(item);
  if (!db.teacherMaterials) {
    db.teacherMaterials = [];
  }
  db.teacherMaterials.unshift(item);
  toast('Đã tải lên tài liệu thành công.');
  titleInput.value = '';
  if (descInput) {
    descInput.value = '';
  }
  if (fileInput) {
    fileInput.value = '';
  }
  clearDraftFields(['teacherDocTitle', 'teacherDocDesc']);
  scheduleAppSnapshotSave();
  show('s-teacher-class-detail');
}

function saveTeacherHomework() {
  const titleInput = byId('hwTitle');
  const descInput = byId('hwDesc');
  const fromInput = byId('hwFrom');
  const dueInput = byId('hwDue');
  clearInputError(titleInput);
  clearInputError(dueInput);
  if (!titleInput || !titleInput.value.trim()) {
    markInputError(titleInput, 'Vui lòng nhập tiêu đề');
    toast('Vui lòng nhập tiêu đề bài tập.', 'error');
    return;
  }
  if (!dueInput || !dueInput.value) {
    markInputError(dueInput, 'Vui lòng chọn hạn nộp');
    toast('Vui lòng chọn hạn nộp.', 'error');
    return;
  }
  const teacher = getCurrentTeacher();
  const classCode = state.selectedClassCode || (teacher && teacher.classCode) || 'L01';
  if (!db.homeworks[classCode]) {
    db.homeworks[classCode] = [];
  }
  db.homeworks[classCode].unshift({
    id: 'HW' + Date.now(),
    title: titleInput.value.trim(),
    open: fromInput && fromInput.value ? fromInput.value : new Date().toISOString().slice(0, 10),
    due: dueInput.value,
    content: descInput && descInput.value ? descInput.value.trim() : '',
    classCode: classCode,
    teacherId: teacher ? teacher.id : ''
  });
  toast('Đã tạo bài tập thành công.');
  titleInput.value = '';
  if (descInput) {
    descInput.value = '';
  }
  if (fromInput) {
    fromInput.value = '';
  }
  dueInput.value = '';
  clearDraftFields(['hwTitle', 'hwDesc']);
  scheduleAppSnapshotSave();
  show('s-teacher-class-detail');
}

function submitAbsenceRequest() {
  const student = getCurrentStudent();
  const classCode = byId('absenceClassCode').value;
  const date = byId('absenceDate').value;
  const reason = byId('absenceReason').value.trim();
  const description = byId('absenceDescription').value.trim();
  clearInputError(byId('absenceClassCode'));
  clearInputError(byId('absenceDate'));
  clearInputError(byId('absenceReason'));
  if (!classCode) {
    markInputError(byId('absenceClassCode'), 'Vui lòng chọn lớp học');
  }
  if (!date) {
    markInputError(byId('absenceDate'), 'Vui lòng chọn ngày nghỉ');
  }
  if (!reason || reason.length < 10) {
    markInputError(byId('absenceReason'), 'Lý do xin nghỉ tối thiểu 10 ký tự');
  }
  if (!classCode || !date || !reason || reason.length < 10) {
    toast('Vui lòng điền đầy đủ thông tin đơn nghỉ.', 'error');
    return;
  }
  let i;
  for (i = 0; i < db.leaveRequests.length; i++) {
    const dup = db.leaveRequests[i];
    if (dup.studentId === student.id && dup.classCode === classCode && dup.date === date && (dup.status === 'pending' || dup.status === 'approved')) {
      toast('Bạn đã tạo đơn nghỉ cho buổi học này rồi', 'error');
      return;
    }
  }
  db.leaveRequests.unshift({
    id: 'LR' + Date.now(),
    studentId: student.id,
    classCode: classCode,
    date: date,
    reason: reason,
    description: description,
    status: 'pending',
    rejectReason: ''
  });
  db.absences.unshift({
    id: 'ABS' + Date.now(),
    studentId: student.id,
    classCode: classCode,
    date: date,
    reason: reason,
    description: description,
    status: 'Chờ duyệt'
  });
  pushNotification({ to: student.id, title: 'Đã gửi đơn xin nghỉ', body: 'Đơn nghỉ ngày ' + date + ' đã được gửi', read: false });
  pushNotification({ to: 'all-staff', title: 'Đơn xin nghỉ mới', body: 'Hệ thống vừa nhận đơn từ ' + student.id, read: false });
  renderStaffSidebarStats();
  byId('absenceClassCode').value = '';
  byId('absenceDate').value = '';
  byId('absenceReason').value = '';
  byId('absenceDescription').value = '';
  clearDraftFields(['absenceReason', 'absenceDescription']);
  scheduleAppSnapshotSave();
  toast('Đã nộp đơn thành công');
  show('s-student-absence-history');
}

function renderAbsenceHistory() {
  const wrap = byId('absenceHistoryList');
  if (!wrap) {
    return;
  }
  const student = getCurrentStudent();
  let html = '';
  let i;
  for (i = 0; i < db.leaveRequests.length; i++) {
    const a = db.leaveRequests[i];
    if (a.studentId !== student.id) {
      continue;
    }
    const st = a.status === 'pending' ? 'Chờ duyệt' : (a.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối');
    html += '<div class="invoice-item"><div class="invoice-title">Đơn ' + a.id + '</div><div class="invoice-sub">Lớp: ' + (a.classCode || '-') + '<br>Ngày nghỉ: ' + a.date + '<br>Lý do: ' + a.reason + '<br>Trạng thái: ' + st + (a.rejectReason ? '<br>Lý do từ chối: ' + a.rejectReason : '') + '</div></div>';
  }
  wrap.innerHTML = html || '<div class="invoice-item">Chưa có đơn xin nghỉ.</div>';
}

function renderTuition() {
  const student = getCurrentStudent();
  const info = byId('studentTuitionInfo');
  const body = byId('studentTuitionBody');
  if (!info || !body) {
    return;
  }
  info.innerHTML = 'Họ tên: ' + student.name + '<br>Mã học viên: ' + student.id + '<br>Số điện thoại: ' + student.phone;
  let html = '';
  let debt = 0;
  let i;
  for (i = 0; i < db.invoices.length; i++) {
    const t = db.invoices[i];
    if (t.studentId !== student.id) {
      continue;
    }
    const now = new Date();
    const due = new Date(t.dueDate + 'T23:59:59');
    const near = (due.getTime() - now.getTime()) <= (3 * 24 * 60 * 60 * 1000) && t.status !== 'paid' && due >= now;
    const overdue = due < now && t.status !== 'paid';
    const statusBadge = t.status === 'paid' ? '<span class="badge badge-green">Đã đóng</span>' : (near ? '<span class="badge badge-orange">Sắp hết hạn</span>' : '<span class="badge badge-red">Chưa đóng</span>');
    const dueText = overdue ? '<span class="text-red">Lưu ý: ' + t.dueDate + '</span>' : t.dueDate;
    const action = t.status === 'paid'
      ? '<button class="btn btn-outline" data-inline-action="openReceipt(\'' + t.id + '\')">Xem biên lai</button>'
      : '<button class="btn btn-cyan" data-inline-action="openPaymentProcessForInvoice(\'' + t.id + '\')">Thanh toán</button>';
    if (t.status !== 'paid') {
      debt += t.totalAmount;
    }
    html += '<tr><td>' + t.id + '</td><td>' + (t.note || '') + '</td><td>' + formatCurrency(t.totalAmount + t.discount) + '</td><td>' + formatCurrency(t.discount) + '</td><td>' + formatCurrency(t.totalAmount) + '</td><td>' + dueText + '</td><td>' + statusBadge + '</td><td>' + action + '</td></tr>';
  }
  body.innerHTML = html || '<tr><td colspan="8">Không có dữ liệu học phí.</td></tr>';
  if (byId('studentTotalDebt')) {
    byId('studentTotalDebt').textContent = formatCurrency(debt);
  }
}

function renderPaymentConfirm() {
  const student = getCurrentStudent();
  const target = byId('studentPaymentConfirmInfo');
  if (!target) {
    return;
  }
  const inv = db.invoices.find(function (x) { return x.id === state.selectedTuitionInvoiceId; });
  if (!inv) {
    target.innerHTML = 'Không có khoản cần thanh toán.';
    return;
  }
  target.innerHTML = 'Họ tên: ' + student.name + '<br>Mã học viên: ' + student.id + '<br>Số điện thoại: ' + student.phone + '<br>Phương thức thanh toán: ' + (state.selectedPaymentMethod === 'cash' ? 'Tiền mặt tại trung tâm' : 'Chuyển khoản ngân hàng') + '<br>Nội dung: ' + (inv.note || '') + '<br>Số tiền: ' + formatCurrency(inv.totalAmount);
}

function confirmPayment() {
  const inv = db.invoices.find(function (x) { return x.id === state.selectedTuitionInvoiceId; });
  const student = getCurrentStudent();
  if (!inv) {
    toast('Không tìm thấy hóa đơn.', 'error');
    return;
  }
  inv.status = 'paid';
  inv.paidDate = new Date().toISOString().slice(0, 10);
  inv.method = state.selectedPaymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản';
  pushNotification({ to: student.id, title: 'Thanh toán học phí thành công', body: 'Hóa đơn ' + inv.id + ' đã được cập nhật đã thanh toán', read: false });
  renderStaffSidebarStats();
  scheduleAppSnapshotSave();
  toast('Thanh toán thành công.');
  show('s-student-tuition');
}

function openPaymentProcessForInvoice(invoiceId) {
  state.selectedTuitionInvoiceId = invoiceId;
  show('s-student-payment-process');
}

function onPaymentMethodChange() {
  const checked = document.querySelector('input[name="paymentMethod"]:checked');
  state.selectedPaymentMethod = checked ? checked.value : '';
  byId('paymentBankPanel').classList.toggle('inline-hidden', state.selectedPaymentMethod !== 'bank');
  byId('paymentCashPanel').classList.toggle('inline-hidden', state.selectedPaymentMethod !== 'cash');
}

function renderStudentPaymentProcess() {
  const student = getCurrentStudent();
  let inv = db.invoices.find(function (x) { return x.id === state.selectedTuitionInvoiceId; });
  if (!inv) {
    inv = db.invoices.find(function (x) { return x.studentId === student.id && x.status === 'unpaid'; });
  }
  if (!inv) {
    byId('studentPaymentSummary').innerHTML = 'Không có khoản học phí cần thanh toán.';
    return;
  }
  state.selectedTuitionInvoiceId = inv.id;
  byId('studentPaymentSummary').innerHTML = 'Số tiền: <strong>' + formatCurrency(inv.totalAmount) + '</strong><br>Nội dung: ' + (inv.note || '') + '<br>Hạn nộp: ' + inv.dueDate;
  byId('paymentTransferContent').textContent = student.id + ' - ' + student.name + ' - ' + inv.id;
}

function copyTransferContent() {
  const text = byId('paymentTransferContent').textContent;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(function () {
      toast('Đã sao chép nội dung chuyển khoản');
    }).catch(function () {
      toast('Không thể sao chép nội dung chuyển khoản', 'error');
    });
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', 'readonly');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    const ok = document.execCommand('copy');
    toast(ok ? 'Đã sao chép nội dung chuyển khoản' : 'Không thể sao chép nội dung chuyển khoản', ok ? '' : 'error');
  } catch (e) {
    toast('Không thể sao chép nội dung chuyển khoản', 'error');
  }
  document.body.removeChild(ta);
}

function confirmWaitingPayment() {
  if (!state.selectedPaymentMethod) {
    toast('Vui lòng chọn phương thức trước khi tiếp tục.', 'error');
    return;
  }
  show('s-student-payment-confirm');
}

function renderPaymentHistory() {
  const body = byId('studentPaymentHistoryBody');
  if (!body) {
    return;
  }
  const student = getCurrentStudent();
  let html = '';
  let i;
  for (i = 0; i < db.invoices.length; i++) {
    const t = db.invoices[i];
    if (t.studentId !== student.id || t.status !== 'paid') {
      continue;
    }
    html += '<tr><td>' + t.id + '</td><td>' + t.note + '</td><td>' + t.paidDate + '</td><td>' + t.method + '</td><td>' + formatCurrency(t.totalAmount) + '</td><td>Đã phát hành</td><td><span class="link" data-inline-action="openReceipt(\'' + t.id + '\')">Chi tiết</span></td></tr>';
  }
  body.innerHTML = html || '<tr><td colspan="7">Chưa có lịch sử thanh toán.</td></tr>';
}

function renderNotifications() {
  const wrap = byId('studentNotificationList');
  if (!wrap) {
    return;
  }
  const student = getCurrentStudent();
  const list = getNotificationsFor(student.id, 'student');
  const filter = state.studentNotificationFilter === 'unread' ? 'unread' : 'all';
  const toolbar = '<div class="notif-toolbar"><button class="btn btn-outline btn-xs ' + (filter === 'all' ? 'active-filter' : '') + '" data-inline-action="setStudentNotificationFilter(\'all\')">Tất cả</button><button class="btn btn-outline btn-xs ' + (filter === 'unread' ? 'active-filter' : '') + '" data-inline-action="setStudentNotificationFilter(\'unread\')">Chưa đọc</button></div>';
  let html = '';
  let i;
  for (i = 0; i < list.length; i++) {
    const n = list[i];
    if (filter === 'unread' && n.read) {
      continue;
    }
    html += '<div class="notif-item ' + (n.read ? '' : 'notif-item-unread') + '" data-inline-action="markStudentNotificationRead(\'' + n.id + '\')"><div class="notif-text">Thông báo: <strong>' + (n.title || 'Thông báo') + '</strong><br>' + (n.body || n.text || '') + '</div><div class="notif-time">' + (n.time || '') + (n.read ? '' : ' - <span class="badge badge-red">Thông báo mới</span>') + '</div></div>';
  }
  wrap.innerHTML = toolbar + (html || '<div class="notif-item">Không có thông báo phù hợp.</div>');
}

function setStudentNotificationFilter(filter) {
  state.studentNotificationFilter = filter === 'unread' ? 'unread' : 'all';
  scheduleAppSnapshotSave();
  renderNotifications();
}

function markStudentNotificationRead(id) {
  const n = db.notifications.find(function (x) { return x.id === id; });
  if (n) {
    n.read = true;
  }
  scheduleAppSnapshotSave();
  renderNotifications();
  applyDynamicNavbars();
}

function renderTeacherNotifications() {
  const wrap = byId('teacherNotificationList');
  const teacher = getCurrentTeacher();
  if (!wrap || !teacher) {
    return;
  }
  const list = getNotificationsFor(teacher.id, 'teacher');
  const filter = state.teacherNotificationFilter === 'unread' ? 'unread' : 'all';
  const toolbar = '<div class="notif-toolbar"><button class="btn btn-outline btn-xs ' + (filter === 'all' ? 'active-filter' : '') + '" data-inline-action="setTeacherNotificationFilter(\'all\')">Tất cả</button><button class="btn btn-outline btn-xs ' + (filter === 'unread' ? 'active-filter' : '') + '" data-inline-action="setTeacherNotificationFilter(\'unread\')">Chưa đọc</button></div>';
  let html = '';
  let i;
  for (i = 0; i < list.length; i++) {
    const n = list[i];
    if (filter === 'unread' && n.read) {
      continue;
    }
    html += '<div class="notif-item ' + (n.read ? '' : 'notif-item-unread') + '" data-inline-action="markTeacherNotificationRead(\'' + n.id + '\')"><div class="notif-text">Thông báo: <strong>' + (n.title || 'Thông báo') + '</strong><br>' + (n.body || n.text || '') + '</div><div class="notif-time">' + (n.time || '') + (n.read ? '' : ' - <span class="badge badge-red">Thông báo mới</span>') + '</div></div>';
  }
  wrap.innerHTML = toolbar + (html || '<div class="notif-item">Không có thông báo phù hợp.</div>');
}

function setTeacherNotificationFilter(filter) {
  state.teacherNotificationFilter = filter === 'unread' ? 'unread' : 'all';
  scheduleAppSnapshotSave();
  renderTeacherNotifications();
}

function markTeacherNotificationRead(id) {
  const n = db.notifications.find(function (x) { return x.id === id; });
  if (n) {
    n.read = true;
  }
  scheduleAppSnapshotSave();
  renderTeacherNotifications();
  applyDynamicNavbars();
}

function fillAbsenceClassOptions() {
  const select = byId('absenceClassCode');
  const student = getCurrentStudent();
  if (!select || !student) {
    return;
  }
  const codes = getStudentSubjectCodes(student);
  let html = '<option value="">-- Chọn lớp học --</option>';
  let i;
  for (i = 0; i < codes.length; i++) {
    const c = getClassByCode(codes[i]);
    if (c) {
      html += '<option value="' + c.code + '">' + c.code + ' - ' + c.subject + '</option>';
    }
  }
  select.innerHTML = html;
  const date = byId('absenceDate');
  if (date) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const d = tomorrow.toISOString().slice(0, 10);
    date.value = d;
    date.min = d;
  }
}

function renderStudentTimetable() {
  const head = byId('studentTimetableHead');
  const body = byId('studentTimetableBody');
  const select = byId('studentWeekSelect');
  const info = byId('studentWeekInfo');
  const student = getCurrentStudent();
  if (!head || !body || !select || !student) {
    return;
  }
  const weekCount = getTimetableWeekCount();
  const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
  const dayKeys = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  let i;

  if (!select.dataset.ready) {
    select.innerHTML = '';
    for (i = 1; i <= weekCount; i++) {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = getStudentTimetableWeekLabel(i);
      select.appendChild(option);
    }
    select.dataset.ready = '1';
  }

  if (!state.selectedStudentWeek || state.selectedStudentWeek < 1 || state.selectedStudentWeek > weekCount) {
    state.selectedStudentWeek = getTimetableCurrentWeek();
  }
  select.value = String(state.selectedStudentWeek);

  const weekDays = getTimetableWeekDays(state.selectedStudentWeek);
  head.innerHTML = '<tr><th>Ca</th>' + days.map(function (day, idx) {
    return '<th>' + day + '<br><span class="table-head-sub">' + formatDateVN(weekDays[idx]) + '</span></th>';
  }).join('') + '</tr>';

  const codes = getStudentSubjectCodes(student);
  const allowedSubjects = ['Toán', 'Vật lí', 'Vật lý', 'Hóa học'];
  const slots = [
    { slot: 1, label: 'Ca 1 (17h45-19h15)' },
    { slot: 2, label: 'Ca 2 (19h30-21h)' }
  ];
  let html = '';
  let d;
  for (let s = 0; s < slots.length; s++) {
    html += '<tr><td class="nowrap-strong">' + slots[s].label + '</td>';
    for (d = 0; d < days.length; d++) {
      let cell = '';
    for (i = 0; i < db.classes.length; i++) {
      const c = db.classes[i];
      if (codes.indexOf(c.code) < 0) {
        continue;
      }
      if (allowedSubjects.indexOf(c.subject) < 0) {
        continue;
      }
      if (getClassSessionSlot(c) !== slots[s].slot) {
        continue;
      }
      if (getClassScheduleDays(c).indexOf(dayKeys[d]) < 0) {
        continue;
      }
      cell += '<div class="schedule-cell-block"><strong>' + c.subject + '</strong><br>' + c.level + '<br>Giờ học: ' + (c.startTime || (slots[s].slot === 1 ? '17:45' : '19:30')) + '-' + (c.endTime || (slots[s].slot === 1 ? '19:15' : '21:00')) + '<br>Phòng học: ' + (c.room || 'P.101') + '<br>Giáo viên: ' + (c.teacher || '-') + '</div>';
    }
      html += '<td>' + (cell || '<span class="text-muted">-</span>') + '</td>';
    }
    html += '</tr>';
  }
  body.innerHTML = html;
  if (info) {
    info.textContent = 'Tuần ' + state.selectedStudentWeek + ' / ' + weekCount + ' - ' + formatDateVN(weekDays[0]) + ' đến ' + formatDateVN(weekDays[6]);
  }
}

function renderStudentExamSchedule() {
  const body = byId('studentExamBody');
  const student = getCurrentStudent();
  if (!body || !student) {
    return;
  }
  const list = db.examSchedules.filter(function (x) { return x.studentId === student.id; }).slice(0, 6);
  let html = '';
  let i;
  for (i = 0; i < list.length; i++) {
    const e = list[i];
    html += '<tr><td>' + e.subject + '</td><td>' + e.examDate + '</td><td>' + e.session + '</td><td>' + e.room + '</td><td>' + e.seatNumber + '</td><td>' + (e.result === '' ? '-' : (e.result + '/10')) + '</td></tr>';
  }
  body.innerHTML = html || '<tr><td colspan="6">Không có dữ liệu</td></tr>';
}

