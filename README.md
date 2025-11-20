# ArcHorizon.ai

ArcHorizon is an AI-powered architectural design platform that transforms text descriptions and rough sketches into professional, editable 2D/3D CAD blueprints.

## Features

*   **Conversational AI Architect**: Consult with a specialized agent to refine your requirements.
*   **Generative Design Engine**: Create detailed floor plans instantly.
*   **2D/3D Editor**: Real-time visualization with professional CAD styling.
*   **Export**: Download projects as DXF (AutoCAD), PDF, or SVG.
*   **SaaS Platform**: Dashboard, History, and Project Management.

## Getting Started

### Prerequisites

*   Node.js (v18+)
*   Google Gemini API Key

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root directory and add your API key:
    ```env
    API_KEY=your_google_gemini_api_key
    ```

### Development

Start the local development server:

```bash
npm run dev
```

### Build

Build for production:

```bash
npm run build
```

## Architecture

*   **Frontend**: React, TypeScript, Vite
*   **State Management**: Zustand
*   **Styling**: Tailwind CSS
*   **3D Engine**: Three.js / React Three Fiber
*   **AI**: Google Gemini Multimodal API

## License

Proprietary software. All rights reserved.
