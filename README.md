# StudyHome LMS - Static Web Portal

## Giới thiệu

**StudyHome LMS** là một hệ thống quản lý trung tâm học tập được xây dựng hoàn toàn dưới dạng web tĩnh (static web). Dự án này phục vụ cho các vai trò: học viên, giáo viên, nhân viên trung tâm, với các chức năng quản lý học phí, điểm số, lịch sử thanh toán, thông báo, bài tập, v.v.

- **Công nghệ:** HTML, CSS, JavaScript thuần, không sử dụng backend động.
- **Triển khai:** Có thể chạy trực tiếp trên bất kỳ máy chủ web tĩnh nào (VD: GitHub Pages, Vercel, Netlify, hoặc máy chủ nội bộ).
- **Không yêu cầu cài đặt server backend hoặc database động.**

## Cấu trúc thư mục

```
QLTT_Web/
├── studyhome_index.html         # Trang chính, entry point
├── assets/
│   ├── css/                    # Toàn bộ file CSS chia module
│   ├── js/                     # Toàn bộ file JS chia module
│   └── images/                 # Ảnh logo, tài nguyên tĩnh
├── docs/                       # Tài liệu, swagger API (nếu có)
└── tests/                      # Test tự động (e2e)
```

## Hướng dẫn sử dụng

### 1. Chạy thử trên máy tính cá nhân
- Chỉ cần giải nén/copy toàn bộ thư mục `QLTT_Web` vào máy.
- Mở file `studyhome_index.html` bằng trình duyệt Chrome, Edge, Firefox...
- Không cần cài đặt thêm bất kỳ phần mềm nào.

### 2. Triển khai lên máy chủ web tĩnh
- Upload toàn bộ thư mục lên hosting tĩnh (VD: GitHub Pages, Vercel, Netlify, Firebase Hosting...)
- Đảm bảo file entry là `studyhome_index.html`.
- Đường dẫn tài nguyên (CSS, JS, ảnh) giữ nguyên cấu trúc thư mục.

### 3. Quản trị & sử dụng
- Đăng nhập theo vai trò (học viên, giáo viên, nhân viên) để sử dụng các chức năng tương ứng.
- Dữ liệu demo được lưu trữ tạm thời trên LocalStorage trình duyệt (không có backend thực).
- Để reset dữ liệu, xóa cache/trình duyệt hoặc dùng chức năng reset (nếu có trên giao diện).

## Lưu ý quan trọng
- Đây là web tĩnh, KHÔNG có xử lý backend thực, KHÔNG bảo mật đăng nhập thực tế.
- Mọi dữ liệu chỉ lưu tạm trên trình duyệt, không dùng cho môi trường sản xuất thực tế.
- Phù hợp cho demo, thử nghiệm, hoặc làm mẫu giao diện.

## Đóng góp & phát triển
- Fork, clone repo và chỉnh sửa trực tiếp các file HTML/CSS/JS.
- Có thể mở rộng thêm chức năng, giao diện, hoặc tích hợp backend thật nếu cần.

## Liên hệ
- Tác giả: Kannar04 (Lê Trung Phong)
- Đóng góp, phản hồi: [manhle240406@gmail.com]

---
