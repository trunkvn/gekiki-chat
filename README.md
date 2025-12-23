# Gekiki Chat - AI Assistant Platform

**Gekiki Chat** is a modern AI chatbot application built on Next.js, integrating the power of Google Gemini models to provide intelligent, multi-modal, and seamless interactive experiences.

## 🚀 Key Features

- **Multi-modal Interaction:**
  - Support for text messages.
  - Image analysis (Direct Paste, Upload, or Drag & Drop).
  - PDF and text file (.txt) reading support.
- **Smart Chat Session Management:**
  - Per-user chat history (Clerk Auth integration).
  - **Pin Chats:** Keep important conversations at the top.
  - Automatic title generation based on the first message.
- **Premium User Experience:**
  - Elegant Dark Mode with Glassmorphism effects.
  - Responsive Sidebar: Collapsible to optimize workspace.
  - Voice Input (Speech-to-text).
  - Streaming responses: Real-time AI interaction.
- **Security:** Integrated Clerk for user management and data protection.

## 🛠 Tech Stack

- **Framework:** [Next.js 15+ (App Router)](https://nextjs.org/)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI Engine:** [Google Gemini API](https://ai.google.dev/)
- **Authentication:** [Clerk](https://clerk.com/)
- **Icons:** Custom SVG Icons
- **State Management:** React Hooks (useState, useEffect, useCallback)

## 📦 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory and prepare the following keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
# Note: GEMINI_API_KEY is currently configured in the service (should be moved to .env for security)
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start.

## 🎨 Design

The project focuses on aesthetics with a neutral Zinc/Gray color palette, smooth animations (animate-in, fade-in, slide-in), and fully responsive layout for both Mobile and Desktop.

---

_Developed by trunk._
