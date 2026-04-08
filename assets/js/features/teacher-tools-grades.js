function handleTeacherAttendanceUpload() {
  const rows = document.querySelectorAll('#teacherAttendanceBody tr');
  let absentCount = 0;
  let i;
  for (i = 0; i < rows.length; i++) {
    const absentBox = rows[i].querySelector('.att-absent');
    const noteInput = rows[i].querySelector('.att-note');
    if (!absentBox) {
      continue;
    }
    if (absentBox.checked) {
      rows[i].style.background = 'var(--red-light)';
      absentCount += 1;
      const studentId = rows[i].getAttribute('data-student-id') || ('HV' + String(i + 1).padStart(3, '0'));
      const cls = getClassByCode(state.selectedClassCode);
      pushNotification({
        to: studentId,
        type: 'ABSENT_ALERT',
        title: 'Thông báo vắng học',
        body: studentId + ' đã vắng mặt trong buổi học ' + (cls ? cls.subject : '') + ' - ' + new Date().toLocaleDateString('vi-VN') + (noteInput && noteInput.value.trim() ? (' - Ghi chú: ' + noteInput.value.trim()) : ''),
        timestamp: new Date().toISOString(),
        read: false
      });
    } else {
      rows[i].style.background = '';
    }
  }
  if (typeof logAuditAction === 'function') {
    logAuditAction('teacher-attendance-upload', 'Điểm danh lớp học', { classCode: state.selectedClassCode, absentCount: absentCount });
  }
  toast('Đã điểm danh. Đã gửi thông báo vắng đến ' + absentCount + ' phụ huynh.');
}

function renderTeacherAttendance() {
  const body = byId('teacherAttendanceBody');
  const c = getClassByCode(state.selectedClassCode);
  if (!body || !c) {
    return;
  }
  let html = '';
  let i;
  for (i = 0; i < c.studentIds.length; i++) {
    const s = getAccountById(c.studentIds[i]);
    if (!s) {
      continue;
    }
    html += '<tr data-student-id="' + s.id + '">' +
      '<td>' + (i + 1) + '</td>' +
      '<td>' + s.name + '</td>' +
      '<td class="txt-center"><input type="checkbox" class="att-present" checked onchange="this.closest(\'tr\').querySelector(\'.att-absent\').checked = !this.checked"></td>' +
      '<td class="txt-center"><input type="checkbox" class="att-absent" onchange="this.closest(\'tr\').querySelector(\'.att-present\').checked = !this.checked"></td>' +
      '<td><input class="fi att-note" placeholder="Ghi chú"></td>' +
      '</tr>';
  }
  body.innerHTML = html || '<tr><td colspan="5">Không có học viên trong lớp</td></tr>';
}

function initScheduleForm() {
  const classSel = byId('scheduleClassCode');
  const roomSel = byId('scheduleRoom');
  const teacherSel = byId('scheduleTeacher');
  if (classSel) {
    classSel.innerHTML = db.classes.map(function (c) { return '<option value="' + c.code + '">' + c.code + ' - ' + c.name + '</option>'; }).join('');
  }
  if (roomSel) {
    const rooms = ['P.101', 'P.102', 'P.201', 'P.202', 'P.301'];
    roomSel.innerHTML = rooms.map(function (r) { return '<option value="' + r + '">' + r + '</option>'; }).join('');
  }
  if (teacherSel) {
    const teachers = db.accounts.filter(function (a) { return a.role === 'teacher'; });
    teacherSel.innerHTML = teachers.map(function (t) { return '<option value="' + t.id + '">' + t.id + ' - ' + t.name + '</option>'; }).join('');
  }
  state.scheduleConflictChecked = false;
  if (byId('btnSaveSchedule')) {
    byId('btnSaveSchedule').disabled = true;
  }
}

function checkNewScheduleConflict() {
  const payload = {
    code: byId('scheduleClassCode').value,
    dayOfWeek: byId('scheduleDay').value,
    startTime: byId('scheduleStart').value,
    endTime: byId('scheduleEnd').value,
    room: byId('scheduleRoom').value,
    teacher: byId('scheduleTeacher').value
  };
  const conflicts = checkScheduleConflict(payload);
  if (conflicts.length) {
    alert(conflicts.join('\n'));
    state.scheduleConflictChecked = false;
    byId('btnSaveSchedule').disabled = true;
    return;
  }
  state.scheduleConflictChecked = true;
  byId('btnSaveSchedule').disabled = false;
  toast('Không có xung đột lịch. Có thể lưu.');
}

function saveNewSchedule() {
  if (!state.scheduleConflictChecked) {
    toast('Vui lòng kiểm tra xung đột trước khi lưu.', 'error');
    return;
  }
  const c = getClassByCode(byId('scheduleClassCode').value);
  if (!c) {
    return;
  }
  c.dayOfWeek = byId('scheduleDay').value;
  c.startTime = byId('scheduleStart').value;
  c.endTime = byId('scheduleEnd').value;
  c.room = byId('scheduleRoom').value;
  c.teacher = byId('scheduleTeacher').value;
  c.schedule = c.dayOfWeek + ' ' + c.startTime;
  toast('Đã lưu lịch học mới.');
  state.scheduleConflictChecked = false;
  byId('btnSaveSchedule').disabled = true;
}

function downloadImportTemplate() {
  const csv = 'MaHocSinh,HoTen,NgaySinh,Email,SoDienThoai\nHV901,Nguyen Van A,2008-01-01,abc@studyhome.vn,0912345678';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'studyhome_import_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function previewBulkImport() {
  const input = byId('bulkImportFile');
  if (!input || !input.files || !input.files.length) {
    toast('Vui lòng chọn tệp CSV để import.', 'error');
    return;
  }
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = function () {
    const txt = String(reader.result || '');
    const lines = txt.split(/\r?\n/).filter(function (x) { return x.trim(); });
    const preview = [];
    const seen = {};
    let i;
    for (i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      const id = (cols[0] || '').trim().toUpperCase();
      const name = (cols[1] || '').trim();
      const email = (cols[3] || '').trim();
      let ok = true;
      let msg = 'Hợp lệ';
      if (!id || !name) {
        ok = false;
        msg = 'Lỗi: Thiếu trường bắt buộc';
      } else if (seen[id] || getAccountById(id)) {
        ok = false;
        msg = 'Lỗi: Mã HV trùng';
      } else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        ok = false;
        msg = 'Lỗi: Email sai định dạng';
      }
      seen[id] = true;
      preview.push({ id: id, name: name, line: lines[i], ok: ok, status: msg });
    }
    state.bulkPreview = preview;
    let html = '<div class="overflow-x-auto mt8"><table class="tbl"><thead><tr><th>STT</th><th>Mã HV</th><th>Họ tên</th><th>Trạng thái</th></tr></thead><tbody>';
    for (i = 0; i < preview.length; i++) {
      html += '<tr' + (preview[i].ok ? '' : ' class="row-error-bg"') + '><td>' + (i + 1) + '</td><td>' + preview[i].id + '</td><td>' + preview[i].name + '</td><td>' + preview[i].status + '</td></tr>';
    }
    html += '</tbody></table></div><div class="mt8"><button class="btn btn-green" data-inline-action="confirmBulkImport()">Xác nhận Import</button></div>';
    byId('bulkImportPanel').insertAdjacentHTML('beforeend', '<div id="bulkImportPreviewWrap">' + html + '</div>');
  };
  reader.readAsText(file);
}

function confirmBulkImport() {
  const c = getClassByCode(state.selectedClassCode);
  if (!c || !state.bulkPreview) {
    return;
  }
  let ok = 0;
  let fail = 0;
  let i;
  for (i = 0; i < state.bulkPreview.length; i++) {
    const p = state.bulkPreview[i];
    if (!p.ok) {
      fail += 1;
      continue;
    }
    db.accounts.push({ id: p.id, password: '111111', role: 'student', name: p.name, birthYear: 2008, gender: 'Nam', classCode: c.code, subjectCodes: [c.code], email: '', phone: '' });
    c.studentIds.push(p.id);
    ok += 1;
  }
  renderClassDetail();
  renderClassGrid();
  toast('Import hoàn tất. Hợp lệ: ' + ok + ', lỗi: ' + fail + '.');
}

function openTeacherWeightModal() {
  const body = byId('teacherWeightBody');
  if (!body) {
    return;
  }
  const headers = ['Cột 1', 'Cột 2', 'Cột 3'];
  let html = '';
  let i;
  for (i = 0; i < headers.length; i++) {
    html += '<tr><td>' + headers[i] + '</td><td><input class="fi" id="weightName' + i + '" value="' + headers[i] + '"></td><td><input class="fi" id="weightVal' + i + '" type="number" value="' + state.teacherGradeWeights[i] + '"></td></tr>';
  }
  body.innerHTML = html;
  openModal('teacherWeightModal');
  announceStatus('Đã mở hộp thoại cài đặt trọng số', 'polite');
}

function saveTeacherWeights() {
  const vals = [Number(byId('weightVal0').value || 0), Number(byId('weightVal1').value || 0), Number(byId('weightVal2').value || 0)];
  const sum = vals[0] + vals[1] + vals[2];
  if (sum !== 100) {
    toast('Tổng trọng số phải bằng 100%.', 'error');
    return;
  }
  state.teacherGradeWeights = vals;
  scheduleAppSnapshotSave();
  closeModal('teacherWeightModal');
  toast('Đã lưu cấu hình trọng số.');
}

function addTeacherGradeColumn() {
  if (state.teacherGradeLocked) {
    toast('Bảng điểm đã khóa sổ.', 'error');
    return;
  }
  const name = prompt('Nhập tên cột điểm mới:');
  if (!name) {
    return;
  }
  const table = byId('teacherGradesTable');
  if (!table) {
    return;
  }
  const headRow = table.querySelector('thead tr');
  const avgTh = headRow.lastElementChild;
  const th = document.createElement('th');
  th.textContent = name;
  headRow.insertBefore(th, avgTh);
  const rows = table.querySelectorAll('tbody tr');
  let i;
  for (i = 0; i < rows.length; i++) {
    const avgTd = rows[i].lastElementChild;
    const td = document.createElement('td');
    td.innerHTML = '<input class="fi grade-input-compact" type="number" min="0" max="10" oninput="recalcTeacherGradeRow(this)">';
    rows[i].insertBefore(td, avgTd);
  }
}

function recalcTeacherGradeRow(input) {
  const row = input.closest('tr');
  if (!row) {
    return;
  }
  const nums = Array.from(row.querySelectorAll('input[type="number"]')).map(function (x) { return Number(x.value || 0); });
  if (!nums.length) {
    return;
  }
  let avg = 0;
  if (nums.length >= 3) {
    avg = ((nums[0] * state.teacherGradeWeights[0]) + (nums[1] * state.teacherGradeWeights[1]) + (nums[2] * state.teacherGradeWeights[2])) / 100;
  } else {
    avg = nums.reduce(function (a, b) { return a + b; }, 0) / nums.length;
  }
  row.lastElementChild.textContent = avg.toFixed(2);
}

function lockTeacherGradeBook() {
  if (!confirm('Sau khi khóa, không thể chỉnh sửa điểm của kỳ này. Tiếp tục?')) {
    return;
  }
  const previousLockedState = !!state.teacherGradeLocked;
  if (typeof pushUndoAction === 'function' && !previousLockedState) {
    const classCode = state.selectedClassCode;
    pushUndoAction('Khóa sổ bảng điểm', function () {
      state.teacherGradeLocked = previousLockedState;
      const badge = byId('teacherGradeLockBadge');
      if (badge) {
        badge.remove();
      }
      if (classCode) {
        state.selectedClassCode = classCode;
      }
      renderTeacherGrades();
    }, { type: 'grade-lock', classCode: classCode });
  }
  state.teacherGradeLocked = true;
  const table = byId('teacherGradesTable');
  if (table) {
    table.classList.add('grade-locked');
    const inputs = table.querySelectorAll('input');
    let i;
    for (i = 0; i < inputs.length; i++) {
      inputs[i].disabled = true;
    }
    let badge = byId('teacherGradeLockBadge');
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'teacherGradeLockBadge';
      badge.className = 'badge badge-red';
      badge.textContent = 'ĐÃ KHÓA';
      table.parentElement.insertBefore(badge, table);
    }
  }
  if (typeof logAuditAction === 'function') {
    logAuditAction('grade-lock', 'Khóa sổ bảng điểm', { classCode: state.selectedClassCode });
  }
  scheduleAppSnapshotSave();
}

function renderTeacherGrades() {
  const body = byId('teacherGradesBody');
  const c = getClassByCode(state.selectedClassCode);
  if (!body || !c) { return; }
  const isLocked = state.teacherGradeLocked;
  let html = '';
  let i;
  for (i = 0; i < c.studentIds.length; i++) {
    const s = getAccountById(c.studentIds[i]);
    if (!s) { continue; }
    const g = db.grades.find(function (gr) { return gr.studentId === s.id; }) || {};
    const s1 = g.score1 !== undefined ? g.score1 : '';
    const s2 = g.score2 !== undefined ? g.score2 : '';
    const s3 = g.score3 !== undefined ? g.score3 : '';
    const avg = g.average !== undefined ? g.average : '';
    const inputAttr = isLocked ? ' disabled' : '';
    html += '<tr data-student-id="' + s.id + '">' +
      '<td>' + (i + 1) + '</td>' +
      '<td>' + s.name + '</td>' +
      '<td>' + (s.birthYear || '—') + '</td>' +
      '<td><input class="fi grade-cell grade-input-compact" type="number" min="0" max="10" step="0.1" value="' + s1 + '"' + inputAttr + ' oninput="recalcTeacherGradeRow(this)"></td>' +
      '<td><input class="fi grade-cell grade-input-compact" type="number" min="0" max="10" step="0.1" value="' + s2 + '"' + inputAttr + ' oninput="recalcTeacherGradeRow(this)"></td>' +
      '<td><input class="fi grade-cell grade-input-compact" type="number" min="0" max="10" step="0.1" value="' + s3 + '"' + inputAttr + ' oninput="recalcTeacherGradeRow(this)"></td>' +
      '<td class="fw700">' + avg + '</td>' +
      '</tr>';
  }
  body.innerHTML = html || '<tr><td colspan="7" class="txt-center">Không có học viên trong lớp</td></tr>';
  if (isLocked) {
    const table = byId('teacherGradesTable');
    if (table) { table.classList.add('grade-locked'); }
  } else {
    const lockBadge = byId('teacherGradeLockBadge');
    if (lockBadge) {
      lockBadge.remove();
    }
  }
}

function saveTeacherGrades() {
  if (state.teacherGradeLocked) {
    toast('Bảng điểm đã khóa sổ, không thể chỉnh sửa.', 'error');
    return;
  }
  const body = byId('teacherGradesBody');
  if (!body) {
    toast('Không tìm thấy bảng điểm.', 'error');
    return;
  }
  const rows = body.querySelectorAll('tr');
  let saved = 0;
  let i;
  for (i = 0; i < rows.length; i++) {
    const studentId = rows[i].getAttribute('data-student-id');
    if (!studentId) { continue; }
    const inputs = rows[i].querySelectorAll('input.grade-cell');
    const s1 = parseFloat(inputs[0] && inputs[0].value) || 0;
    const s2 = parseFloat(inputs[1] && inputs[1].value) || 0;
    const s3 = parseFloat(inputs[2] && inputs[2].value) || 0;
    const avg = ((s1 * (state.teacherGradeWeights[0] || 33) + s2 * (state.teacherGradeWeights[1] || 33) + s3 * (state.teacherGradeWeights[2] || 34)) / 100).toFixed(1);
    let existing = null;
    let m;
    for (m = 0; m < db.grades.length; m++) {
      if (db.grades[m].studentId === studentId) { existing = db.grades[m]; break; }
    }
    if (existing) {
      existing.score1 = s1; existing.score2 = s2; existing.score3 = s3; existing.average = avg;
    } else {
      db.grades.push({ studentId: studentId, classCode: state.selectedClassCode, subject: '', score1: s1, score2: s2, score3: s3, average: avg });
    }
    saved += 1;
  }
  if (typeof logAuditAction === 'function') {
    logAuditAction('grade-save', 'Lưu bảng điểm lớp', { classCode: state.selectedClassCode, affectedStudents: saved });
  }
  scheduleAppSnapshotSave();
  toast('Đã lưu bảng điểm (' + saved + ' học viên).');
  show('s-teacher-class-detail');
}

