# TokenLens — Interactive LLM Token Probability & Branching Visualizer

**TokenLens** is an interactive, visual exploration tool for Large Language Model (LLM) next-token probabilities, log-probabilities ($\ln P$), and sampling behavior powered by Google Gemini.

Instead of treating LLM text generation as an opaque black box, TokenLens exposes the model's token-by-token decision distribution, allowing you to inspect confidence levels, observe alternative token candidates, and dynamically branch generations in real time.

---

## ✨ Features

- **Interactive Next-Token Exploration**: See generated tokens color-coded according to the model's confidence:
  - 🟢 **Very High ($\ge 80\%$)**: Emerald
  - 🔵 **High ($50\% - 79\%$)**: Sky Blue
  - 🟡 **Moderate ($25\% - 49\%$)**: Amber
  - 🔴 **Low ($< 25\%$)**: Rose / Coral
- **Hover for Alternatives**: Hover over any token to reveal competing token candidates considered by the model, complete with exact probability percentages and rank.
- **Dynamic Stream Branching**: Click any candidate token (original or alternative) to append the prompt up to that step, swap in the chosen token, and immediately re-generate a new stream from that exact divergence point.
- **Sampling Controls**:
  - **Tokens to Generate**: Customize sequence length from `1` to `60` tokens.
  - **Temperature ($0.0 \rightarrow 2.0$)**: Adjust sampling sharpness from deterministic greedy argmax (`0.0`) to wild creativity (`2.0`).
  - **Top-K ($1 \rightarrow 100$)**: Constrain candidate sampling pools to the top $K$ most likely tokens.
- **Unified Sentence Flow**: Displays the original prompt seamlessly prepended to the generated sequence for full contextual readability.
- **Lively Modern UI**: Ambient frosted glass styling, smooth micro-interactions, responsive parameter popovers, and an animated loading state.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Backend / Server**: [Express](https://expressjs.com/), [Node.js](https://nodejs.org/), [tsx](https://github.com/privatenumber/tsx)
- **AI Integration**: [@google/genai SDK](https://www.npmjs.com/package/@google/genai) with Google Gemini models
- **Build Tool**: [Vite 6](https://vitejs.dev/)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/tokenlens.git
   cd tokenlens
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (based on `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key:
   ```env
   GEMINI_API_KEY="your-gemini-api-key-here"
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 How It Works

1. **Prompt Submission**: You enter a text prompt into the central prompt box.
2. **Parameters**: Configure your desired sequence length, temperature, and top-K pool using the bottom parameter buttons.
3. **Model Generation & Logprobs**: The Express backend sends the request to the Gemini API (`@google/genai`) with logprobs and alternative candidate distribution retrieval.
4. **Interactive Response**: The frontend renders the complete prompt and highlights each generated token by confidence.
5. **Branching**: Hovering over any token opens a popover displaying top alternatives. Clicking any alternative automatically updates the prompt and re-triggers generation starting from that token.

---

## 📜 Available Scripts

- `npm run dev`: Starts the Express server with Vite middleware in development mode on port 3000.
- `npm run build`: Compiles and bundles frontend assets with Vite for production.
- `npm run start`: Runs the production server (`tsx server.ts`).
- `npm run lint`: Performs TypeScript compilation checks (`tsc --noEmit`).

---

## 📄 License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
