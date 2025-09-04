# On-Chain Sunset Beauty Calculator

This is a project for the [Algorand hackathon: AI meets Blockchain](https://luma.com/be27ik5w?tk=68T2qF) that took place on 3-4 September 2025 in [W3Hub](https://w3hub.berlin/), Berlin, Germany.

The project is a full-stack decentralized application built on Algorand that calculates sunset beauty probability using AI-powered weather analysis and features an interactive map interface with photo sharing capabilities.

The demo of this web app is deployed [here](https://sunsetting.vercel.app/) to Vercel.

## Project Overview

This fork extends the original AlgoKit QuickStartTemplate with a Sunset Beauty Calculator frontend application. The main changes are in the frontend project (`projects/QuickStartTemplate-frontend/`), which transforms the basic dApp template into an interactive sunset prediction and photo-sharing platform.

## Key Features

- **AI-Powered Sunset Analysis**: Uses OpenAI GPT models to analyze weather data and predict sunset quality
- **Interactive Mapbox Integration**: Full-screen map interface with location-based sunset predictions
- **Photo Upload & IPFS Storage**: Users can upload sunset photos with geolocation markers
- **Leaderboard System**: Community-driven ranking of sunset photos with voting mechanism
- **Wallet Integration**: Support for multiple Algorand wallets (Pera, Defly, Exodus, KMD)
- **Real-time Weather Data**: Integration with BrightSky weather API for accurate forecasting

## Prerequisites

- Python 3.12+
- AlgoKit CLI - Install following the https://github.com/algorandfoundation/algokit-cli#install
- Docker - Required for local Algorand development
- Node.js 20.0+ and npm 9.0+

## Additional API Keys Required

- OpenAI API Key - For sunset quality analysis
- Mapbox Token - For interactive map functionality

## Setup

### Initial Setup

1. Clone this repository to your local machine
2. Install AlgoKit and ensure Docker is running
3. Run algokit project bootstrap all in the project directory
4. Create .env file in projects/QuickStartTemplate-frontend/ with:
   ```bash
   VITE_OPENAI_API_KEY=your_openai_api_key
   VITE_MAPBOX_TOKEN=your_mapbox_token
   VITE_OPENAI_MODEL=gpt-4o-mini
   ```
5. For smart contracts: algokit generate `env-file -a target_network localnet` from the contracts directory
6. Build the project: `algokit project run build`

## Development

- Start frontend development server: `npm run dev` (from frontend directory)
- The app will automatically generate TypeScript clients from smart contract artifacts
- Smart contracts are located in `projects/QuickStartTemplate-contracts/`
- Frontend application is in `projects/QuickStartTemplate-frontend/`

## Frontend Architecture

The frontend is built with React 18 + TypeScript + Vite and includes:

- React Router - Multi-page navigation (Home, Leaderboard)
- Tailwind CSS + daisyUI - Responsive styling framework
- MapboxGL - Interactive mapping functionality
- AlgoKit Utils - Algorand blockchain integration
- TxnLab Use-Wallet - Multi-wallet support

## Key Components

- `HeroSection.tsx` - Main sunset calculator interface with location detection
- `MapFullScreen.tsx` - Interactive map with photo markers and predictions
- `Leaderboard.tsx` - Community photo ranking system
- `PhotoUpload.tsx` - IPFS-based photo storage with metadata
- `FlipCard.tsx` - Animated sunset prediction display

## API Integrations

- OpenStreetMap Nominatim - Geocoding and reverse geocoding
- BrightSky Weather API - Hourly weather data for sunset predictions
- OpenAI API - AI-powered sunset quality analysis
- Mapbox Maps API - Interactive map rendering

## Deployment

The project supports automated deployment via GitHub Actions:

- Smart contracts deploy to TestNet via AlgoKit
- Frontend can be deployed to Netlify, Vercel, or similar platforms
- Environment variables must be configured in deployment settings

---

Built with https://github.com/algorandfoundation/algokit-cli • Algorand Blockchain • React • TypeScript

