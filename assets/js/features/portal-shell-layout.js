function isStaffScreenId(id) {
  return id.indexOf('s-staff-') === 0 || id.indexOf('s-account-') === 0 || id.indexOf('s-class-') === 0 || id.indexOf('s-report') === 0 || id === 's-timetable' || id === 's-revenue' || id === 's-student-profile-search' || id === 's-student-profile-detail';
}

function isStudentScreenId(id) {
  return id.indexOf('s-student-') === 0;
}

function isTeacherScreenId(id) {
  return id.indexOf('s-teacher-') === 0;
}

function getScreenPortalRole(id) {
  if (isStaffScreenId(id)) {
    return 'staff';
  }
  if (isStudentScreenId(id)) {
    return 'student';
  }
  if (isTeacherScreenId(id)) {
    return 'teacher';
  }
  return '';
}

function getPortalHomeScreen(role) {
  if (role === 'staff') {
    return 's-staff-home';
  }
  if (role === 'teacher') {
    return 's-teacher-dashboard';
  }
  if (role === 'student') {
    return 's-student-dashboard';
  }
  return 's-landing';
}

function getPortalRoleSubtitle(role) {
  if (role === 'staff') {
    return 'nhân viên';
  }
  if (role === 'teacher') {
    return 'giáo viên';
  }
  if (role === 'student') {
    return 'học viên';
  }
  return 'khách';
}

function buildPortalHeaderHtml(role) {
  const home = getPortalHomeScreen(role);
  const subtitle = getPortalRoleSubtitle(role);
  return '<div class="header-left" data-inline-action="show(\'' + home + '\')">' +
    '<div class="logo-box"><div class="logo-fallback">TRUNG TÂM<br>StudyHome</div></div>' +
    '<div class="header-info"><h2>Hệ thống</h2><p>Trung tâm dạy học<br>Dành cho ' + subtitle + '</p></div>' +
    '</div>' +
    '<div class="header-right">' +
    '<div class="avatar-btn" data-inline-action="performLogout()"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></div>' +
    '</div>';
}

function applyDynamicHeaders() {
  const screens = document.querySelectorAll('.screen');
  let i;
  for (i = 0; i < screens.length; i++) {
    const sc = screens[i];
    const role = getScreenPortalRole(sc.id);
    if (!role) {
      continue;
    }
    const header = sc.querySelector('.header');
    if (!header) {
      continue;
    }
    const signature = role + '-v1';
    if (header.dataset.dynamicHeaderSignature === signature) {
      continue;
    }
    header.innerHTML = buildPortalHeaderHtml(role);
    header.dataset.dynamicHeaderSignature = signature;
  }
}

function getSelectedClassContext() {
  const c = getClassByCode(state.selectedClassCode) || db.classes[0];
  if (!c) {
    return {
      code: '',
      subject: 'Môn học',
      level: '',
      name: 'Chưa chọn lớp',
      teacherLabel: 'Chưa chọn lớp',
      studentLabel: 'Chưa chọn môn'
    };
  }
  return {
    code: c.code,
    subject: c.subject,
    level: c.level,
    name: c.name,
    teacherLabel: c.code + ' - ' + c.subject + (c.level ? (' (' + c.level + ')') : ''),
    studentLabel: c.code + ' - ' + c.subject
  };
}

function buildTeacherCalendarBox() {
  return '<div class="sb-box teacher-calendar-widget">' +
    '<div class="sb-title">Lịch</div>' +
    '<div class="student-calendar-toolbar">' +
    '<button class="student-calendar-nav" type="button" data-inline-action="shiftTeacherCalendarMonth(-1)" aria-label="Tháng trước">&lsaquo;</button>' +
    '<div class="cal-title teacher-calendar-title">Tháng....</div>' +
    '<button class="student-calendar-nav" type="button" data-inline-action="shiftTeacherCalendarMonth(1)" aria-label="Tháng sau">&rsaquo;</button>' +
    '</div>' +
    '<div class="cal-grid teacher-calendar-grid"></div>' +
    '</div>';
}

function buildTeacherSubjectNavBox(activeKey) {
  const ctx = getSelectedClassContext();
  const links = [
    { key: 'upload', label: 'Tải lên tài liệu', screen: 's-teacher-upload' },
    { key: 'homework', label: 'Tạo bài tập', screen: 's-teacher-homework' },
    { key: 'attendance', label: 'Điểm danh', screen: 's-teacher-attendance' },
    { key: 'grades', label: 'Bảng điểm', screen: 's-teacher-grades' }
  ];
  let html = '<div class="sb-box"><div class="sb-title">Điều hướng lớp học</div><div class="sb-lop">' + ctx.teacherLabel + '</div>';
  let i;
  for (i = 0; i < links.length; i++) {
    if (links[i].key === activeKey) {
      html += '<span class="sb-link sb-link-current">' + links[i].label + '</span>';
      continue;
    }
    html += '<span class="sb-link" data-inline-action="show(\'' + links[i].screen + '\')">' + links[i].label + '</span>';
  }
  html += '</div>';
  return html;
}

function buildStudentSubjectNavBox(activeKey) {
  const ctx = getSelectedClassContext();
  const links = [
    { key: 'materials', label: 'Xem tài liệu', screen: 's-student-materials' },
    { key: 'homework', label: 'Bài tập', screen: 's-student-homework-list' },
    { key: 'transcript', label: 'Xem bảng điểm', screen: 's-student-transcript' }
  ];
  let html = '<div class="ssb-box"><div class="ssb-title">Điều hướng môn học</div><div class="ssb-lop">' + ctx.studentLabel + '</div>';
  let i;
  for (i = 0; i < links.length; i++) {
    if (links[i].key === activeKey) {
      html += '<span class="ssb-link ssb-link-current">' + links[i].label + '</span>';
      continue;
    }
    html += '<span class="ssb-link" data-inline-action="show(\'' + links[i].screen + '\')">' + links[i].label + '</span>';
  }
  html += '</div>';
  return html;
}

function buildStudentDashboardSidebar() {
  return '<section class="student-dashboard-widget">' +
    '<div class="student-dashboard-widget-header">' +
    '<div><div class="student-dashboard-widget-title">Bài tập sắp đến hạn</div><div class="student-dashboard-widget-subtitle">Danh sách gần các bài chưa nộp</div></div>' +
    '</div>' +
    '<div class="student-dashboard-widget-body">' +
    '<div id="studentUpcomingAssignments" class="student-assignment-list"></div>' +
    '<button class="student-assignment-link" type="button" data-inline-action="show(\'s-student-homework-list\')">Xem tất cả</button>' +
    '</div>' +
    '</section>' +
    '<section class="student-dashboard-widget student-calendar-widget">' +
    '<div class="student-dashboard-widget-header">' +
    '<div><div class="student-dashboard-widget-title">Lịch</div><div class="student-dashboard-widget-subtitle">Xem theo tháng</div></div>' +
    '</div>' +
    '<div class="student-dashboard-widget-body">' +
    '<div class="student-calendar-toolbar">' +
    '<button class="student-calendar-nav" type="button" data-inline-action="shiftStudentCalendarMonth(-1)" aria-label="Tháng trước">&lsaquo;</button>' +
    '<div id="studentDashboardMonthLabel" class="student-calendar-month-label">April 2026</div>' +
    '<button class="student-calendar-nav" type="button" data-inline-action="shiftStudentCalendarMonth(1)" aria-label="Tháng sau">&rsaquo;</button>' +
    '</div>' +
    '<div id="studentDashboardMonthGrid" class="student-calendar-grid-compact"></div>' +
    '</div>' +
    '</section>';
}

function buildStudentClassDetailSidebar() {
  return '<section class="course-transcript-widget">' +
    '<div class="course-transcript-head">' +
    '<div class="course-transcript-title">Bảng điểm môn học</div>' +
    '<div class="course-transcript-subtitle">Chi tiết môn học đang xem</div>' +
    '</div>' +
    '<div class="course-transcript-body">' +
    '<div><div id="studentCourseWidgetSubject" class="course-transcript-subject">Toán</div><div id="studentCourseWidgetClass" class="course-transcript-meta">Lớp L01</div></div>' +
    '<div class="course-score-grid">' +
    '<div class="course-score-item"><div class="course-score-label">Điểm 1</div><div id="studentCourseWidgetScore1" class="course-score-value">-</div></div>' +
    '<div class="course-score-item"><div class="course-score-label">Điểm 2</div><div id="studentCourseWidgetScore2" class="course-score-value">-</div></div>' +
    '<div class="course-score-item"><div class="course-score-label">Điểm 3</div><div id="studentCourseWidgetScore3" class="course-score-value">-</div></div>' +
    '<div class="course-score-item"><div class="course-score-label">Trung bình</div><div id="studentCourseWidgetAverage" class="course-score-value">-</div></div>' +
    '</div>' +
    '<div class="course-trend-mini"><svg id="studentCourseWidgetChart" viewBox="0 0 300 118" width="100%" height="118" aria-label="Xu hướng điểm môn học"></svg><div id="studentCourseWidgetTrendStatus" class="course-trend-caption">Đang tải dữ liệu...</div></div>' +
    '<button class="course-transcript-link" type="button" data-inline-action="show(\'s-student-transcript\')">Xem bảng điểm tổng hợp</button>' +
    '</div>' +
    '</section>';
}

function applyDynamicSidebars() {
  const teacherMap = {
    's-teacher-dashboard': '',
    's-teacher-class-detail': 'class-detail',
    's-teacher-upload': 'upload',
    's-teacher-homework': 'homework',
    's-teacher-attendance': 'attendance',
    's-teacher-grades': 'grades'
  };
  const studentMap = {
    's-student-dashboard': 'dashboard',
    's-student-class-detail': 'class-detail',
    's-student-materials': 'materials',
    's-student-homework-list': 'homework',
    's-student-homework-detail': 'homework',
    's-student-transcript': 'transcript'
  };
  const ctx = getSelectedClassContext();
  const teacherIds = Object.keys(teacherMap);
  const studentIds = Object.keys(studentMap);
  let teacherChanged = false;
  let i;

  for (i = 0; i < teacherIds.length; i++) {
    const teacherScreen = byId(teacherIds[i]);
    if (!teacherScreen) {
      continue;
    }
    const teacherSidebar = teacherScreen.querySelector('.teacher-sidebar');
    if (!teacherSidebar) {
      continue;
    }
    const activeKey = teacherMap[teacherIds[i]];
    const sidebarHtml = (activeKey ? buildTeacherSubjectNavBox(activeKey) : '') + buildTeacherCalendarBox();
    const signature = teacherIds[i] + '|' + activeKey + '|' + ctx.code;
    if (teacherSidebar.dataset.dynamicSidebarSignature === signature) {
      continue;
    }
    teacherSidebar.innerHTML = sidebarHtml;
    teacherSidebar.dataset.dynamicSidebarSignature = signature;
    teacherChanged = true;
  }

  for (i = 0; i < studentIds.length; i++) {
    const studentScreen = byId(studentIds[i]);
    if (!studentScreen) {
      continue;
    }
    const studentSidebar = studentScreen.querySelector('.student-sidebar');
    if (!studentSidebar) {
      continue;
    }
    const activeKey = studentMap[studentIds[i]];
    const signature = studentIds[i] + '|' + activeKey + '|' + ctx.code;
    if (studentSidebar.dataset.dynamicSidebarSignature === signature) {
      continue;
    }
    if (activeKey === 'dashboard') {
      studentSidebar.innerHTML = buildStudentDashboardSidebar();
    } else if (activeKey === 'class-detail') {
      studentSidebar.innerHTML = buildStudentClassDetailSidebar();
    } else {
      studentSidebar.innerHTML = buildStudentSubjectNavBox(activeKey);
    }
    studentSidebar.dataset.dynamicSidebarSignature = signature;
  }

  if (teacherChanged && typeof renderSideCalendars === 'function') {
    renderSideCalendars();
  }
}

function applyDynamicBreadcrumbs() {
  const ctx = getSelectedClassContext();
  const map = {
    's-teacher-dashboard': '<span class="bc-text fw700">Tổng quan môn học</span>',
    's-teacher-class-detail': '<span class="bc-link" data-inline-action="show(\'s-teacher-dashboard\')">Tổng quan môn học</span><span class="bc-text" id="teacherSelectedSubjectLabel"> - ' + ctx.subject + '</span>',
    's-teacher-upload': '<span class="bc-link" data-inline-action="show(\'s-teacher-class-detail\')">' + ctx.subject + ' - Tải tài liệu</span>',
    's-teacher-homework': '<span class="bc-link" data-inline-action="show(\'s-teacher-class-detail\')">' + ctx.subject + ' - Tạo bài tập</span>',
    's-teacher-attendance': '<span class="bc-link" data-inline-action="show(\'s-teacher-class-detail\')">Điểm danh - ' + ctx.subject + '</span>',
    's-teacher-grades': '<span class="bc-link" data-inline-action="show(\'s-teacher-class-detail\')">Bảng điểm - ' + ctx.subject + '</span>',
    's-student-dashboard': '<span class="bc-text fw700">Tổng quan môn học</span>',
    's-student-class-detail': '<span class="bc-link" data-inline-action="show(\'s-student-dashboard\')">Tổng quan môn học</span><span class="bc-text" id="studentSelectedSubjectLabel"> - ' + ctx.subject + '</span>',
    's-student-materials': '<span class="bc-link" data-inline-action="show(\'s-student-dashboard\')">Tổng quan môn học</span><span class="bc-text"> - </span><span class="bc-link" id="studentCrumbSubjectMaterials" data-inline-action="show(\'s-student-class-detail\')">' + ctx.subject + '</span><span class="bc-text"> - Xem tài liệu</span>',
    's-student-homework-list': '<span class="bc-link" data-inline-action="show(\'s-student-dashboard\')">Tổng quan môn học</span><span class="bc-text"> - </span><span class="bc-link" id="studentCrumbSubjectHomeworkList" data-inline-action="show(\'s-student-class-detail\')">' + ctx.subject + '</span><span class="bc-text"> - Bài tập</span>',
    's-student-homework-detail': '<span class="bc-link" data-inline-action="show(\'s-student-dashboard\')">Tổng quan môn học</span><span class="bc-text"> - </span><span class="bc-link" id="studentCrumbSubjectHomeworkDetail" data-inline-action="show(\'s-student-class-detail\')">' + ctx.subject + '</span><span class="bc-text"> - Bài tập</span>',
    's-student-transcript': '<span class="bc-link" data-inline-action="show(\'s-student-dashboard\')">Học tập</span><span class="bc-text"> - Bảng điểm tổng hợp</span>'
  };
  const ids = Object.keys(map);
  let i;
  for (i = 0; i < ids.length; i++) {
    const screen = byId(ids[i]);
    if (!screen) {
      continue;
    }
    const breadcrumb = screen.querySelector('.breadcrumb');
    if (!breadcrumb) {
      continue;
    }
    const signature = ids[i] + '|' + ctx.code;
    if (breadcrumb.dataset.dynamicBreadcrumbSignature === signature) {
      continue;
    }
    breadcrumb.innerHTML = map[ids[i]];
    breadcrumb.dataset.dynamicBreadcrumbSignature = signature;
    breadcrumb.classList.remove('breadcrumb-refresh');
    void breadcrumb.offsetWidth;
    breadcrumb.classList.add('breadcrumb-refresh');
  }
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
    if (isStaffScreenId(id)) {
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
        '<button class="nav-btn ' + (active.home ? 'active' : '') + '" data-inline-action="show(\'s-staff-home\')">Trang chủ</button>' +
        '<button class="nav-btn ' + (active.account ? 'active' : '') + '" data-inline-action="show(\'s-account-list\')">Tài khoản</button>' +
        '<button class="nav-btn ' + (active.profile ? 'active' : '') + '" data-inline-action="show(\'s-student-profile-search\')">Hồ sơ học viên</button>' +
        '<button class="nav-btn ' + (active.classManage ? 'active' : '') + '" data-inline-action="show(\'s-class-manage\')">Lớp học</button>' +
        '<button class="nav-btn ' + (active.timetable ? 'active' : '') + '" data-inline-action="show(\'s-timetable\')">Thời khóa biểu</button>' +
        '<button class="nav-btn ' + (active.leave ? 'active' : '') + '" data-inline-action="show(\'s-staff-leave-approval\')">Duyệt đơn nghỉ</button>' +
        '<button class="nav-btn ' + (active.invoice ? 'active' : '') + '" data-inline-action="show(\'s-staff-invoice-manage\')">Quản lý học phí</button>' +
        '<button class="nav-btn ' + (active.notify ? 'active' : '') + '" data-inline-action="show(\'s-staff-notification-send\')">Thông báo</button>' +
        '<button class="nav-btn ' + (active.revenue ? 'active' : '') + '" data-inline-action="show(\'s-revenue\')">Thống kê doanh thu</button>' +
        '<button class="nav-btn ' + (active.report ? 'active' : '') + '" data-inline-action="show(\'s-report\')">Báo cáo</button>';
      continue;
    }
    if (isStudentScreenId(id)) {
      const active2 = {
        learning: id === 's-student-dashboard' || id === 's-student-class-detail' || id === 's-student-materials' || id === 's-student-homework-list' || id === 's-student-homework-detail',
        transcript: id === 's-student-transcript',
        timetable: id === 's-student-timetable' || id === 's-student-exam-schedule',
        absence: id.indexOf('s-student-absence') === 0,
        tuition: id.indexOf('s-student-tuition') === 0 || id.indexOf('s-student-payment') === 0,
        notify: id === 's-student-notifications'
      };
      nav.innerHTML =
        '<button class="nav-btn ' + (active2.learning ? 'active' : '') + '" data-inline-action="show(\'s-student-dashboard\')">Học tập</button>' +
        '<button class="nav-btn ' + (active2.transcript ? 'active' : '') + '" data-inline-action="show(\'s-student-transcript\')">Bảng điểm</button>' +
        '<button class="nav-btn ' + (active2.timetable ? 'active' : '') + '" data-inline-action="show(\'s-student-timetable\')">Thời khóa biểu</button>' +
        '<button class="nav-btn ' + (active2.absence ? 'active' : '') + '" data-inline-action="show(\'s-student-absence\')">Đơn xin nghỉ</button>' +
        '<button class="nav-btn ' + (active2.tuition ? 'active' : '') + '" data-inline-action="show(\'s-student-tuition\')">Thông tin học phí</button>' +
        '<button class="nav-btn ' + (active2.notify ? 'active' : '') + '" data-inline-action="show(\'s-student-notifications\')">Thông báo</button>' +
        '<button class="nav-btn">Ngôn ngữ</button><button class="nav-search">Tìm kiếm</button>';
      continue;
    }
    if (isTeacherScreenId(id)) {
      const teacher = getCurrentTeacher();
      const unread = teacher ? getUnreadNotificationCount(teacher.id, 'teacher') : 0;
      const notifyText = unread > 0 ? ('Thông báo (' + unread + ')') : 'Thông báo';
      const isNotify = id === 's-teacher-notifications';
      nav.innerHTML =
        '<button class="nav-btn ' + (!isNotify ? 'active' : '') + '" data-inline-action="show(\'s-teacher-dashboard\')">Tổng quan</button>' +
        '<button class="nav-btn ' + (isNotify ? 'active' : '') + '" data-inline-action="show(\'s-teacher-notifications\')">' + notifyText + '</button>' +
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
    if (!navSearchButtons[i].dataset.quickSearchBound) {
      navSearchButtons[i].addEventListener('click', function () {
        openQuickSearch('');
      });
      navSearchButtons[i].dataset.quickSearchBound = '1';
    }
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

  const clickableNodes = scope.querySelectorAll('div[onclick], span[onclick], div[data-inline-action], span[data-inline-action]');
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

