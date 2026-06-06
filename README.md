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
3. Copy environment settings from `.env.example` to `.env.local` and fill in your keys.
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

CollabCanvas Pro supports a hybrid AI stack plus Microsoft IQ grounding.

- `GEMINI_API_KEY` — Google Gemini API key for direct Gemini analysis.
- `GEMINI_MODEL` — Gemini model name (default `gemini-1.5-flash`).
- `GEMINI_EMBEDDING_MODEL` — Gemini embedding model for semantic vectors.
- `OPENROUTER_API_KEY` — OpenRouter API key for cross-model LLM orchestration.
- `OPENROUTER_BASE_URL` — Base URL for OpenRouter.
- `OPENROUTER_MODEL` — OpenRouter model name.
- `AZURE_SPEECH_KEY` — Azure Speech Service key for audio transcription.
- `AZURE_SPEECH_REGION` — Azure Speech Service region.
- `WORK_IQ_ENDPOINT` — Microsoft Work IQ endpoint for extracting participants, deadlines, and topics.
- `WORK_IQ_API_KEY` — Work IQ authorization key.
- `FABRIC_IQ_ENDPOINT` — Microsoft Fabric IQ endpoint for semantic group enrichment.
- `FABRIC_IQ_API_KEY` — Fabric IQ authorization key.
- `FOUNDRY_IQ_ENDPOINT` — Microsoft Foundry IQ endpoint for grounded knowledge retrieval.
- `FOUNDRY_IQ_API_KEY` — Foundry IQ authorization key.
- `AZURE_OPENAI_ENDPOINT` — Azure OpenAI endpoint for GPT-based analysis fallback.
- `AZURE_OPENAI_API_KEY` — Azure OpenAI API key.
- `AZURE_OPENAI_DEPLOYMENT_NAME` — Azure deployment name for the chosen OpenAI model.

The app will surface the connectivity status for OpenRouter, Azure Speech, Work IQ, Fabric IQ, and Foundry IQ in the workspace UI.