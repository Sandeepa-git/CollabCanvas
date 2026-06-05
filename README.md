# CollabCanvas Pro

CollabCanvas Pro is an enterprise-grade AI collaboration mood board and semantic analysis platform. It synthesizes unstructured collaboration logs, chat histories, and team voice recordings into visual interactive concept maps, theme clouds, and semantic vector clusters in real-time.

## Key Features

- **Dynamic Concept Mapping**: Visualizes meeting narratives, connections, and relationship links between themes using custom-designed radial layouts and nodes.
- **Theme Clouds**: Computes and scales text elements based on semantic importance and sentiment weights.
- **Real-Time Collaboration Feed**: Upvote key themes and leave custom annotations on the workspace.
- **Voice Transcription**: Integrates with Azure Speech Services to convert team conversation logs into workspace notes.
- **Ensemble Analysis**: Integrates multiple state-of-the-art LLMs (via OpenRouter and Gemini native fallbacks) to process text inputs.
- **History Gallery**: Browse, filter, and restore previous AI-generated mood board workspaces from local history.
- **Dual Theme Support**: Beautiful glassmorphic UI matching the latest design systems, fully optimized for both Light Mode and Dark Mode with high contrast readability.

## Tech Stack

- **Framework**: Next.js 15
- **Styling**: Tailwind CSS & Vanilla CSS Variables
- **Visual Mapping**: React Flow
- **Typographies**: Inter & Plus Jakarta Sans
- **Developer Tools**: TypeScript, ESLint, RipGrep

## Getting Started

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your local environment variables in `.env.local`.
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.
