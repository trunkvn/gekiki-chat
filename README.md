# Gekiki Chat - AI Assistant Platform

**Gekiki Chat** là một ứng dụng chatbot AI hiện đại được xây dựng trên nền tảng Next.js, tích hợp sức mạnh của mô hình Google Gemini để cung cấp trải nghiệm tương tác thông minh, đa phương thức và mượt mà.

## 🚀 Tính năng nổi bật

- **Tương tác đa phương thức (Multimodal):**
  - Hỗ trợ gửi tin nhắn văn bản.
  - Đọc và phân tích hình ảnh (Paste trực tiếp, Upload file hoặc Kéo & Thả).
  - Hỗ trợ đọc tệp PDF và file văn bản (.txt).
- **Quản lý phiên trò chuyện thông minh:**
  - Lưu lịch sử chat theo từng người dùng (tích hợp Clerk Auth).
  - **Ghim (Pin) chat:** Giúp giữ các cuộc hội thoại quan trọng luôn ở trên cùng.
  - Đổi tên tiêu đề tự động dựa trên nội dung tin nhắn đầu tiên.
- **Trải nghiệm người dùng cao cấp:**
  - Giao diện Dark Mode sang trọng với hiệu ứng kính (Glassmorphism).
  - Sidebar linh hoạt: Có thể thu gọn để tối ưu không gian làm việc.
  - Nhập liệu bằng giọng nói (Voice Input).
  - Streaming response: AI phản hồi theo thời gian thực.
- **Bảo mật:** Tích hợp Clerk để quản lý đăng nhập và bảo vệ dữ liệu người dùng.

## 🛠 Nền tảng công nghệ

- **Framework:** [Next.js 16+ (App Router)](https://nextjs.org/)
- **Ngôn ngữ:** TypeScript
- **Styling:** Tailwind CSS
- **AI Engine:** [Google Gemini API](https://ai.google.dev/)
- **Authentication:** [Clerk](https://clerk.com/)
- **Icons:** Custom SVG Icons
- **State Management:** React Hooks (useState, useEffect, useCallback)

## 📦 Cài đặt và Chạy thử

### 1. Cài đặt các gói phụ thuộc

```bash
npm install
```

### 2. Cấu hình biến môi trường

Tạo file `.env` ở thư mục gốc và chuẩn bị các khóa sau:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
# Lưu ý: GEMINI_API_KEY hiện đang được cấu hình trong service (Nên đưa vào .env để bảo mật hơn)
```

### 3. Chạy server phát triển

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt để bắt đầu trải nghiệm.

## 🎨 Thiết kế

Dự án tập trung vào tính thẩm mỹ với bảng màu Zinc/Gray trung tính, các hiệu ứng animation mượt mà (animate-in, fade-in, slide-in) và bố cục responsive hoàn hảo trên cả Mobile và Desktop.

---

_Phát triển bởi Đội ngũ Gekiki._
