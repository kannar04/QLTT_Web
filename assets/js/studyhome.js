/* ============================================================
   STUDYHOME LMS — INTERACTIVE MOCK PLATFORM
   ============================================================ */

function padNumber(n, len) {
  return String(n).padStart(len, '0');
}

function formatDateVN(date) {
  return padNumber(date.getDate(), 2) + '/' + padNumber(date.getMonth() + 1, 2) + '/' + date.getFullYear();
}

function formatDateTimeVN(date, timeText) {
  return formatDateVN(date) + ' ' + (timeText || (padNumber(date.getHours(), 2) + ':' + padNumber(date.getMinutes(), 2)));
}

function getTimetableYear() {
  return 2026;
}

function getTimetableWeekCount() {
  const year = getTimetableYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const days = Math.floor((end - start) / 86400000) + 1;
  return Math.ceil(days / 7);
}

function getTimetableCurrentWeek() {
  const year = getTimetableYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  const now = new Date();
  const ref = now < start ? start : (now > end ? end : now);
  const dayOfYear = Math.floor((ref - start) / 86400000) + 1;
  return Math.max(1, Math.min(getTimetableWeekCount(), Math.floor((dayOfYear - 1) / 7) + 1));
}

function getTimetableWeekStart(weekNumber) {
  const year = getTimetableYear();
  const start = new Date(year, 0, 1);
  start.setDate(start.getDate() + ((weekNumber - 1) * 7));
  return start;
}

function getTimetableWeekDays(weekNumber) {
  const start = getTimetableWeekStart(weekNumber);
  const days = [];
  let i;
  for (i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    days.push(date);
  }
  return days;
}

function shiftStudentWeek(delta) {
  const weekCount = getTimetableWeekCount();
  if (!state.selectedStudentWeek || state.selectedStudentWeek < 1 || state.selectedStudentWeek > weekCount) {
    state.selectedStudentWeek = getTimetableCurrentWeek();
  }
  state.selectedStudentWeek = Math.max(1, Math.min(weekCount, state.selectedStudentWeek + delta));
  renderStudentDashboardWidgets();
}

function shiftStudentCalendarMonth(delta) {
  const now = new Date();
  let year = state.selectedStudentCalendarYear;
  let month = state.selectedStudentCalendarMonth;
  if (year === null || month === null) {
    year = now.getFullYear();
    month = now.getMonth();
  }
  month += delta;
  while (month < 0) {
    month += 12;
    year -= 1;
  }
  while (month > 11) {
    month -= 12;
    year += 1;
  }
  state.selectedStudentCalendarYear = year;
  state.selectedStudentCalendarMonth = month;
  renderStudentDashboardMonthCalendar();
}

function shiftTeacherCalendarMonth(delta) {
  const now = new Date();
  let year = state.teacherCalendarYear;
  let month = state.teacherCalendarMonth;
  if (year === null || month === null) {
    year = now.getFullYear();
    month = now.getMonth();
  }
  month += delta;
  while (month < 0) {
    month += 12;
    year -= 1;
  }
  while (month > 11) {
    month -= 12;
    year += 1;
  }
  state.teacherCalendarYear = year;
  state.teacherCalendarMonth = month;
  renderSideCalendars();
}

function getClassScheduleDays(c) {
  const raw = (c && (c.schedulePattern || c.dayPattern || c.schedule || c.dayOfWeek || '')).toString();
  const head = raw.split(' ')[0];
  return head.split('-').filter(Boolean);
}

function getClassSessionSlot(c) {
  if (c && Number(c.sessionSlot) === 1) {
    return 1;
  }
  if (c && Number(c.sessionSlot) === 2) {
    return 2;
  }
  const startTime = (c && c.startTime) ? String(c.startTime) : '';
  if (startTime >= '19:30') {
    return 2;
  }
  return 1;
}

function getStudentTimetableWeekLabel(weekNumber) {
  const days = getTimetableWeekDays(weekNumber);
  return 'Tuần ' + weekNumber + ' (' + formatDateVN(days[0]) + ' - ' + formatDateVN(days[6]) + ')';
}

function buildMockDatabase() {
  const subjects = [
    { key: 'MATH', name: 'Toán' },
    { key: 'PHYS', name: 'Vật lý' },
    { key: 'CHEM', name: 'Hóa học' },
    { key: 'LIT', name: 'Ngữ văn' },
    { key: 'ENG', name: 'Tiếng Anh' }
  ];
  const levels = ['Cơ bản', 'Nâng cao'];
  const classCodes = [];
  const classes = [];
  const accounts = [];
  const materials = {};
  const homeworks = {};
  const absences = [];
  const leaveRequests = [];
  const tuition = [];
  const invoices = [];
  const notifications = [];
  const submissions = [];
  const examSchedules = [];
  const teacherMaterials = [
    { id: 'DOC001', title: 'Đề cương ôn tập Toán HK1', classCode: 'L01', teacherId: 'GV001', uploadedAt: '2026-03-01T08:00:00' },
    { id: 'DOC002', title: 'Bài tập Vật lý chương 3', classCode: 'L02', teacherId: 'GV002', uploadedAt: '2026-03-05T09:30:00' }
  ];
  const sentNotifications = [];
  const grades = [];
  const revenues = [];
  const subjectClassMap = {};

  let i;
  let classIndex = 1;
  for (i = 0; i < subjects.length; i++) {
    let lv;
    for (lv = 0; lv < levels.length; lv++) {
      const classCode = 'L' + padNumber(classIndex, 2);
      const isChemistry = subjects[i].key === 'CHEM';
      const isMorningPattern = lv === 0;
      const schedulePattern = isChemistry ? 'T2-T4-T6' : (isMorningPattern ? 'T2-T4-T6' : 'T3-T5-T7');
      const startTime = isChemistry ? '19:30' : (isMorningPattern ? '17:45' : '19:30');
      const endTime = isChemistry ? '21:00' : (isMorningPattern ? '19:15' : '21:00');
      const sessionSlot = isChemistry ? 2 : (isMorningPattern ? 1 : 2);
      classCodes.push(classCode);
      classes.push({
        code: classCode,
        subject: subjects[i].name,
        level: levels[lv],
        name: subjects[i].name + ' - ' + levels[lv],
        capacity: 32,
        room: 'P.' + (200 + classIndex),
        schedule: schedulePattern + ' ' + startTime,
        schedulePattern: schedulePattern,
        sessionSlot: sessionSlot,
        startTime: startTime,
        endTime: endTime,
        teacher: 'GV' + padNumber(classIndex, 3),
        studentIds: []
      });
      if (!subjectClassMap[subjects[i].name]) {
        subjectClassMap[subjects[i].name] = [];
      }
      subjectClassMap[subjects[i].name].push(classCode);
      classIndex += 1;
    }
  }

  for (i = 1; i <= 10; i++) {
    accounts.push({
      id: 'NV' + padNumber(i, 3),
      password: '111111',
      role: 'staff',
      name: 'Nhan vien ' + i,
      birthYear: 1988 + (i % 8),
      gender: i % 2 === 0 ? 'Nu' : 'Nam',
      classCode: '',
      phone: '0901' + padNumber(i, 6)
    });
  }

  for (i = 1; i <= 20; i++) {
    const subjectName = subjects[(i - 1) % subjects.length].name;
    const subjectCodes = subjectClassMap[subjectName] || [classCodes[0]];
    accounts.push({
      id: 'GV' + padNumber(i, 3),
      password: '111111',
      role: 'teacher',
      name: 'Giao vien ' + i,
      birthYear: 1979 + (i % 17),
      gender: i % 2 === 0 ? 'Nu' : 'Nam',
      subject: subjectName,
      classCodes: subjectCodes,
      classCode: subjectCodes[Math.floor((i - 1) / subjects.length) % subjectCodes.length],
      phone: '0902' + padNumber(i, 6)
    });
  }

  for (i = 0; i < classes.length; i++) {
    classes[i].teacher = 'GV' + padNumber((subjects.map(function (s) { return s.name; }).indexOf(classes[i].subject) + 1), 3);
  }

  for (i = 1; i <= 60; i++) {
    const sid = 'HV' + padNumber(i, 3);
    const subjectCodes = [];
    let s;
    for (s = 0; s < subjects.length; s++) {
      const code = classes[(s * 2) + ((i + s) % 2)].code;
      subjectCodes.push(code);
    }
    const classCode = subjectCodes[0];
    accounts.push({
      id: sid,
      password: '111111',
      role: 'student',
      name: 'Hoc vien ' + i,
      birthYear: 2006 + (i % 6),
      gender: i % 2 === 0 ? 'Nu' : 'Nam',
      classCode: classCode,
      subjectCodes: subjectCodes,
      phone: '0903' + padNumber(i, 6)
    });

    let c;
    for (c = 0; c < classes.length; c++) {
      if (subjectCodes.indexOf(classes[c].code) >= 0) {
        classes[c].studentIds.push(sid);
      }
    }
  }

  let hwCounter = 1;
  let materialCounter = 1;
  let revenueCounter = 1;

  for (i = 0; i < classCodes.length; i++) {
    const code = classCodes[i];
    materials[code] = [];
    homeworks[code] = [];

    let j;
    for (j = 1; j <= 3; j++) {
      materials[code].push({
        id: 'M' + padNumber(materialCounter, 4),
        session: 'Bộ tài liệu ' + j,
        title: classes[i].subject + ' ' + classes[i].level + ' - Unit ' + j + '.pdf'
      });
      materialCounter += 1;
    }

    for (j = 1; j <= 6; j++) {
      homeworks[code].push({
        id: 'HW' + padNumber(hwCounter, 4),
        title: classes[i].subject + ' - Bài tập ' + j,
        open: '2026-' + padNumber(((j + i) % 12) + 1, 2) + '-' + padNumber(((j * 2) % 26) + 1, 2),
        due: '2026-' + padNumber(((j + i) % 12) + 1, 2) + '-' + padNumber(((j * 2) % 26) + 3, 2),
        content: 'Hoàn thành bài tập tổng hợp môn ' + classes[i].subject + ', phần ' + j + ' (' + classes[i].level + ').'
      });
      hwCounter += 1;
    }

    for (j = 1; j <= 6; j++) {
      revenues.push({
        id: 'REV' + padNumber(revenueCounter, 4),
        classCode: code,
        month: '2026-' + padNumber(j, 2),
        students: classes[i].studentIds.length,
        amount: 18000000 + (i * 650000) + (j * 420000),
        subject: classes[i].subject
      });
      revenueCounter += 1;
    }
  }

  let tuitionCounter = 1;
  let invoiceCounter = 1;
  let gradeCounter = 1;
  let notifCounter = 1;
  let absenceCounter = 1;

  for (i = 1; i <= 60; i++) {
    const sid = 'HV' + padNumber(i, 3);
    const student = accounts[30 + (i - 1)];
    const subjectCodes = student.subjectCodes || [student.classCode];
    const due = 3200000 + ((i % 5) * 120000);
    const debt = i % 3 === 0 ? 600000 : 0;
    const paid = due - debt;

    let s;
    for (s = 0; s < subjectCodes.length; s++) {
      const code = subjectCodes[s];
      tuition.push({
        id: 'P' + padNumber(tuitionCounter, 4),
        studentId: sid,
        feeCode: 'HP-' + code + '-' + padNumber(i, 3),
        amountDue: due,
        paid: paid,
        offset: 0,
        discount: i % 7 === 0 ? 200000 : 0,
        debt: debt,
        paidDate: '2026-' + padNumber((i % 12) + 1, 2) + '-' + padNumber((i % 27) + 1, 2),
        method: i % 2 === 0 ? 'Chuyển khoản' : 'MoMo',
        note: 'Học phí môn ' + getClassByCodeLocal(code).subject
      });

      invoices.push({
        id: 'HD' + padNumber(invoiceCounter, 5),
        studentId: sid,
        classCode: code,
        totalAmount: due - (i % 7 === 0 ? 200000 : 0),
        discount: i % 7 === 0 ? 200000 : 0,
        status: debt > 0 ? 'unpaid' : 'paid',
        dueDate: '2026-' + padNumber(((i + s) % 12) + 1, 2) + '-' + padNumber(((i + s) % 25) + 1, 2),
        paidDate: debt > 0 ? '' : '2026-' + padNumber((i % 12) + 1, 2) + '-' + padNumber((i % 27) + 1, 2),
        method: debt > 0 ? '' : (i % 2 === 0 ? 'Chuyển khoản' : 'Tiền mặt'),
        note: 'Học phí môn ' + getClassByCodeLocal(code).subject
      });
      invoiceCounter += 1;
      tuitionCounter += 1;

      grades.push({
        id: 'GR' + padNumber(gradeCounter, 4),
        studentId: sid,
        classCode: code,
        subject: getClassByCodeLocal(code).subject,
        score1: 6 + ((i + s) % 4),
        score2: 5 + ((i + s) % 5),
        score3: 7 + ((i + s) % 3),
        average: Number(((6 + ((i + s) % 4) + 5 + ((i + s) % 5) + 7 + ((i + s) % 3)) / 3).toFixed(2))
      });
      gradeCounter += 1;
    }

    notifications.push({
      id: 'N' + padNumber(notifCounter, 4),
      audience: sid,
      to: sid,
      text: 'Thông báo học tập mới cho 5 môn học trong tuần.',
      title: 'Thông báo học tập',
      body: 'Thông báo học tập mới cho 5 môn học trong tuần.',
      type: 'GENERAL',
      timestamp: '2026-04-' + padNumber((i % 28) + 1, 2) + 'T09:' + padNumber((i * 3) % 60, 2) + ':00',
      time: '2026-04-' + padNumber((i % 28) + 1, 2) + ' 09:' + padNumber((i * 3) % 60, 2),
      read: false
    });
    notifCounter += 1;

    if (i <= 25) {
      absences.push({
        id: 'ABS' + padNumber(absenceCounter, 4),
        studentId: sid,
        date: '2026-03-' + padNumber((i % 28) + 1, 2),
        reason: i % 2 === 0 ? 'Viec gia dinh' : 'Suc khoe',
        description: 'Don nghi hoc auto-generated #' + i,
        status: i % 3 === 0 ? 'Chờ duyệt' : 'Đã duyệt'
      });
      absenceCounter += 1;

      leaveRequests.push({
        id: 'LR' + padNumber(absenceCounter, 4),
        studentId: sid,
        classCode: student.classCode,
        date: '2026-03-' + padNumber((i % 28) + 1, 2),
        reason: i % 2 === 0 ? 'Việc gia đình' : 'Sức khỏe',
        status: i % 3 === 0 ? 'pending' : 'approved',
        rejectReason: ''
      });
    }

    examSchedules.push({
      id: 'EX' + padNumber(i, 4) + 'A',
      studentId: sid,
      subject: 'Toán',
      examDate: '2026-05-15',
      session: 'Ca 1 (07:30)',
      room: 'P.301',
      seatNumber: 'SBD' + sid.slice(-3),
      result: i % 2 === 0 ? (7 + (i % 3)) : ''
    });
    examSchedules.push({
      id: 'EX' + padNumber(i, 4) + 'B',
      studentId: sid,
      subject: 'Tiếng Anh',
      examDate: '2026-05-20',
      session: 'Ca 2 (13:30)',
      room: 'P.204',
      seatNumber: 'SBD' + sid.slice(-3),
      result: ''
    });
    examSchedules.push({
      id: 'EX' + padNumber(i, 4) + 'C',
      studentId: sid,
      subject: 'Vật lý',
      examDate: '2026-05-25',
      session: 'Ca 1 (07:30)',
      room: 'P.305',
      seatNumber: 'SBD' + sid.slice(-3),
      result: ''
    });
  }

  for (i = 1; i <= 5; i++) {
    notifications.push({
      id: 'N' + padNumber(notifCounter, 4),
      audience: 'all-staff',
      to: 'all-staff',
      text: 'Tổng hợp doanh thu tháng ' + padNumber(i, 2) + '/2026 đã sẵn sàng.',
      title: 'Báo cáo doanh thu',
      body: 'Tổng hợp doanh thu tháng ' + padNumber(i, 2) + '/2026 đã sẵn sàng.',
      type: 'SYSTEM',
      timestamp: '2026-' + padNumber(i, 2) + '-28T16:30:00',
      time: '2026-' + padNumber(i, 2) + '-28 16:30',
      read: false
    });
    notifCounter += 1;
  }

  function getClassByCodeLocal(code) {
    let x;
    for (x = 0; x < classes.length; x++) {
      if (classes[x].code === code) {
        return classes[x];
      }
    }
    return { subject: 'Tong hop' };
  }

  let tm;
  for (tm = 0; tm < teacherMaterials.length; tm++) {
    const doc = teacherMaterials[tm];
    if (!materials[doc.classCode]) {
      materials[doc.classCode] = [];
    }
    materials[doc.classCode].unshift({
      id: doc.id,
      title: doc.title,
      session: 'Tài liệu giáo viên',
      fileName: '',
      classCode: doc.classCode,
      teacherId: doc.teacherId,
      uploadedAt: doc.uploadedAt
    });
  }

  return {
    subjects: subjects,
    accounts: accounts,
    classes: classes,
    materials: materials,
    homeworks: homeworks,
    absences: absences,
    leaveRequests: leaveRequests,
    tuition: tuition,
    invoices: invoices,
    notifications: notifications,
    submissions: submissions,
    examSchedules: examSchedules,
    teacherMaterials: teacherMaterials,
    sentNotifications: sentNotifications,
    comboDiscountRate: 0.1,
    grades: grades,
    revenues: revenues
  };
}

const db = buildMockDatabase();

const state = {
  currentUserId: '',
  selectedAccountId: 'HV001',
  selectedClassCode: 'L01',
  selectedHomeworkId: 'HW001',
  selectedStudentWeek: null,
  selectedStudentCalendarYear: null,
  selectedStudentCalendarMonth: null,
  selectedStudentCalendarDate: '',
  teacherCalendarYear: null,
  teacherCalendarMonth: null,
  selectedLeaveApprovalTab: 'pending',
  selectedInvoiceFilter: 'all',
  selectedInvoiceId: '',
  selectedPaymentMethod: '',
  selectedTuitionInvoiceId: '',
  editAccountFromProfile: false,
  profileEditing: false,
  scheduleConflictChecked: false,
  teacherGradeLocked: false,
  teacherGradeWeights: [34, 33, 33],
  activeModalId: '',
  lastFocusedElement: null,
  screenHistory: []
};

function byId(id) {
  return document.getElementById(id);
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('vi-VN') + ' VND';
}

function renderProgressBar(percent) {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  return '<div class="progress-bar"><div class="progress-green progress-green-dynamic" data-width="' + safePercent + '"></div></div>';
}

function hydrateProgressBars(container) {
  if (!container) {
    return;
  }
  const bars = container.querySelectorAll('.progress-green-dynamic');
  let i;
  for (i = 0; i < bars.length; i++) {
    const value = Number(bars[i].getAttribute('data-width'));
    const safePercent = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));
    bars[i].style.width = safePercent + '%';
  }
}

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

function announceStatus(message, mode) {
  const region = getLiveRegion();
  region.setAttribute('aria-live', mode === 'assertive' ? 'assertive' : 'polite');
  region.textContent = '';
  setTimeout(function () {
    region.textContent = message || '';
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
  if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === 'function') {
    state.lastFocusedElement.focus();
  }
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
    teacherWeightModal: { labelledby: 'teacherWeightModalTitle', describedby: 'teacherWeightModalDesc' }
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

function toast(message, type) {
  let t = byId('app-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'app-toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = message;
  t.classList.remove('toast-error');
  if (type === 'error') {
    t.classList.add('toast-error');
  }
  announceStatus(message, type === 'error' ? 'assertive' : 'polite');
  t.classList.add('show');
  setTimeout(function () {
    t.classList.remove('show');
  }, 1800);
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

function getAccountById(id) {
  let i;
  for (i = 0; i < db.accounts.length; i++) {
    if (db.accounts[i].id === id) {
      return db.accounts[i];
    }
  }
  return null;
}

function getClassByCode(code) {
  let i;
  for (i = 0; i < db.classes.length; i++) {
    if (db.classes[i].code === code) {
      return db.classes[i];
    }
  }
  return null;
}

function getStudentSubjectCodes(student) {
  if (student && student.subjectCodes && student.subjectCodes.length) {
    return student.subjectCodes;
  }
  if (student && student.classCode) {
    return [student.classCode];
  }
  return ['L01'];
}

function getSubjectDisplay(code) {
  const c = getClassByCode(code);
  if (!c) {
    return code;
  }
  return c.subject + ' - ' + c.level;
}

function getSubjectIconSvg(subject) {
  if (subject === 'Toán') {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16"/><path d="M4 17h16"/><path d="M9 12h6"/></svg>';
  }
  if (subject === 'Vật lý') {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>';
  }
  if (subject === 'Hóa học') {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 2v5l-5 8a4 4 0 0 0 3.4 6h7.2a4 4 0 0 0 3.4-6l-5-8V2"/><path d="M8 14h8"/></svg>';
  }
  if (subject === 'Ngữ văn') {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21V4.5A2.5 2.5 0 0 1 6.5 2z"/></svg>';
  }
  if (subject === 'Tiếng Anh') {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18"/><path d="M12 3a15 15 0 0 0 0 18"/></svg>';
  }
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z"/><path d="M3 12l9 4.5 9-4.5"/><path d="M3 16.5L12 21l9-4.5"/></svg>';
}

function getRoleLabel(role) {
  if (role === 'staff') {
    return 'Nhân viên';
  }
  if (role === 'teacher') {
    return 'Giáo viên';
  }
  if (role === 'student') {
    return 'Học viên';
  }
  return role || '-';
}

function getPrimarySubjectClasses() {
  const picked = [];
  const seen = {};
  let i;
  for (i = 0; i < db.classes.length; i++) {
    const c = db.classes[i];
    if (!seen[c.subject]) {
      picked.push(c);
      seen[c.subject] = true;
    }
  }
  return picked;
}

function getCurrentStudent() {
  const user = getAccountById(state.currentUserId);
  if (user && user.role === 'student') {
    return user;
  }
  return getAccountById('HV001');
}

function getCurrentTeacher() {
  const user = getAccountById(state.currentUserId);
  if (user && user.role === 'teacher') {
    return user;
  }
  let i;
  for (i = 0; i < db.accounts.length; i++) {
    if (db.accounts[i].role === 'teacher') {
      return db.accounts[i];
    }
  }
  return null;
}

function renderSubjectContextLabels() {
  const c = getClassByCode(state.selectedClassCode) || db.classes[0];
  if (!c) {
    return;
  }
  if (byId('teacherSelectedSubjectLabel')) {
    byId('teacherSelectedSubjectLabel').textContent = ' - ' + c.subject;
  }
  if (byId('studentSelectedSubjectLabel')) {
    byId('studentSelectedSubjectLabel').textContent = ' - ' + c.subject;
  }
  const ids = ['studentCrumbSubjectMaterials', 'studentCrumbSubjectHomeworkList', 'studentCrumbSubjectHomeworkDetail', 'studentCrumbSubjectGrades'];
  let i;
  for (i = 0; i < ids.length; i++) {
    if (byId(ids[i])) {
      byId(ids[i]).textContent = c.subject;
    }
  }

  const teacherHomeworkBread = document.querySelector('#s-teacher-homework .breadcrumb .bc-link');
  if (teacherHomeworkBread) {
    teacherHomeworkBread.textContent = c.subject + ' - Tạo bài tập';
  }
  const teacherAttendanceBread = document.querySelector('#s-teacher-attendance .breadcrumb .bc-link');
  if (teacherAttendanceBread) {
    teacherAttendanceBread.textContent = 'Điểm danh - ' + c.subject;
  }
  const teacherGradesBread = document.querySelector('#s-teacher-grades .breadcrumb .bc-link');
  if (teacherGradesBread) {
    teacherGradesBread.textContent = 'Bảng điểm - ' + c.subject;
  }
}

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
    gridHtml += '<div class="class-card" onclick="selectSubjectFromDashboard(\'' + c.code + '\',\'teacher\')">' +
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
    gridHtml += '<div class="class-card" onclick="selectSubjectFromDashboard(\'' + c.code + '\',\'student\')">' +
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
    html += '<div class="student-assignment-item" role="button" tabindex="0" onclick="openHomework(\'' + e.homeworkId + '\')">' +
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

function getActiveScreenId() {
  const active = document.querySelector('.screen.active');
  return active ? active.id : '';
}

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
  } else {
    console.warn('Screen not found:', id);
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

function loginByRole(role, targetScreen) {
  const root = byId('s-login-' + role);
  if (!root) {
    return;
  }
  const accountInput = root.querySelector('input[type="text"]');
  const passInput = root.querySelector('input[type="password"]');
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
  state.currentUserId = found.id;
  state.selectedAccountId = found.id;
  if (role === 'teacher' && found.classCodes && found.classCodes.length) {
    state.selectedClassCode = found.classCodes[0];
  } else if (found.classCode) {
    state.selectedClassCode = found.classCode;
  }
  toast('Đăng nhập thành công: ' + found.name);
  show(targetScreen);
}

function renderAccountTable() {
  const body = byId('accountTableBody');
  if (!body) {
    return;
  }
  const qInput = byId('accountSearchInput');
  const q = qInput && qInput.value ? qInput.value.trim().toLowerCase() : '';
  let html = '';
  let i;
  for (i = 0; i < db.accounts.length; i++) {
    const a = db.accounts[i];
    if (q && a.id.toLowerCase().indexOf(q) === -1 && a.name.toLowerCase().indexOf(q) === -1) {
      continue;
    }
    const roleClass = 'role-' + a.role;
    const subjectDisplay = a.classCode ? getSubjectDisplay(a.classCode) : '-';
    html += '<tr>' +
      '<td>' + a.id + '</td>' +
      '<td><div class="fw700">' + a.name + '</div></td>' +
      '<td>' + (a.birthYear || '-') + '</td>' +
      '<td>' + (a.gender || '-') + '</td>' +
      '<td><span class="role-badge ' + roleClass + '">' + getRoleLabel(a.role) + '</span></td>' +
      '<td>' + subjectDisplay + '</td>' +
      '<td><button class="btn btn-cyan btn-sm" onclick="openAccountEdit(\'' + a.id + '\')">Chỉnh sửa</button></td>' +
      '</tr>';
  }
  body.innerHTML = html || '<tr><td colspan="7" class="txt-center">Không có dữ liệu</td></tr>';
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
  a.password = byId('editAccountPassword').value.trim() || a.password;
  a.name = byId('editAccountName').value.trim() || a.name;
  a.birthYear = Number(byId('editAccountBirthYear').value.trim() || a.birthYear);
  a.gender = byId('editAccountGender').value.trim() || a.gender;
  a.email = byId('editAccountEmail').value.trim();
  a.phone = byId('editAccountPhone').value.trim();
  a.classCode = byId('editAccountClassCode').value.trim().toUpperCase() || '';
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
  let html = '';
  let i;
  for (i = 0; i < db.accounts.length; i++) {
    const a = db.accounts[i];
    if (a.role !== 'student') {
      continue;
    }
    if (q && a.id.toLowerCase().indexOf(q) === -1 && a.name.toLowerCase().indexOf(q) === -1) {
      continue;
    }
    html += '<tr>' +
      '<td>' + a.id + '</td>' +
      '<td><div class="fw700">' + a.name + '</div></td>' +
      '<td>' + (a.birthYear || '-') + '</td>' +
      '<td>' + (a.gender || '-') + '</td>' +
      '<td><span class="role-badge role-student">Học viên</span></td>' +
      '<td>' + getSubjectDisplay(a.classCode) + '</td>' +
      '<td><button class="btn btn-cyan btn-sm" onclick="viewStudentProfileDetail(\'' + a.id + '\')">Xem chi tiết</button></td>' +
      '</tr>';
  }
  body.innerHTML = html || '<tr><td colspan="7" class="txt-center">Không có dữ liệu</td></tr>';
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
    html += '<div class="class-card' + active + '" onclick="selectClass(' + '\'' + c.code + '\'' + ')">' +
      '<div class="class-card-img">' + getSubjectIconSvg(c.subject) + c.subject + '</div>' +
      renderProgressBar(Math.min(100, Math.round((c.studentIds.length / c.capacity) * 100))) +
      '<div class="class-name">' + c.code + ' - ' + c.name + '</div>' +
      '<div class="class-pct">Sĩ số: ' + c.studentIds.length + '/' + c.capacity + '</div>' +
      '<div class="mt8"><button class="btn btn-cyan" onclick="event.stopPropagation();openClassDetail(\'' + c.code + '\')">Chi tiết</button></div>' +
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

  const avatar = header.querySelector('.avatar-btn');
  if (!avatar) {
    return;
  }

  let box = header.querySelector('.header-user-info');
  if (!box) {
    box = document.createElement('div');
    box.className = 'header-user-info';
    box.innerHTML = '<div class="header-user-name"></div><div class="header-user-role"></div>';
    header.insertBefore(box, avatar);
  }

  const user = getAccountById(state.currentUserId);
  const nameNode = box.querySelector('.header-user-name');
  const roleNode = box.querySelector('.header-user-role');
  if (!nameNode || !roleNode) {
    return;
  }

  if (user) {
    nameNode.textContent = user.name;
    roleNode.textContent = getRoleLabel(user.role);
    return;
  }

  nameNode.textContent = 'Khách';
  if (screen.classList.contains('teacher-screen')) {
    roleNode.textContent = 'Giáo viên';
  } else if (screen.classList.contains('student-screen')) {
    roleNode.textContent = 'Học viên';
  } else if (screen.classList.contains('staff-screen')) {
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
      '<td><button class="btn btn-red btn-xs" onclick="removeStudentFromClass(\'' + s.id + '\')">Xóa</button></td></tr>';
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
  let i;
  for (i = 0; i < db.classes.length; i++) {
    if (db.classes[i].code === state.selectedClassCode) {
      db.classes.splice(i, 1);
      break;
    }
  }
  state.selectedClassCode = db.classes.length ? db.classes[0].code : '';
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
  byId('detailStudentCode').value = '';
  renderClassDetail();
  renderClassGrid();
  toast('Đã thêm học viên vào lớp.');
}

function removeStudentFromClass(studentId) {
  const c = getClassByCode(state.selectedClassCode);
  if (!c) {
    return;
  }
  let i;
  for (i = c.studentIds.length - 1; i >= 0; i--) {
    if (c.studentIds[i] === studentId) {
      c.studentIds.splice(i, 1);
    }
  }
  const s = getAccountById(studentId);
  if (s && s.classCode === c.code) {
    s.classCode = '';
  }
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
  wrap.innerHTML = '<div class="resource-list">' + (html || '<div class="invoice-item">Chưa có tài liệu.</div>') + '</div>';
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
    html += '<div class="resource-item resource-item-clickable" onclick="openHomework(\'' + list[i].id + '\')">' +
      '<div class="resource-item-title">' + list[i].title + '</div>' +
        '<div class="resource-item-sub">Mở: ' + list[i].open + ' | Hạn nộp: ' + list[i].due + '</div>' +
        '<div class="resource-item-sub">Bấm để xem chi tiết và nộp bài</div>' +
      '</div>';
  }
      wrap.innerHTML = '<div class="resource-list">' + (html || '<div class="invoice-item">Chưa có bài tập.</div>') + '</div>';
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
      '<button class="course-item-action" type="button" onclick="openHomework(\'' + hw.id + '\')">Xem chi tiết</button>' +
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
      ? '<button class="btn btn-outline" onclick="openReceipt(\'' + t.id + '\')">Xem biên lai</button>'
      : '<button class="btn btn-cyan" onclick="openPaymentProcessForInvoice(\'' + t.id + '\')">Thanh toán</button>';
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
  navigator.clipboard.writeText(text).then(function () {
    toast('Đã sao chép nội dung chuyển khoản');
  }).catch(function () {
    toast('Không thể sao chép nội dung chuyển khoản', 'error');
  });
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
    html += '<tr><td>' + t.id + '</td><td>' + t.note + '</td><td>' + t.paidDate + '</td><td>' + t.method + '</td><td>' + formatCurrency(t.totalAmount) + '</td><td>Đã phát hành</td><td><span class="link" onclick="openReceipt(\'' + t.id + '\')">Chi tiết</span></td></tr>';
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
  let html = '';
  let i;
  for (i = 0; i < list.length; i++) {
    const n = list[i];
    html += '<div class="notif-item"><div class="notif-text">Thông báo: <strong>' + (n.title || 'Thông báo') + '</strong><br>' + (n.body || n.text || '') + '</div><div class="notif-time">' + (n.time || '') + (n.read ? '' : ' - <span class="badge badge-red">Thông báo mới</span>') + '</div></div>';
  }
  wrap.innerHTML = html || '<div class="notif-item">Không có thông báo.</div>';
}

function renderTeacherNotifications() {
  const wrap = byId('teacherNotificationList');
  const teacher = getCurrentTeacher();
  if (!wrap || !teacher) {
    return;
  }
  const list = getNotificationsFor(teacher.id, 'teacher');
  let html = '';
  let i;
  for (i = 0; i < list.length; i++) {
    const n = list[i];
    html += '<div class="notif-item" onclick="markTeacherNotificationRead(\'' + n.id + '\')"><div class="notif-text">Thông báo: <strong>' + (n.title || 'Thông báo') + '</strong><br>' + (n.body || n.text || '') + '</div><div class="notif-time">' + (n.time || '') + (n.read ? '' : ' - <span class="badge badge-red">Thông báo mới</span>') + '</div></div>';
  }
  wrap.innerHTML = html || '<div class="notif-item">Không có thông báo.</div>';
}

function markTeacherNotificationRead(id) {
  const n = db.notifications.find(function (x) { return x.id === id; });
  if (n) {
    n.read = true;
  }
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
  const allowedSubjects = ['Toán', 'Vật lý', 'Hóa học'];
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
      ? '<button class="btn btn-green btn-xs" onclick="approveLeaveRequest(\'' + r.id + '\')">Duyệt</button> <button class="btn btn-red btn-xs" onclick="showRejectLeaveInput(\'' + r.id + '\')">Từ chối</button><div id="reject-' + r.id + '" class="inline-hidden mt8"><input class="fi" id="reject-input-' + r.id + '" placeholder="Nhập lý do từ chối"><button class="btn btn-red mt8" onclick="rejectLeaveRequest(\'' + r.id + '\')">Gửi từ chối</button></div>'
      : '-';
    html += '<tr><td>' + r.id + '</td><td>' + r.studentId + '</td><td>' + (r.classCode || '-') + '</td><td>' + r.date + '</td><td>' + r.reason + (r.rejectReason ? '<br><em>Lý do từ chối: ' + r.rejectReason + '</em>' : '') + '</td><td>' + st + '</td><td>' + act + '</td></tr>';
  }
  body.innerHTML = html || '<tr><td colspan="7">Không có dữ liệu</td></tr>';
}

function approveLeaveRequest(id) {
  const item = db.leaveRequests.find(function (x) { return x.id === id; });
  if (!item) {
    return;
  }
  item.status = 'approved';
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
  renderStaffInvoiceList();
  toast('Đã tạo hóa đơn cho ' + count + ' học viên.');
}

function setInvoiceFilter(filter) {
  state.selectedInvoiceFilter = filter;
  renderStaffInvoiceList();
}

function renderStaffInvoiceList() {
  const body = byId('staffInvoiceListBody');
  if (!body) {
    return;
  }
  let html = '';
  let i;
  for (i = 0; i < db.invoices.length; i++) {
    const inv = db.invoices[i];
    if (state.selectedInvoiceFilter === 'unpaid' && inv.status !== 'unpaid') {
      continue;
    }
    if (state.selectedInvoiceFilter === 'paid' && inv.status !== 'paid') {
      continue;
    }
    const st = inv.status === 'paid' ? '<span class="badge badge-green">Đã thanh toán</span>' : '<span class="badge badge-red">Chưa thanh toán</span>';
    const action = inv.status === 'unpaid' ? '<button class="btn btn-cyan btn-xs" onclick="openInvoicePaymentModal(\'' + inv.id + '\')">Xác nhận đã thu</button>' : '-';
    html += '<tr><td>' + inv.id + '</td><td>' + inv.studentId + '</td><td>' + formatCurrency(inv.totalAmount) + '</td><td>' + st + '</td><td>' + inv.dueDate + '</td><td>' + action + ' <button class="btn btn-outline btn-xs" onclick="openReceipt(\'' + inv.id + '\')">Xem biên lai</button></td></tr>';
  }
  body.innerHTML = html || '<tr><td colspan="6">Không có hóa đơn</td></tr>';
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
    '<div class="mt12 receipt-actions"><button class="btn btn-outline" onclick="closeModal(\'receiptModal\')">Đóng</button><button class="btn btn-green" onclick="window.print()">In biên lai</button></div>';
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
  db.sentNotifications.unshift({ title: title.value.trim(), target: targetLabel, sentAt: new Date().toLocaleString('vi-VN'), status: 'Đã gửi' });
  title.value = '';
  body.value = '';
  byId('notifyStudentInput').value = '';
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

function applyDynamicNavbars() {
  const screens = document.querySelectorAll('.screen');
  let i;
  for (i = 0; i < screens.length; i++) {
    const sc = screens[i];
    const nav = sc.querySelector('.navbar');
    if (!nav) {
      continue;
    }
    const id = sc.id;
    if (id.indexOf('s-staff-') === 0 || id.indexOf('s-account-') === 0 || id.indexOf('s-class-') === 0 || id.indexOf('s-report') === 0 || id === 's-timetable' || id === 's-revenue' || id === 's-student-profile-search' || id === 's-student-profile-detail') {
      const active = {
        home: id === 's-staff-home',
        account: id.indexOf('s-account-') === 0,
        profile: id.indexOf('s-student-profile-') === 0,
        classManage: id.indexOf('s-class-') === 0,
        timetable: id === 's-timetable',
        leave: id === 's-staff-leave-approval',
        invoice: id === 's-staff-invoice-manage',
        notify: id === 's-staff-notification-send',
        revenue: id === 's-revenue',
        report: id.indexOf('s-report') === 0
      };
      nav.innerHTML =
        '<button class="nav-btn ' + (active.home ? 'active' : '') + '" onclick="show(\'s-staff-home\')">Trang chủ</button>' +
        '<button class="nav-btn ' + (active.account ? 'active' : '') + '" onclick="show(\'s-account-list\')">Tài khoản</button>' +
        '<button class="nav-btn ' + (active.profile ? 'active' : '') + '" onclick="show(\'s-student-profile-search\')">Hồ sơ học viên</button>' +
        '<button class="nav-btn ' + (active.classManage ? 'active' : '') + '" onclick="show(\'s-class-manage\')">Lớp học</button>' +
        '<button class="nav-btn ' + (active.timetable ? 'active' : '') + '" onclick="show(\'s-timetable\')">Thời khóa biểu</button>' +
        '<button class="nav-btn ' + (active.leave ? 'active' : '') + '" onclick="show(\'s-staff-leave-approval\')">Duyệt đơn nghỉ</button>' +
        '<button class="nav-btn ' + (active.invoice ? 'active' : '') + '" onclick="show(\'s-staff-invoice-manage\')">Quản lý học phí</button>' +
        '<button class="nav-btn ' + (active.notify ? 'active' : '') + '" onclick="show(\'s-staff-notification-send\')">Thông báo</button>' +
        '<button class="nav-btn ' + (active.revenue ? 'active' : '') + '" onclick="show(\'s-revenue\')">Thống kê doanh thu</button>' +
        '<button class="nav-btn ' + (active.report ? 'active' : '') + '" onclick="show(\'s-report\')">Báo cáo</button>';
      continue;
    }
    if (id.indexOf('s-student-') === 0) {
      const active2 = {
        learning: id === 's-student-dashboard' || id === 's-student-class-detail' || id === 's-student-materials' || id === 's-student-homework-list' || id === 's-student-homework-detail',
        transcript: id === 's-student-transcript',
        timetable: id === 's-student-timetable' || id === 's-student-exam-schedule',
        absence: id.indexOf('s-student-absence') === 0,
        tuition: id.indexOf('s-student-tuition') === 0 || id.indexOf('s-student-payment') === 0,
        notify: id === 's-student-notifications'
      };
      nav.innerHTML =
        '<button class="nav-btn ' + (active2.learning ? 'active' : '') + '" onclick="show(\'s-student-dashboard\')">Học tập</button>' +
        '<button class="nav-btn ' + (active2.transcript ? 'active' : '') + '" onclick="show(\'s-student-transcript\')">Bảng điểm</button>' +
        '<button class="nav-btn ' + (active2.timetable ? 'active' : '') + '" onclick="show(\'s-student-timetable\')">Thời khóa biểu</button>' +
        '<button class="nav-btn ' + (active2.absence ? 'active' : '') + '" onclick="show(\'s-student-absence\')">Đơn xin nghỉ</button>' +
        '<button class="nav-btn ' + (active2.tuition ? 'active' : '') + '" onclick="show(\'s-student-tuition\')">Thông tin học phí</button>' +
        '<button class="nav-btn ' + (active2.notify ? 'active' : '') + '" onclick="show(\'s-student-notifications\')">Thông báo</button>' +
        '<button class="nav-btn">Ngôn ngữ</button><button class="nav-search">Tìm kiếm</button>';
      continue;
    }
    if (id.indexOf('s-teacher-') === 0) {
      const unread = getUnreadNotificationCount(getCurrentTeacher().id, 'teacher');
      const notifyText = unread > 0 ? ('Thông báo (' + unread + ')') : 'Thông báo';
      const isNotify = id === 's-teacher-notifications';
      nav.innerHTML =
        '<button class="nav-btn ' + (!isNotify ? 'active' : '') + '" onclick="show(\'s-teacher-dashboard\')">Tổng quan</button>' +
        '<button class="nav-btn ' + (isNotify ? 'active' : '') + '" onclick="show(\'s-teacher-notifications\')">' + notifyText + '</button>' +
        '<button class="nav-btn">Ngôn ngữ</button><button class="nav-search">Tìm kiếm</button>';
    }
  }
}

function applyAccessibilityPolish(root) {
  const scope = root || document;
  const navSearchButtons = scope.querySelectorAll('.nav-search');
  let i;
  for (i = 0; i < navSearchButtons.length; i++) {
    navSearchButtons[i].setAttribute('aria-label', 'Mở tìm kiếm nhanh');
    navSearchButtons[i].setAttribute('title', 'Mở tìm kiếm nhanh');
  }

  const fileToolbarButtons = scope.querySelectorAll('.file-toolbar .file-tb-btn');
  for (i = 0; i < fileToolbarButtons.length; i++) {
    const current = (fileToolbarButtons[i].textContent || '').trim().toLowerCase();
    if (current === 'tep') {
      fileToolbarButtons[i].textContent = 'Tệp';
      fileToolbarButtons[i].setAttribute('aria-label', 'Tệp');
      fileToolbarButtons[i].setAttribute('title', 'Tệp');
    } else if (current === 'thu muc') {
      fileToolbarButtons[i].textContent = 'Thư mục';
      fileToolbarButtons[i].setAttribute('aria-label', 'Thư mục');
      fileToolbarButtons[i].setAttribute('title', 'Thư mục');
    } else if (current === 'xoa') {
      fileToolbarButtons[i].textContent = 'Xóa';
      fileToolbarButtons[i].setAttribute('aria-label', 'Xóa');
      fileToolbarButtons[i].setAttribute('title', 'Xóa');
    }
  }

  const clickableNodes = scope.querySelectorAll('div[onclick], span[onclick]');
  for (i = 0; i < clickableNodes.length; i++) {
    if (!clickableNodes[i].hasAttribute('role')) {
      clickableNodes[i].setAttribute('role', 'button');
    }
    if (!clickableNodes[i].hasAttribute('tabindex')) {
      clickableNodes[i].setAttribute('tabindex', '0');
    }
    if (!clickableNodes[i].dataset.a11yKeybind) {
      clickableNodes[i].addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.click();
        }
      });
      clickableNodes[i].dataset.a11yKeybind = '1';
    }
  }
}

function renderStudentGrades() {
  const student = getCurrentStudent();
  const body = byId('studentGradesBody');
  const select = byId('studentGradeTrendSubject');
  const summary = byId('studentTranscriptSummary');
  if (!student || !body || !select) {
    return;
  }
  const list = db.grades.filter(function (g) { return g.studentId === student.id; });
  list.sort(function (a, b) {
    return String(a.subject).localeCompare(String(b.subject), 'vi');
  });
  let html = '';
  let opt = '';
  let totalAvg = 0;
  let maxAvg = -1;
  let bestSubject = '';
  let i;
  for (i = 0; i < list.length; i++) {
    const g = list[i];
    html += '<tr><td>' + g.subject + '</td><td>' + g.score1 + '</td><td>' + g.score2 + '</td><td>' + g.score3 + '</td><td>' + g.average + '</td></tr>';
    opt += '<option value="' + g.subject + '">' + g.subject + '</option>';
    totalAvg += Number(g.average) || 0;
    if ((Number(g.average) || 0) > maxAvg) {
      maxAvg = Number(g.average) || 0;
      bestSubject = g.subject;
    }
  }
  body.innerHTML = html || '<tr><td colspan="5">Không có dữ liệu</td></tr>';
  select.innerHTML = opt;
  if (summary) {
    const overall = list.length ? (totalAvg / list.length).toFixed(2) : '-';
    summary.innerHTML =
      '<div class="stat-card"><div class="stat-label">Số môn đang học</div><div class="stat-value">' + list.length + '</div></div>' +
      '<div class="stat-card"><div class="stat-label">Điểm trung bình chung</div><div class="stat-value">' + overall + '</div></div>' +
      '<div class="stat-card"><div class="stat-label">Môn cao nhất</div><div class="stat-value fs18">' + (bestSubject || '-') + '</div></div>';
  }
  renderStudentProgressChart();
}

function renderStudentCourseTranscriptWidget() {
  const student = getCurrentStudent();
  const c = getClassByCode(state.selectedClassCode) || db.classes[0];
  const subjectNode = byId('studentCourseWidgetSubject');
  const classNode = byId('studentCourseWidgetClass');
  const s1Node = byId('studentCourseWidgetScore1');
  const s2Node = byId('studentCourseWidgetScore2');
  const s3Node = byId('studentCourseWidgetScore3');
  const avgNode = byId('studentCourseWidgetAverage');
  const statusNode = byId('studentCourseWidgetTrendStatus');
  const svg = byId('studentCourseWidgetChart');
  if (!subjectNode || !classNode || !s1Node || !s2Node || !s3Node || !avgNode || !statusNode || !svg) {
    return;
  }
  if (!student || !c) {
    subjectNode.textContent = 'Chưa có môn học';
    classNode.textContent = 'Không có dữ liệu lớp';
    s1Node.textContent = '-';
    s2Node.textContent = '-';
    s3Node.textContent = '-';
    avgNode.textContent = '-';
    statusNode.textContent = 'Chưa có dữ liệu điểm.';
    svg.innerHTML = '';
    return;
  }

  subjectNode.textContent = c.subject;
  classNode.textContent = 'Lớp ' + c.code;

  const grade = db.grades.find(function (g) {
    return g.studentId === student.id && (g.classCode === c.code || g.subject === c.subject);
  });

  if (!grade) {
    s1Node.textContent = '-';
    s2Node.textContent = '-';
    s3Node.textContent = '-';
    avgNode.textContent = '-';
    statusNode.textContent = 'Môn này chưa có dữ liệu đánh giá.';
    svg.innerHTML = '';
    return;
  }

  const score1 = Number(grade.score1) || 0;
  const score2 = Number(grade.score2) || 0;
  const score3 = Number(grade.score3) || 0;
  const average = Number(grade.average) || 0;
  s1Node.textContent = score1.toFixed(1);
  s2Node.textContent = score2.toFixed(1);
  s3Node.textContent = score3.toFixed(1);
  avgNode.textContent = average.toFixed(2);

  const points = [score1, score2, score3, average];
  const labels = ['KT1', 'KT2', 'KT3', 'TB'];
  const minX = 24;
  const maxX = 276;
  const minY = 92;
  const maxY = 16;
  const step = (maxX - minX) / (points.length - 1);
  const topScore = Math.max.apply(null, points);
  let poly = '';
  let circles = '';
  let labelHtml = '';
  let i;
  for (i = 0; i < points.length; i++) {
    const x = minX + (i * step);
    const y = minY - ((points[i] / 10) * (minY - maxY));
    poly += (i ? ' ' : '') + x + ',' + y;
    circles += '<circle cx="' + x + '" cy="' + y + '" r="3.5" fill="#2563eb"></circle>';
    if (points[i] === topScore) {
      circles += '<circle cx="' + x + '" cy="' + y + '" r="6" fill="none" stroke="#f47c20" stroke-width="1.5"></circle>';
    }
    labelHtml += '<text x="' + x + '" y="109" text-anchor="middle" font-size="10" fill="#64748b">' + labels[i] + '</text>';
  }

  svg.innerHTML =
    '<line x1="18" y1="92" x2="284" y2="92" stroke="#cbd5e1" stroke-width="1"></line>' +
    '<line x1="24" y1="10" x2="24" y2="96" stroke="#cbd5e1" stroke-width="1"></line>' +
    '<polyline points="' + poly + '" fill="none" stroke="#2563eb" stroke-width="2.2"></polyline>' +
    circles + labelHtml;

  if (average >= 8) {
    statusNode.textContent = 'Xu hướng ổn định, kết quả đang ở mức tốt.';
  } else if (average >= 6.5) {
    statusNode.textContent = 'Kết quả đạt yêu cầu, có thể cải thiện thêm ở các bài sau.';
  } else {
    statusNode.textContent = 'Cần tập trung ôn luyện thêm cho môn học này.';
  }
}

function renderStudentProgressChart() {
  const svg = byId('studentProgressChart');
  const student = getCurrentStudent();
  const subject = byId('studentGradeTrendSubject') ? byId('studentGradeTrendSubject').value : '';
  if (!svg || !student || !subject) {
    return;
  }
  const grade = db.grades.find(function (g) { return g.studentId === student.id && g.subject === subject; });
  if (!grade) {
    return;
  }
  const points = [grade.score1 - 0.6, grade.score1, grade.score2 - 0.3, grade.score2, grade.score3 - 0.2, grade.score3];
  const maxVal = Math.max.apply(null, points);
  const minX = 50;
  const maxX = 600;
  const minY = 220;
  const maxY = 30;
  const step = (maxX - minX) / (points.length - 1);
  let poly = '';
  let circles = '';
  let labelsHtml = '';
  const labels = ['KT1', 'KT2', 'KT3', 'KT4', 'KT5', 'Tổng kết'];
  let i;
  for (i = 0; i < points.length; i++) {
    const x = minX + (i * step);
    const y = minY - ((points[i] / 10) * (minY - maxY));
    poly += (i ? ' ' : '') + x + ',' + y;
    circles += '<circle cx="' + x + '" cy="' + y + '" r="4" fill="var(--green)"></circle>';
    labelsHtml += '<text x="' + x + '" y="240" text-anchor="middle" font-size="11" fill="#666">' + labels[i] + '</text>';
    if (points[i] === maxVal) {
      circles += '<circle cx="' + x + '" cy="' + y + '" r="7" fill="var(--orange)"></circle>';
    }
  }
  svg.innerHTML = '<line x1="40" y1="220" x2="610" y2="220" stroke="#94a3b8"/>' +
    '<line x1="50" y1="20" x2="50" y2="230" stroke="#94a3b8"/>' +
    '<polyline points="' + poly + '" fill="none" stroke="var(--green)" stroke-width="3"></polyline>' +
    circles + labelsHtml;
}

function renderStudentProfile() {
  const s = getCurrentStudent();
  if (!s) {
    return;
  }
  byId('profileStudentId').value = s.id;
  byId('profileName').value = s.name;
  byId('profileBirthYear').value = s.birthYear;
  byId('profileEmail').value = s.email || '';
  byId('profilePhone').value = s.phone || '';
  byId('profileAddress').value = s.address || '';
}

function enableStudentProfileEdit() {
  state.profileEditing = true;
  byId('profileEmail').readOnly = false;
  byId('profilePhone').readOnly = false;
  byId('profileAddress').readOnly = false;
  byId('profileEditActions').classList.add('inline-hidden');
  byId('profileSaveActions').classList.remove('inline-hidden');
}

function cancelStudentProfileEdit() {
  state.profileEditing = false;
  byId('profileEmail').readOnly = true;
  byId('profilePhone').readOnly = true;
  byId('profileAddress').readOnly = true;
  byId('profileEditActions').classList.remove('inline-hidden');
  byId('profileSaveActions').classList.add('inline-hidden');
  renderStudentProfile();
}

function saveStudentProfile() {
  const s = getCurrentStudent();
  const email = byId('profileEmail').value.trim();
  const phone = byId('profilePhone').value.trim();
  clearInputError(byId('profileEmail'));
  clearInputError(byId('profilePhone'));
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    markInputError(byId('profileEmail'), 'Email không đúng định dạng');
  }
  if (phone && !/^[0-9]{1,10}$/.test(phone)) {
    markInputError(byId('profilePhone'), 'Số điện thoại chỉ chứa số, tối đa 10 chữ số');
  }
  if (byId('profileEmail').classList.contains('input-error') || byId('profilePhone').classList.contains('input-error')) {
    toast('Vui lòng kiểm tra dữ liệu trước khi lưu.', 'error');
    return;
  }
  s.email = email;
  s.phone = phone;
  s.address = byId('profileAddress').value.trim();
  cancelStudentProfileEdit();
  toast('Đã cập nhật thông tin');
}

function changeStudentPassword() {
  const s = getCurrentStudent();
  const oldPass = byId('profileCurrentPassword').value.trim();
  const newPass = byId('profileNewPassword').value.trim();
  const confirmPass = byId('profileConfirmPassword').value.trim();
  if (oldPass !== s.password) {
    toast('Mật khẩu hiện tại không đúng.', 'error');
    return;
  }
  if (newPass.length < 6) {
    toast('Mật khẩu mới phải từ 6 ký tự.', 'error');
    return;
  }
  if (newPass !== confirmPass) {
    toast('Xác nhận mật khẩu mới không khớp.', 'error');
    return;
  }
  s.password = newPass;
  byId('profileCurrentPassword').value = '';
  byId('profileNewPassword').value = '';
  byId('profileConfirmPassword').value = '';
  toast('Đổi mật khẩu thành công.');
}

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
    html += '</tbody></table></div><div class="mt8"><button class="btn btn-green" onclick="confirmBulkImport()">Xác nhận Import</button></div>';
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
  state.teacherGradeLocked = true;
  const table = byId('teacherGradesTable');
  if (table) {
    table.classList.add('grade-locked');
    const inputs = table.querySelectorAll('input');
    let i;
    for (i = 0; i < inputs.length; i++) {
      inputs[i].disabled = true;
    }
    const badge = document.createElement('span');
    badge.className = 'badge badge-red';
    badge.textContent = 'ĐÃ KHÓA';
    table.parentElement.insertBefore(badge, table);
  }
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
  toast('Đã lưu bảng điểm (' + saved + ' học viên).');
  show('s-teacher-class-detail');
}

function syncScreen(id) {
  applyDynamicNavbars();
  if (id === 's-teacher-dashboard') {
    renderTeacherSubjectDashboard();
    renderSubjectContextLabels();
  }
  if (id === 's-student-dashboard') {
    renderStudentSubjectDashboard();
    renderStudentDashboardWidgets();
    renderSubjectContextLabels();
  }
  if (id === 's-teacher-class-detail' || id === 's-student-class-detail' || id === 's-teacher-homework' || id === 's-teacher-attendance' || id === 's-teacher-grades' || id === 's-student-materials' || id === 's-student-homework-list' || id === 's-student-homework-detail') {
    renderSubjectContextLabels();
  }
  if (id === 's-account-list') {
    renderAccountTable();
  }
  if (id === 's-student-profile-search') {
    renderStudentProfileTable();
  }
  if (id === 's-student-profile-detail') {
    renderStudentDetail(state.selectedAccountId);
  }
  if (id === 's-class-manage') {
    renderClassGrid();
  }
  if (id === 's-class-detail') {
    renderClassDetail();
  }
  if (id === 's-student-materials') {
    renderStudentMaterialList();
  }
  if (id === 's-student-class-detail') {
    renderStudentClassDetailContent();
    renderStudentCourseTranscriptWidget();
  }
  if (id === 's-student-transcript') {
    renderStudentGrades();
  }
  if (id === 's-student-homework-list') {
    renderStudentHomeworkList();
  }
  if (id === 's-student-homework-detail') {
    renderHomeworkDetail();
  }
  if (id === 's-teacher-attendance') {
    renderTeacherAttendance();
  }
  if (id === 's-teacher-grades') {
    renderTeacherGrades();
  }
  if (id === 's-student-absence-history') {
    renderAbsenceHistory();
  }
  if (id === 's-student-absence-create') {
    fillAbsenceClassOptions();
  }
  if (id === 's-student-timetable') {
    renderStudentTimetable();
    renderStudentHomeworkDueSoon();
  }
  if (id === 's-student-exam-schedule') {
    renderStudentExamSchedule();
  }
  if (id === 's-student-tuition-detail') {
    renderTuition();
  }
  if (id === 's-student-payment-process') {
    renderStudentPaymentProcess();
  }
  if (id === 's-student-payment-confirm') {
    renderPaymentConfirm();
  }
  if (id === 's-student-payment-history') {
    renderPaymentHistory();
  }
  if (id === 's-student-notifications') {
    renderNotifications();
  }
  if (id === 's-teacher-notifications') {
    renderTeacherNotifications();
  }
  if (id === 's-staff-leave-approval') {
    renderStaffLeaveApproval();
  }
  if (id === 's-staff-invoice-manage') {
    renderInvoiceClassOptions();
    renderInvoiceClassPreview();
    renderStaffInvoiceList();
  }
  if (id === 's-timetable') {
    initScheduleForm();
  }
  if (id === 's-staff-notification-send') {
    renderInvoiceClassOptions();
    renderStaffNotificationHistory();
  }
  if (id === 's-student-profile') {
    renderStudentProfile();
  }
  const activeScreen = byId(id);
  if (activeScreen) {
    applyAccessibilityPolish(activeScreen);
  }
}

function bindEvents() {
  function on(id, eventName, handler) {
    const el = byId(id);
    if (el) {
      el.addEventListener(eventName, handler);
    }
  }

  on('btn-login-staff', 'click', function () {
    loginByRole('staff', 's-staff-home');
  });
  on('btn-login-teacher', 'click', function () {
    loginByRole('teacher', 's-teacher-dashboard');
  });
  on('btn-login-student', 'click', function () {
    loginByRole('student', 's-student-dashboard');
  });

  on('accountSearchInput', 'input', renderAccountTable);
  on('studentProfileSearchInput', 'input', renderStudentProfileTable);
  on('btnCreateAccount', 'click', createAccount);
  on('btnUpdateAccount', 'click', updateAccount);

  on('btnCreateClass', 'click', createClass);
  on('btnCreateClassInline', 'click', createClass);
  on('btnDeleteClass', 'click', deleteSelectedClass);
  on('btnAddStudentToClass', 'click', addStudentToClass);
  on('btnRemoveStudentFromClass', 'click', removeStudentByInput);
  on('btnSaveClassDetail', 'click', saveClassDetail);

  on('btnSubmitHomework', 'click', submitHomework);
  on('btnSubmitAbsence', 'click', submitAbsenceRequest);
  on('btnConfirmPayment', 'click', confirmPayment);
  on('btnTeacherAttendanceUpload', 'click', handleTeacherAttendanceUpload);
  on('btnTeacherDocUpload', 'click', saveTeacherDocument);
  on('btnTeacherHomeworkSave', 'click', saveTeacherHomework);
  on('btnOpenScheduleForm', 'click', function () {
    const panel = byId('staffScheduleForm');
    if (panel) {
      panel.classList.toggle('inline-hidden');
    }
  });
  on('btnOpenBulkImport', 'click', function () {
    const panel = byId('bulkImportPanel');
    if (panel) {
      panel.classList.toggle('inline-hidden');
      const old = byId('bulkImportPreviewWrap');
      if (old) {
        old.remove();
      }
    }
  });
  on('btnTeacherWeightConfig', 'click', openTeacherWeightModal);
  on('btnTeacherAddGradeColumn', 'click', addTeacherGradeColumn);
  on('btnTeacherGradeLock', 'click', lockTeacherGradeBook);
  on('btnTeacherGradeUpload', 'click', saveTeacherGrades);
}

function initLoginUxEnhancements() {
  const loginConfig = [
    { role: 'staff', target: 's-staff-home' },
    { role: 'teacher', target: 's-teacher-dashboard' },
    { role: 'student', target: 's-student-dashboard' }
  ];
  let i;
  for (i = 0; i < loginConfig.length; i++) {
    const cfg = loginConfig[i];
    const root = byId('s-login-' + cfg.role);
    if (!root) {
      continue;
    }
    const accountInput = root.querySelector('input[type="text"]');
    const passInput = root.querySelector('input[type="password"]');

    if (accountInput) {
      accountInput.addEventListener('input', function (event) {
        const input = event.target;
        input.value = input.value.toUpperCase();
        clearInputError(input);
      });
    }

    if (passInput) {
      passInput.addEventListener('input', function (event) {
        clearInputError(event.target);
      });
    }

    function submitOnEnter(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        loginByRole(cfg.role, cfg.target);
      }
    }

    if (accountInput) {
      accountInput.addEventListener('keydown', submitOnEnter);
    }
    if (passInput) {
      passInput.addEventListener('keydown', submitOnEnter);
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  initSkipLink();
  initModalAccessibility();
  initScreens();
  injectStaffLayouts();
  bindEvents();
  initLoginUxEnhancements();
  renderSideCalendars();
  renderTeacherSubjectDashboard();
  renderStudentSubjectDashboard();
  renderStudentDashboardWidgets();
  renderSubjectContextLabels();
  renderAccountTable();
  renderStudentProfileTable();
  renderClassGrid();
  renderClassDetail();
  renderStudentMaterialList();
  renderStudentHomeworkList();
  renderStudentClassDetailContent();
  renderHomeworkDetail();
  renderTeacherAttendance();
  renderAbsenceHistory();
  renderTuition();
  renderPaymentConfirm();
  renderPaymentHistory();
  renderNotifications();
  renderTeacherNotifications();
  renderStudentGrades();
  renderStudentTimetable();
  renderStudentExamSchedule();
  renderInvoiceClassOptions();
  renderInvoiceClassPreview();
  renderStaffLeaveApproval();
  renderStaffInvoiceList();
  renderStaffNotificationHistory();
  fillAbsenceClassOptions();
  renderStudentProfile();
  initScheduleForm();
  applyDynamicNavbars();
  applyAccessibilityPolish(document);
  renderStaffSidebarStats();
  renderActiveHeaderUser();
});
