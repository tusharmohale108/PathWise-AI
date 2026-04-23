<div align="center">
</div>

# 🎯 PathWise AI: Tactical Learning Architect

**PathWise AI** is an adaptive learning platform designed to transform vague goals into hyper-personalized, actionable roadmaps. Powered by **Gemini AI**, it doesn't just list tasks—it architects a learning journey that evolves with your progress, mood, and mastery.

## ✨ Key Features

*   **AI Roadmap Generation**: Instantly generate a multi-phase learning path for any skill or goal.
*   **Tactical Progress Tracking**: Mark tasks as "Mastered" to see your growth visualized in real-time.
*   **Adaptive Learning**: Built-in mood and focus checks that allow the AI to calibrate your path if you're struggling or ready for a challenge.
*   **Mastery Quizzes**: Validate your knowledge at the end of each module with AI-generated assessments.
*   **Secure Infrastructure**: Full multi-goal support with private user data isolation via Firebase.

## 🛠️ The Tech Stack

- **Framework**: [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Intelligence**: [Google Gemini Pro API](https://ai.google.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Feedback/UI**: [Framer Motion](https://www.framer.com/motion/) + [Lucide Icons](https://lucide.dev/)
- **Backend & Auth**: [Firebase](https://firebase.google.com/) (Firestore & Auth)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Google AI Studio API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/pathwise-ai.git
   cd pathwise-ai
2. **Install dependencies:**
   ```bash
   npm install

3. **Set up environment variables:**
   Create a .env file in the root directory:<br>
   Env
   ```bash
   VITE_GEMINI_API_KEY=your_api_key_here
5. **Run the development server:**
   ```bash
   npm run dev
🛡️ Security
This project uses Attribute-Based Access Control (ABAC) rules in Firestore to ensure users can only access their own tactical matrices and progress data.


`ai` `react` `typescript` `learning-path` `generative-ai` `gemini-api` `roadmap` `firebase` `tailwindcss` `personal-development`
