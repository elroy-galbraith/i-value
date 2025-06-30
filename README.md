# i-Valu Lite: AI-Powered Property Valuation

Welcome to i-Valu Lite, a modern, AI-enhanced platform for real estate valuation. This application leverages generative AI to analyze property images, estimate market values, find comparable properties, and generate IVS-compliant valuation reports.

## Key Features

-   **Interactive Map Selection**: Easily select properties using an interactive map with search and autocomplete.
-   **AI Image Evaluation**: Upload property photos to get an objective aesthetic and condition score from a Genkit AI flow.
-   **Automated Value Estimation**: Utilizes an external machine learning service to provide a data-driven price range (min, median, max).
-   **Comparable Property Search**: Finds similar properties on the market to support the valuation.
-   **IVS-Compliant Report Generation**: Prompts an LLM to generate a comprehensive, professional valuation report following International Valuation Standards.
-   **PDF Export**: Download the complete report, including maps and images, as a PDF.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (with App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
-   **AI Integration**: [Genkit](https://firebase.google.com/docs/genkit)
-   **Mapping**: [Google Maps Platform](https://mapsplatform.google.com/)
-   **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Environment Variables

Before running the application, you need to set up your environment variables.

1.  Create a `.env` file in the root of the project.

2.  Add your Google Maps API key to the `.env` file. You will need to enable the **Maps JavaScript API**, **Places API**, and **Static Map API** in your Google Cloud project.
    ```env
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
    ```

### Running the Application

i-Valu Lite requires two processes to run concurrently: the Next.js web server and the Genkit AI development server.

1.  **Start the Genkit Dev Server:**
    Open a terminal and run:
    ```bash
    npm run genkit:dev
    ```
    This will start the Genkit development UI, which you can typically access at `http://localhost:4000`.

2.  **Start the Next.js Dev Server:**
    In a separate terminal, run:
    ```bash
    npm run dev
    ```
    This will start the web application, which you can access at `http://localhost:9002`.

## Project Structure

Here is an overview of the key directories and files:

```
.
├── src
│   ├── app/                      # Next.js App Router pages and layouts
│   │   ├── (app)/                # Protected app routes (dashboard, valuation tool)
│   │   │   ├── layout.tsx
│   │   │   └── ...
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Public landing page
│   ├── ai/                       # Genkit AI configuration and flows
│   │   ├── flows/                # Genkit flow definitions
│   │   │   ├── evaluate-room-flow.ts
│   │   │   └── generate-report-flow.ts
│   │   └── genkit.ts             # Genkit plugin and model configuration
│   ├── components/               # Reusable React components
│   │   ├── ui/                   # ShadCN UI components
│   │   ├── app-shell.tsx         # Main application layout with sidebar
│   │   ├── map-view.tsx          # Interactive map component
│   │   └── valuation-form.tsx    # Core multi-step valuation tool
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utility functions and static data
│   └── services/                 # Functions for interacting with external APIs
│       └── property-api.ts       # Server action for property estimation/search
├── public/                       # Static assets
├── .env                          # Environment variables (needs to be created)
├── next.config.ts                # Next.js configuration
└── tailwind.config.ts            # Tailwind CSS configuration
```

## How It Works: The AI Flows

The core AI functionality is powered by Genkit flows located in `src/ai/flows/`.

-   **`evaluate-room-flow.ts`**: Takes an image of a property (as a data URI) and prompts an LLM to return a short description and an aesthetic score from 1-10. This provides an objective measure of the property's condition and appeal.

-   **`generate-report-flow.ts`**: This is the final step. It aggregates all the collected data (property details, image evaluations, price estimates, comparables) and uses a detailed prompt to instruct an LLM to draft a formal valuation report that adheres to the International Valuation Standards (IVS).
