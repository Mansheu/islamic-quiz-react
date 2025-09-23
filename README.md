# Islamic Quiz App 🕌# React + TypeScript + Vite



An interactive Islamic knowledge quiz application built with React, TypeScript, and Firebase. Test your knowledge of Islamic teachings, compete with others on the leaderboard, and track your progress over time.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



## ✨ FeaturesCurrently, two official plugins are available:



- **Interactive Quiz**: Multiple choice questions covering various Islamic topics- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh

- **User Authentication**: Secure login and registration system- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

- **Leaderboard**: Compete with other users and see your ranking

- **Progress Tracking**: Track your quiz scores and improvement over time## Expanding the ESLint configuration

- **Admin Dashboard**: Administrative interface for managing content

- **Responsive Design**: Works seamlessly on desktop and mobile devicesIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

- **Dark/Light Theme**: Toggle between themes for comfortable viewing

```js

## 🚀 Live Demoexport default defineConfig([

  globalIgnores(['dist']),

Visit the live application: [https://islamic-quiz-react.vercel.app/]  {

    files: ['**/*.{ts,tsx}'],

## 🛠️ Technologies Used    extends: [

      // Other configs...

- **Frontend**: React 18, TypeScript, Vite

- **Backend**: Firebase (Authentication, Firestore Database)      // Remove tseslint.configs.recommended and replace with this

- **Styling**: CSS3 with custom components      tseslint.configs.recommendedTypeChecked,

- **Deployment**: Vercel      // Alternatively, use this for stricter rules

      tseslint.configs.strictTypeChecked,

## 📱 How to Use      // Optionally, add this for stylistic rules

      tseslint.configs.stylisticTypeChecked,

1. **Sign Up/Login**: Create an account or log in with existing credentials

2. **Take Quiz**: Answer Islamic knowledge questions      // Other configs...

3. **View Results**: See your score and correct answers    ],

4. **Check Leaderboard**: Compare your performance with other users    languageOptions: {

5. **Track Progress**: Monitor your improvement over time      parserOptions: {

        project: ['./tsconfig.node.json', './tsconfig.app.json'],

## 🎯 Quiz Topics        tsconfigRootDir: import.meta.dirname,

      },

- Quran and Hadith      // other options...

- Islamic History    },

- Pillars of Islam  },

- Islamic Ethics and Morals])

- Prophet Muhammad (PBUH) and Companions```

- Islamic Jurisprudence (Fiqh)

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

## 🏆 Getting Started (For Developers)

```js

1. **Clone the repository**// eslint.config.js

   ```bashimport reactX from 'eslint-plugin-react-x'

   git clone https://github.com/Mansheu/islamic-quiz-react.gitimport reactDom from 'eslint-plugin-react-dom'

   cd islamic-quiz-react

   ```export default defineConfig([

  globalIgnores(['dist']),

2. **Install dependencies**  {

   ```bash    files: ['**/*.{ts,tsx}'],

   npm install    extends: [

   ```      // Other configs...

      // Enable lint rules for React

3. **Set up Firebase configuration**      reactX.configs['recommended-typescript'],

   Create a `.env` file and add your Firebase config:      // Enable lint rules for React DOM

   ```      reactDom.configs.recommended,

   VITE_FIREBASE_API_KEY=your_api_key    ],

   VITE_FIREBASE_AUTH_DOMAIN=your_domain    languageOptions: {

   VITE_FIREBASE_PROJECT_ID=your_project_id      parserOptions: {

   VITE_FIREBASE_STORAGE_BUCKET=your_bucket        project: ['./tsconfig.node.json', './tsconfig.app.json'],

   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id        tsconfigRootDir: import.meta.dirname,

   VITE_FIREBASE_APP_ID=your_app_id      },

   ```      // other options...

    },

4. **Run development server**  },

   ```bash])

   npm run dev```

   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**May Allah bless your learning journey! 🤲**