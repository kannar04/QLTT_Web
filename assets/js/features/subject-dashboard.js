function selectSubjectFromDashboard(code, role) {
  state.selectedClassCode = code;
  renderSubjectContextLabels();
  if (role === 'teacher') {
    show('s-teacher-class-detail');
  } else {
    show('s-student-class-detail');
  }
}

function renderTeacherSubjectDashboard() {
  const grid = byId('teacherSubjectGrid');
  if (!grid) {
    return;
  }
  const teacher = getCurrentTeacher();
  if (!teacher) {
    grid.innerHTML = '<div class="panel grid-span-full"><div class="panel-title">Chưa có dữ liệu giáo viên</div><div class="fs14 text-secondary">Vui lòng đăng nhập bằng tài khoản giáo viên để xem bảng điều khiển môn học.</div></div>';
    return;
  }

  const classes = [];
  const teacherCodes = teacher.classCodes && teacher.classCodes.length ? teacher.classCodes : [];
  let ci;
  for (ci = 0; ci < db.classes.length; ci++) {
    const c0 = db.classes[ci];
    if (teacherCodes.indexOf(c0.code) >= 0 || (!teacherCodes.length && c0.subject === teacher.subject)) {
      classes.push(c0);
    }
  }
  if (!classes.length) {
    grid.innerHTML = '<div class="panel grid-span-full"><div class="panel-title">Chưa được phân công lớp</div><div class="fs14 text-secondary">Tài khoản giáo viên hiện chưa có lớp phụ trách.</div></div>';
    return;
  }

  if (!state.selectedClassCode || classes.map(function (c) { return c.code; }).indexOf(state.selectedClassCode) < 0) {
    state.selectedClassCode = classes[0].code;
  }

  let gridHtml = '';
  let i;
  for (i = 0; i < classes.length; i++) {
    const c = classes[i];
    gridHtml += '<div class="class-card" data-inline-action="selectSubjectFromDashboard(\'' + c.code + '\',\'teacher\')">' +
      '<div class="class-card-img">' + getSubjectIconSvg(c.subject) + c.subject + '</div>' +
      renderProgressBar(Math.min(100, Math.round((c.studentIds.length / c.capacity) * 100))) +
      '<div class="class-name">' + c.subject + '</div>' +
      '<div class="class-pct">' + c.level + ' - Phòng ' + c.room + '</div>' +
      '</div>';
  }
  grid.innerHTML = gridHtml;
  hydrateProgressBars(grid);
}

function renderStudentSubjectDashboard() {
  const grid = byId('studentSubjectGrid');
  const student = getCurrentStudent();
  if (!grid || !student) {
    return;
  }
  const subjectCodes = getStudentSubjectCodes(student);
  let gridHtml = '';
  let i;
  for (i = 0; i < subjectCodes.length; i++) {
    const c = getClassByCode(subjectCodes[i]);
    if (!c) {
      continue;
    }
    gridHtml += '<div class="class-card" data-inline-action="selectSubjectFromDashboard(\'' + c.code + '\',\'student\')">' +
      '<div class="class-card-img">' + getSubjectIconSvg(c.subject) + c.subject + '</div>' +
      renderProgressBar(65 + (i * 5)) +
      '<div class="class-pct">Tiến độ: ' + (65 + (i * 5)) + '%</div>' +
      '<div class="class-name">' + c.subject + '</div><div class="level-subtext">' + c.level + '</div>' +
      '</div>';
  }
  grid.innerHTML = gridHtml;
  hydrateProgressBars(grid);
  renderStudentDashboardWidgets();
}

function renderStudentDashboardSchedule() {
  const wrap = byId('studentDashboardSchedule');
  const label = byId('studentDashboardWeekLabel');
  const student = getCurrentStudent();
  if (!wrap || !label || !student) {
    return;
  }

  const weekCount = getTimetableWeekCount();
  if (!state.selectedStudentWeek || state.selectedStudentWeek < 1 || state.selectedStudentWeek > weekCount) {
    state.selectedStudentWeek = getTimetableCurrentWeek();
  }

  const weekDays = getTimetableWeekDays(state.selectedStudentWeek);
  const codes = getStudentSubjectCodes(student);
  const dayKeys = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const slots = [
    { slot: 1, label: 'Ca 1', time: '17h45 - 19h15' },
    { slot: 2, label: 'Ca 2', time: '19h30 - 21h00' }
  ];
  const items = [];
  let i;
  let d;
  let s;
  for (i = 0; i < db.classes.length; i++) {
    const c = db.classes[i];
    if (codes.indexOf(c.code) < 0) {
      continue;
    }
    const classDays = getClassScheduleDays(c);
    for (d = 0; d < classDays.length; d++) {
      const dayIndex = dayKeys.indexOf(classDays[d]);
      if (dayIndex < 0 || dayIndex > 5) {
        continue;
      }
      const slot = getClassSessionSlot(c);
      for (s = 0; s < slots.length; s++) {
        if (slots[s].slot !== slot) {
          continue;
        }
        items.push({
          subject: c.subject,
          classCode: c.code,
          room: c.room || '-',
          dayLabel: classDays[d],
          date: weekDays[dayIndex],
          time: slots[s].time,
          slotLabel: slots[s].label
        });
      }
    }
  }

  items.sort(function (a, b) {
    if (a.date.getTime() !== b.date.getTime()) {
      return a.date - b.date;
    }
    return a.slotLabel.localeCompare(b.slotLabel);
  });

  label.textContent = getStudentTimetableWeekLabel(state.selectedStudentWeek);

  if (!items.length) {
    wrap.innerHTML = '<div class="student-schedule-item"><div class="student-schedule-item-sub">Không có lịch học trong tuần này.</div></div>';
    return;
  }

  let html = '';
  for (i = 0; i < items.length; i++) {
    const e = items[i];
    html += '<div class="student-schedule-item">' +
      '<div class="student-schedule-item-title">' + e.subject + '</div>' +
      '<div class="student-schedule-item-sub">' + e.dayLabel + ' - ' + formatDateVN(e.date) + '</div>' +
      '<div class="student-schedule-item-sub">' + e.slotLabel + ' (' + e.time + ') | Phòng ' + e.room + '</div>' +
      '</div>';
  }
  wrap.innerHTML = html;
}

function hasStudentHomeworkSubmission(studentId, homeworkId) {
  let i;
  for (i = 0; i < db.submissions.length; i++) {
    if (db.submissions[i].studentId === studentId && db.submissions[i].homeworkId === homeworkId) {
      return true;
    }
  }
  return false;
}

function renderStudentHomeworkDueSoon() {
  const wrap = byId('studentUpcomingAssignments');
  const student = getCurrentStudent();
  if (!wrap || !student) {
    return;
  }

  const classCodes = getStudentSubjectCodes(student);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 30);
  const items = [];
  const fallbackItems = [];
  let i;
  for (i = 0; i < classCodes.length; i++) {
    const list = db.homeworks[classCodes[i]] || [];
    const c = getClassByCode(classCodes[i]);
    let j;
    for (j = 0; j < list.length; j++) {
      const hw = list[j];
      const dueDate = new Date((hw.due || '') + 'T23:59:00');
      if (isNaN(dueDate.getTime())) {
        continue;
      }
      const entry = {
        title: hw.title || 'Bài tập',
        subject: c ? c.subject : classCodes[i],
        classCode: classCodes[i],
        dueDate: dueDate,
        dueText: formatDateTimeVN(dueDate, '23:59'),
        homeworkId: hw.id
      };
      if (!hasStudentHomeworkSubmission(student.id, hw.id)) {
        fallbackItems.push(entry);
        if (dueDate >= today && dueDate <= horizon) {
          items.push(entry);
        }
      }
    }
  }

  const sourceItems = items.length ? items : fallbackItems;
  sourceItems.sort(function (a, b) {
    return a.dueDate - b.dueDate;
  });

  if (!sourceItems.length) {
    wrap.innerHTML = '<div class="student-assignment-item"><div class="student-assignment-meta">Chưa có bài tập nào đang chờ xử lý.</div></div>';
    return;
  }

  const maxItems = Math.min(4, sourceItems.length);
  let html = '';
  for (i = 0; i < maxItems; i++) {
    const e = sourceItems[i];
    html += '<div class="student-assignment-item" role="button" tabindex="0" data-inline-action="openHomework(\'' + e.homeworkId + '\')">' +
      '<div class="student-assignment-title">' + e.title + '</div>' +
      '<div class="student-assignment-meta">Môn học: ' + e.subject + '</div>' +
      '<div class="student-assignment-meta">Hạn nộp: ' + e.dueText + '</div>' +
      '</div>';
  }
  wrap.innerHTML = html;
}

function getStudentDashboardCalendarMonthState() {
  const now = new Date();
  if (state.selectedStudentCalendarYear === null || state.selectedStudentCalendarMonth === null) {
    state.selectedStudentCalendarYear = now.getFullYear();
    state.selectedStudentCalendarMonth = now.getMonth();
  }
  return {
    year: state.selectedStudentCalendarYear,
    month: state.selectedStudentCalendarMonth
  };
}

function getStudentDashboardCalendarEvents(student, year, month) {
  const events = {};
  const classCodes = getStudentSubjectCodes(student);
  const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  let i;
  let day;
  for (i = 0; i < classCodes.length; i++) {
    const c = getClassByCode(classCodes[i]);
    if (!c) {
      continue;
    }
    const scheduleDays = getClassScheduleDays(c);
    for (day = 1; day <= 31; day++) {
      const date = new Date(year, month, day);
      if (date.getMonth() !== month) {
        continue;
      }
      if (scheduleDays.indexOf(weekdays[date.getDay()]) < 0) {
        continue;
      }
      const key = date.getFullYear() + '-' + padNumber(date.getMonth() + 1, 2) + '-' + padNumber(date.getDate(), 2);
      if (!events[key]) {
        events[key] = { class: false, assignment: false };
      }
      events[key].class = true;
    }
  }

  for (i = 0; i < classCodes.length; i++) {
    const list = db.homeworks[classCodes[i]] || [];
    let j;
    for (j = 0; j < list.length; j++) {
      const dueDate = new Date((list[j].due || '') + 'T23:59:00');
      if (isNaN(dueDate.getTime()) || dueDate.getFullYear() !== year || dueDate.getMonth() !== month) {
        continue;
      }
      const key = dueDate.getFullYear() + '-' + padNumber(dueDate.getMonth() + 1, 2) + '-' + padNumber(dueDate.getDate(), 2);
      if (!events[key]) {
        events[key] = { class: false, assignment: false };
      }
      events[key].assignment = true;
    }
  }

  return events;
}

function renderStudentDashboardMonthCalendar() {
  const wrap = byId('studentDashboardMonthGrid');
  const label = byId('studentDashboardMonthLabel');
  const student = getCurrentStudent();
  if (!wrap || !label || !student) {
    return;
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const stateMonth = getStudentDashboardCalendarMonthState();
  const year = stateMonth.year;
  const month = stateMonth.month;
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const firstOffset = (first.getDay() + 6) % 7;
  const totalDays = last.getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  label.textContent = monthNames[month] + ' ' + year;

  let html = '';
  let i;
  for (i = 0; i < weekdays.length; i++) {
    html += '<div class="student-calendar-weekday">' + weekdays[i] + '</div>';
  }

  for (i = 0; i < firstOffset; i++) {
    html += '<div class="student-calendar-day empty" aria-hidden="true"></div>';
  }

  for (i = 1; i <= totalDays; i++) {
    const date = new Date(year, month, i);
    const classList = ['student-calendar-day'];
    if (isCurrentMonth && today.getDate() === i) {
      classList.push('today');
    }
    html += '<div class="' + classList.join(' ') + '" role="button" tabindex="0" aria-label="' + formatDateVN(date) + '">' +
      '<div class="student-calendar-day-number">' + i + '</div>' +
      '</div>';
  }

  wrap.innerHTML = html;
}

function renderStudentDashboardWidgets() {
  renderStudentHomeworkDueSoon();
  renderStudentDashboardMonthCalendar();
}

