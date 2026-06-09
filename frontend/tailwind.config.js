/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Tema Terang (Clean & Light SaaS)
        background: "#f8fafc", // Abu-abu sangat terang
        surface: "#ffffff",    // Putih murni
        surface_hover: "#f1f5f9", // Saat card dihover
        border: "#e2e8f0",
        foreground: "#0f172a", // Teks gelap navy
        muted: "#64748b",
        primary: {
          DEFAULT: "#2563eb", // Biru profesional
          hover: "#1d4ed8",
        },
        danger: "#ef4444",
        success: "#10b981",
        warning: "#f59e0b"
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'floating': '0 10px 40px -10px rgba(0, 0, 0, 0.08)',
        'active-btn': '0 4px 14px 0 rgba(0, 0, 0, 0.05)', // Shadow khusus tombol aktif
      }
    },
  },
  plugins: [],
}
