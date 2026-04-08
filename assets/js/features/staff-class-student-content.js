function renderClassGrid() {
  const grid = byId('staffClassGrid');
  if (!grid) {
    return;
  }
  let html = '';
  let i;
  for (i = 0; i < db.classes.length; i++) {
    const c = db.classes[i];
    const active = c.code === state.selectedClassCode ? ' active' : '';
    html += '<div class="class-card' + active + '" data-inline-action="selectClass(' + '\'' + c.code + '\'' + ')">' +
      '<div class="class-card-img">' + getSubjectIconSvg(c.subject) + c.subject + '</div>' +
      renderProgressBar(Math.min(100, Math.round((c.studentIds.length / c.capacity) * 100))) +
      '<div class="class-name">' + c.code + ' - ' + c.name + '</div>' +
      '<div class="class-pct">Sĩ số: ' + c.studentIds.length + '/' + c.capacity + '</div>' +
      '<div class="mt8"><button class="btn btn-cyan" data-inline-action="event.stopPropagation();openClassDetail(\'' + c.code + '\')">Chi tiết</button></div>' +
      '</div>';
  }
  grid.innerHTML = html;
  hydrateProgressBars(grid);
  const pill = byId('selectedClassPill');
  if (pill) {
    pill.textContent = state.selectedClassCode ? 'Lớp đang chọn: ' + state.selectedClassCode : 'Chưa chọn lớp';
  }
}

function selectClass(code) {
  state.selectedClassCode = code;
  renderClassGrid();
}

function openClassDetail(code) {
  state.selectedClassCode = code;
  renderClassDetail();
  show('s-class-detail');
}

function renderActiveHeaderUser() {
  const activeId = getActiveScreenId();
  const screen = byId(activeId);
  if (!screen) {
    return;
  }

  const header = screen.querySelector('.header');
  if (!header) {
    return;
  }

  const headerRight = header.querySelector('.header-right');
  const avatar = headerRight ? headerRight.querySelector('.avatar-btn') : null;
  if (!avatar || !headerRight) {
    return;
  }

  let box = headerRight.querySelector('.header-user-info');
  if (!box) {
    box = document.createElement('div');
    box.className = 'header-user-info';
    box.innerHTML = '<div class="header-user-name"></div><div class="header-user-role"></div>';
  }
  if (!headerRight.contains(box)) {
    headerRight.insertBefore(box, avatar);
  } else if (box.nextElementSibling !== avatar) {
    headerRight.insertBefore(box, avatar);
  }

  const nameNode = box.querySelector('.header-user-name');
  const roleNode = box.querySelector('.header-user-role');
  if (!nameNode || !roleNode) {
    return;
  }

  const user = getAccountById(state.currentUserId);
  const roleFromScreen = typeof getScreenPortalRole === 'function' ? getScreenPortalRole(activeId) : '';

  if (user) {
    nameNode.textContent = user.name;
    roleNode.textContent = getRoleLabel(user.role);
    nameNode.classList.toggle('header-user-alert', user.role === 'student');
    return;
  }

  nameNode.textContent = 'Khách';
  nameNode.classList.remove('header-user-alert');
  if (roleFromScreen === 'teacher') {
    roleNode.textContent = 'Giáo viên';
  } else if (roleFromScreen === 'student') {
    roleNode.textContent = 'Học viên';
  } else if (roleFromScreen === 'staff') {
    roleNode.textContent = 'Nhân viên';
  } else {
    roleNode.textContent = 'Khách';
  }
}

function renderClassDetail() {
  const c = getClassByCode(state.selectedClassCode);
  if (!c) {
    return;
  }
  byId('detailClassCode').value = c.code;
  byId('detailClassName').value = c.name;
  const body = byId('classDetailStudentsBody');
  if (!body) {
    return;
  }
  let html = '';
  let i;
  for (i = 0; i < c.studentIds.length; i++) {
    const s = getAccountById(c.studentIds[i]);
    if (!s) {
      continue;
    }
    html += '<tr><td>' + s.id + '</td><td>' + s.name + '</td><td>' + s.birthYear + '</td><td>' + s.gender + '</td>' +
      '<td><button class="btn btn-red btn-xs" data-inline-action="removeStudentFromClass(\'' + s.id + '\')">Xóa</button></td></tr>';
  }
  body.innerHTML = html || '<tr><td colspan="5">Không có học viên</td></tr>';
}

function createClass() {
  const code = byId('staffClassCode').value.trim().toUpperCase();
  const name = byId('staffClassName').value.trim();
  if (!code || !name) {
    toast('Nhập mã lớp và tên lớp.', 'error');
    return;
  }
  if (getClassByCode(code)) {
    toast('Mã lớp đã tồn tại.', 'error');
    return;
  }
  const newClass = {
    code: code,
    name: name,
    capacity: 20,
    teacher: 'GV001',
    room: 'P.101',
    dayOfWeek: 'Thứ 2',
    startTime: '18:00',
    endTime: '20:00',
    studentIds: []
  };
  const conflicts = checkScheduleConflict(newClass);
  if (conflicts.length) {
    toast(conflicts[0], 'error');
    return;
  }
  db.classes.push(newClass);
  state.selectedClassCode = code;
  if (typeof logAuditAction === 'function') {
    logAuditAction('class-create', 'Tạo lớp học', { classCode: code, className: name });
  }
  scheduleAppSnapshotSave();
  renderClassGrid();
  renderStaffSidebarStats();
  toast('Tạo lớp thành công.');
}

function checkScheduleConflict(newClass) {
  const conflicts = [];
  let i;
  for (i = 0; i < db.classes.length; i++) {
    const c = db.classes[i];
    if (c.code === newClass.code) {
      continue;
    }
    const sameDay = (c.dayOfWeek || c.schedule || '').toString().indexOf(newClass.dayOfWeek || '') >= 0;
    const sameStart = (c.startTime || c.schedule || '').toString().indexOf(newClass.startTime || '') >= 0;
    if (!sameDay || !sameStart) {
      continue;
    }
    if ((c.room || '') === (newClass.room || '')) {
      conflicts.push('Lưu ý: Trùng lịch: Phòng ' + newClass.room + ' đã được dùng bởi lớp ' + c.code + ' vào ' + newClass.dayOfWeek + ', giờ ' + newClass.startTime + '-' + newClass.endTime);
    }
    if ((c.teacher || '') === (newClass.teacher || '')) {
      conflicts.push('Lưu ý: Trùng lịch: Giáo viên ' + newClass.teacher + ' đã dạy lớp ' + c.code + ' vào ' + newClass.dayOfWeek + ', giờ ' + newClass.startTime + '-' + newClass.endTime);
    }
  }
  return conflicts;
}

function deleteSelectedClass() {
  if (!state.selectedClassCode) {
    toast('Hãy chọn lớp cần xóa.', 'error');
    return;
  }
  const previousSelected = state.selectedClassCode;
  let removedClass = null;
  let removedIndex = -1;
  let i;
  for (i = 0; i < db.classes.length; i++) {
    if (db.classes[i].code === state.selectedClassCode) {
      removedClass = typeof cloneData === 'function' ? cloneData(db.classes[i]) : db.classes[i];
      removedIndex = i;
      db.classes.splice(i, 1);
      break;
    }
  }
  if (!removedClass) {
    toast('Không tìm thấy lớp cần xóa.', 'error');
    return;
  }
  if (typeof pushUndoAction === 'function') {
    pushUndoAction('Xóa lớp ' + removedClass.code, function () {
      const insertAt = Math.max(0, Math.min(removedIndex, db.classes.length));
      db.classes.splice(insertAt, 0, removedClass);
      state.selectedClassCode = previousSelected || removedClass.code;
      renderClassGrid();
      renderClassDetail();
      renderStaffSidebarStats();
    }, { type: 'class-delete', classCode: removedClass.code });
  }
  if (typeof logAuditAction === 'function') {
    logAuditAction('class-delete', 'Xóa lớp học', { classCode: removedClass.code });
  }
  state.selectedClassCode = db.classes.length ? db.classes[0].code : '';
  scheduleAppSnapshotSave();
  renderClassGrid();
  renderStaffSidebarStats();
  toast('Đã xóa lớp.');
}

function addStudentToClass() {
  const c = getClassByCode(state.selectedClassCode);
  const studentId = byId('detailStudentCode').value.trim().toUpperCase();
  const student = getAccountById(studentId);
  if (!c || !student || student.role !== 'student') {
    toast('Mã học viên không hợp lệ.', 'error');
    return;
  }
  if (c.studentIds.indexOf(studentId) >= 0) {
    toast('Học viên đã có trong lớp.', 'error');
    return;
  }
  c.studentIds.push(studentId);
  student.classCode = c.code;
  if (typeof logAuditAction === 'function') {
    logAuditAction('class-add-student', 'Thêm học viên vào lớp', { classCode: c.code, studentId: studentId });
  }
  byId('detailStudentCode').value = '';
  scheduleAppSnapshotSave();
  renderClassDetail();
  renderClassGrid();
  toast('Đã thêm học viên vào lớp.');
}

function removeStudentFromClass(studentId) {
  const c = getClassByCode(state.selectedClassCode);
  if (!c) {
    return;
  }
  const previousIndex = c.studentIds.indexOf(studentId);
  if (previousIndex < 0) {
    toast('Học viên không thuộc lớp đã chọn.', 'error');
    return;
  }
  const classCode = c.code;
  const s = getAccountById(studentId);
  const previousClassCode = s ? s.classCode : '';
  let i;
  for (i = c.studentIds.length - 1; i >= 0; i--) {
    if (c.studentIds[i] === studentId) {
      c.studentIds.splice(i, 1);
    }
  }
  if (s && s.classCode === c.code) {
    s.classCode = '';
  }
  if (typeof pushUndoAction === 'function') {
    pushUndoAction('Xóa học viên ' + studentId + ' khỏi lớp', function () {
      const cls = getClassByCode(classCode);
      if (!cls) {
        return;
      }
      if (cls.studentIds.indexOf(studentId) < 0) {
        const insertAt = Math.max(0, Math.min(previousIndex, cls.studentIds.length));
        cls.studentIds.splice(insertAt, 0, studentId);
      }
      const student = getAccountById(studentId);
      if (student) {
        student.classCode = previousClassCode || classCode;
      }
      renderClassDetail();
      renderClassGrid();
    }, { type: 'class-remove-student', classCode: classCode, studentId: studentId });
  }
  if (typeof logAuditAction === 'function') {
    logAuditAction('class-remove-student', 'Xóa học viên khỏi lớp', { classCode: classCode, studentId: studentId });
  }
  scheduleAppSnapshotSave();
  renderClassDetail();
  renderClassGrid();
  toast('Đã xóa học viên khỏi lớp.');
}

function removeStudentByInput() {
  const studentId = byId('detailStudentCode').value.trim().toUpperCase();
  if (!studentId) {
    toast('Nhập mã học viên cần xóa.', 'error');
    return;
  }
  removeStudentFromClass(studentId);
}

function saveClassDetail() {
  const c = getClassByCode(state.selectedClassCode);
  if (!c) {
    return;
  }
  c.name = byId('detailClassName').value.trim() || c.name;
  scheduleAppSnapshotSave();
  toast('Đã lưu thông tin lớp học.');
  renderClassGrid();
}

function renderStudentMaterialList() {
  const wrap = byId('studentMaterialList');
  if (!wrap) {
    return;
  }
  const student = getCurrentStudent();
  const subjectCodes = getStudentSubjectCodes(student);
  const classCode = state.selectedClassCode && subjectCodes.indexOf(state.selectedClassCode) >= 0 ? state.selectedClassCode : subjectCodes[0];
  state.selectedClassCode = classCode;
  const classInfo = getClassByCode(classCode);
  const list = db.materials[classCode] || [];
  let html = '';
  let i;
  for (i = 0; i < list.length; i++) {
    html += '<div class="resource-item">' +
      '<div class="resource-item-title">' + list[i].title + '</div>' +
        '<div class="resource-item-sub">Môn: ' + (classInfo ? classInfo.subject : classCode) + ' (' + classCode + ')</div>' +
      '<div class="resource-item-sub">Mã tài liệu: ' + list[i].id + '</div>' +
      '</div>';
  }
  wrap.innerHTML = '<div class="resource-list">' + (html || getEmptyStateCardHtml('Chưa có tài liệu', 'Giáo viên chưa tải tài liệu cho môn này.')) + '</div>';
      renderSubjectContextLabels();
}

function renderStudentHomeworkList() {
  const wrap = byId('studentHomeworkList');
  if (!wrap) {
    return;
  }
  const student = getCurrentStudent();
  const subjectCodes = getStudentSubjectCodes(student);
  const classCode = state.selectedClassCode && subjectCodes.indexOf(state.selectedClassCode) >= 0 ? state.selectedClassCode : subjectCodes[0];
  state.selectedClassCode = classCode;
  const list = db.homeworks[classCode] || [];
  let html = '';
  let i;
  for (i = 0; i < list.length; i++) {
    html += '<div class="resource-item resource-item-clickable" data-inline-action="openHomework(\'' + list[i].id + '\')">' +
      '<div class="resource-item-title">' + list[i].title + '</div>' +
        '<div class="resource-item-sub">Mở: ' + list[i].open + ' | Hạn nộp: ' + list[i].due + '</div>' +
        '<div class="resource-item-sub">Bấm để xem chi tiết và nộp bài</div>' +
      '</div>';
  }
      wrap.innerHTML = '<div class="resource-list">' + (html || getEmptyStateCardHtml('Chưa có bài tập', 'Hiện chưa có bài tập nào được giao cho môn này.')) + '</div>';
  renderSubjectContextLabels();
}

function getStudentClassSectionNodes(sectionKey) {
  const isMaterial = sectionKey === 'materials';
  const panel = byId(isMaterial ? 'studentClassMaterialsList' : 'studentClassHomeworkList');
  const toggle = byId(isMaterial ? 'studentClassMaterialsToggle' : 'studentClassHomeworkToggle');
  const section = panel ? panel.closest('.course-content-section') : null;
  return { panel: panel, toggle: toggle, section: section };
}

function syncStudentClassSectionHeight(sectionKey) {
  const nodes = getStudentClassSectionNodes(sectionKey);
  if (!nodes.panel || !nodes.section) {
    return;
  }
  if (nodes.section.classList.contains('collapsed')) {
    nodes.panel.style.maxHeight = '0px';
    return;
  }
  nodes.panel.style.maxHeight = nodes.panel.scrollHeight + 'px';
}

function toggleStudentClassSection(sectionKey) {
  const nodes = getStudentClassSectionNodes(sectionKey);
  if (!nodes.panel || !nodes.section || !nodes.toggle) {
    return;
  }
  const willCollapse = !nodes.section.classList.contains('collapsed');
  if (willCollapse) {
    nodes.section.classList.add('collapsed');
    nodes.toggle.setAttribute('aria-expanded', 'false');
    nodes.panel.style.maxHeight = '0px';
    return;
  }
  nodes.section.classList.remove('collapsed');
  nodes.toggle.setAttribute('aria-expanded', 'true');
  nodes.panel.style.maxHeight = nodes.panel.scrollHeight + 'px';
}

function renderStudentClassDetailContent() {
  const materialsWrap = byId('studentClassMaterialsList');
  const homeworkWrap = byId('studentClassHomeworkList');
  if (!materialsWrap || !homeworkWrap) {
    return;
  }
  const student = getCurrentStudent();
  if (!student) {
    return;
  }
  const subjectCodes = getStudentSubjectCodes(student);
  const classCode = state.selectedClassCode && subjectCodes.indexOf(state.selectedClassCode) >= 0 ? state.selectedClassCode : subjectCodes[0];
  state.selectedClassCode = classCode;
  const classInfo = getClassByCode(classCode);
  const materials = db.materials[classCode] || [];
  const homeworks = db.homeworks[classCode] || [];
  let html = '';
  let i;

  for (i = 0; i < materials.length; i++) {
    const item = materials[i];
    const displayType = (item.fileName || item.title || '').toLowerCase().indexOf('.pdf') >= 0 ? 'PDF' : 'Tài liệu';
    html += '<article class="course-content-item">' +
      '<div class="course-item-title">' + item.title + '</div>' +
      '<div class="course-item-details">' +
      '<div class="course-item-meta">Phiên: ' + (item.session || 'Tài liệu môn học') + '</div>' +
      '<div class="course-item-meta">Loại tệp: ' + displayType + ' | Mã tài liệu: ' + item.id + '</div>' +
      '<div class="course-item-meta">Môn: ' + (classInfo ? classInfo.subject : classCode) + ' (' + classCode + ')</div>' +
      '</div>' +
      '</article>';
  }
  materialsWrap.innerHTML = html || '<div class="course-content-empty">Chưa có tài liệu cho môn học này.</div>';
  syncStudentClassSectionHeight('materials');

  html = '';
  for (i = 0; i < homeworks.length; i++) {
    const hw = homeworks[i];
    let k;
    let submission = null;
    for (k = 0; k < db.submissions.length; k++) {
      if (db.submissions[k].homeworkId === hw.id && db.submissions[k].studentId === student.id) {
        submission = db.submissions[k];
        break;
      }
    }
    const now = new Date();
    const due = new Date(hw.due + 'T23:59:59');
    let statusClass = 'pending';
    let statusText = 'Chưa nộp';
    if (submission) {
      statusClass = 'submitted';
      statusText = 'Đã nộp';
    } else if (due < now) {
      statusClass = 'overdue';
      statusText = 'Quá hạn';
    }

    html += '<article class="course-content-item">' +
      '<div class="course-item-title">' + hw.title + '</div>' +
      '<div class="course-item-details">' +
      '<div class="course-item-meta">Thời gian mở: ' + hw.open + '</div>' +
      '<div class="course-item-meta">Hạn nộp: ' + hw.due + '</div>' +
      '<div class="course-item-meta">' + (hw.content || 'Không có mô tả chi tiết.') + '</div>' +
      '</div>' +
      '<div class="course-item-foot">' +
      '<span class="course-item-status ' + statusClass + '">' + statusText + '</span>' +
      '<button class="course-item-action" type="button" data-inline-action="openHomework(\'' + hw.id + '\')">Xem chi tiết</button>' +
      '</div>' +
      '</article>';
  }
  homeworkWrap.innerHTML = html || '<div class="course-content-empty">Chưa có bài tập cho môn học này.</div>';
  syncStudentClassSectionHeight('homework');
  renderSubjectContextLabels();
}

function injectStaffLayouts() {
  // Sidebar điều hướng nhanh đã được loại bỏ theo yêu cầu mới.
}

function renderStaffSidebarStats() {
  const acc = byId('staffSideAccountCount');
  const cls = byId('staffSideClassCount');
  const ntc = byId('staffSideNoticeCount');
  const pendingLeave = byId('pendingLeaveCount');
  const unpaidInvoice = byId('unpaidInvoiceCount');
  if (acc) {
    acc.textContent = db.accounts.length + ' tài khoản đang hoạt động';
  }
  if (cls) {
    cls.textContent = db.classes.length + ' lớp đang quản lý';
  }
  if (ntc) {
    let i;
    let cnt = 0;
    for (i = 0; i < db.notifications.length; i++) {
      if (db.notifications[i].audience === 'all-staff') {
        cnt += 1;
      }
    }
    ntc.textContent = cnt + ' thông báo gửi nhân viên';
  }

  if (pendingLeave) {
    let i;
    let p = 0;
    for (i = 0; i < db.leaveRequests.length; i++) {
      if (db.leaveRequests[i].status === 'pending') {
        p += 1;
      }
    }
    pendingLeave.textContent = String(p);
  }

  if (unpaidInvoice) {
    let j;
    let u = 0;
    for (j = 0; j < db.invoices.length; j++) {
      if (db.invoices[j].status === 'unpaid') {
        u += 1;
      }
    }
    unpaidInvoice.textContent = String(u);
  }
}

function renderSideCalendars() {
  const titleNodes = document.querySelectorAll('.cal-title');
  const gridNodes = document.querySelectorAll('.cal-grid');
  if (!titleNodes.length || !gridNodes.length) {
    return;
  }

  const now = new Date();
  if (state.teacherCalendarYear === null || state.teacherCalendarMonth === null) {
    state.teacherCalendarYear = now.getFullYear();
    state.teacherCalendarMonth = now.getMonth();
  }
  const year = state.teacherCalendarYear;
  const month = state.teacherCalendarMonth;
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const firstDayOfWeek = (first.getDay() + 6) % 7;
  const totalDays = last.getDate();

  const monthLabel = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  let i;
  for (i = 0; i < titleNodes.length; i++) {
    titleNodes[i].textContent = monthLabel;
  }

  let headerHtml = '';
  for (i = 0; i < weekdays.length; i++) {
    headerHtml += '<div class="cal-head">' + weekdays[i] + '</div>';
  }

  let daysHtml = '';
  for (i = 0; i < firstDayOfWeek; i++) {
    daysHtml += '<div class="cal-day empty" aria-hidden="true"></div>';
  }

  const today = new Date();
  for (i = 1; i <= totalDays; i++) {
    const dayDate = new Date(year, month, i);
    const todayClass = dayDate.getFullYear() === today.getFullYear() && dayDate.getMonth() === today.getMonth() && dayDate.getDate() === today.getDate() ? ' today' : '';
    daysHtml += '<div class="cal-day' + todayClass + '">' + i + '</div>';
  }

  for (i = 0; i < gridNodes.length; i++) {
    gridNodes[i].innerHTML = headerHtml + daysHtml;
  }
}

