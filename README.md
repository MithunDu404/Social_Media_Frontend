<h1 align="center">Social Media Frontend 🎨</h1>

<p align="center">
  <a href="https://social-media-frontend-dusky-omega.vercel.app"><strong>Live Application</strong></a> | 
  <a href="https://github.com/MithunDu404/Social_Media_Backend"><strong>Backend Repository</strong></a>
</p>

<p align="center">
  A highly responsive, modern frontend for a full-stack social media application. Designed with top-tier UI aesthetics including dark mode, glassmorphism, and seamless interactions to provide an engaging user experience.
</p>

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Library:** [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) & custom primitive components
- **Icons:** [Lucide React](https://lucide.dev/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) (for global client state)
- **Data Fetching & Caching:** [TanStack React Query](https://tanstack.com/query/latest) & Axios
- **Authentication:** [@react-oauth/google](https://github.com/MomenSherif/react-oauth) & Custom JWT
- **Theming:** `next-themes` (Light/Dark Mode)

---

## ✨ Features

- **💎 Modern Aesthetic:** Stunning, contemporary UI leveraging dark mode, subtle gradients, glassmorphism, and micro-animations for a premium feel.
- **🚀 Ultra-Fast Interactions:** Optimistic UI updates Powered by React Query ensure likes, comments, and interactions feel instantaneous.
- **🔐 Seamless Authentication:** Features Google OAuth integration alongside traditional JWT handling using secure HTTP cookies.
- **🖼️ Secure Media Uploads:** Client-side integration for Cloudinary using purely backend-signed tokens, keeping secrets 100% hidden.
- **📱 Responsive Layout:** Perfectly scales from wide-screen desktop displays to portrait mobile devices.
- **💬 Social Ecosystem:** Includes full support for feeds, contextual comments, nested replies, profiles, direct messaging, and notifications.

---

## 📂 Project Architecture

```text
/app             # Next.js 16 App Router (pages, layouts, globals)
/components      # Reusable UI components (buttons, modals, post cards)
/lib             # Utility functions
/store           # Zustand global state (auth store, theme store, etc.)
/types           # TypeScript interfaces and definitions
/public          # Static assets (images, icons)
```

---

## 🚀 Getting Started

Follow these instructions to get the frontend running locally.

### Prerequisites

- **Node.js**: `v18` or higher
- **npm** or **yarn** or **pnpm**
- The [Social Media Backend](https://github.com/MithunDu404/Social_Media_Backend) should ideally be running locally to fully test data fetching.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MithunDu404/Social_Media_Frontend.git
   cd Social_Media_Frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or `pnpm install` if you prefer
   ```

### Environment Configuration

Create a `.env` or `.env.local` file in the root directory. You will need to configure variables based on your setup:

```env
# The URL where your backend is hosted (local or production)
NEXT_PUBLIC_API_URL="http://localhost:4000"

# Google OAuth Client ID for sign-in
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
```

### Running the App

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The page will hot-reload as you make edits to the code.

---

## ☁️ Deployment

This frontend is optimized for seamless deployment to [Vercel](https://vercel.com/). 

Simply connect your repository to Vercel and ensure your environment variables (`NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`) are properly set in the Vercel dashboard.

---

## 📝 Design Philosophy

This project prioritizes both **Developer Experience (DX)** and **User Experience (UX)**. 
- **Zustand** is used for simple, boilerplate-free global state (like holding the current user profile). 
- **React Query** handles all asynchronous server state (fetching feeds, polling notifications), virtually eliminating the need for complex `useEffect` data fetching logic.
- **Tailwind v4** enables rapid, component-scoped styling without leaving the TSX files.
