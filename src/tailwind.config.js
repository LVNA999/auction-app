// tailwind.config.js
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,jsx}"
    ],
    theme: {
      extend: {
        animation: {
          "fade-in": "fadeIn 0.5s ease-in-out",
        },
        keyframes: {
          fadeIn: {
            "0%": { opacity: "0", transform: "scale(0.95)" },
            "100%": { opacity: "1", transform: "scale(1)" },
          },
        },
      },
    },
    plugins: [],
  };
  