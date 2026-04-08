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
  scheduleAppSnapshotSave();
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
  scheduleAppSnapshotSave();
  toast('Đổi mật khẩu thành công.');
}

