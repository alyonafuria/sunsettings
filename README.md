# On-Chain Sunset Beauty Calculator

This is a project for the [Algorand hackathon: AI meets Blockchain](https://luma.com/be27ik5w?tk=68T2qF) that took place on 3-4 September 2025 in [W3Hub](https://w3hub.berlin/), Berlin, Germany.

The project is a full-stack decentralized application built on Algorand that calculates sunset beauty probability using AI-powered weather analysis and features an interactive map interface with photo sharing capabilities.

The demo of this web app is deployed [here](sunsettings-algo.vercel.app) to Vercel.




## Project Overview

This project calculates the probability of a beautiful sunset based on the user's geolocation and weather conditions. Users can upload sunset photos to the interactive map, vote for the best photos, and receive rewards in Algo cryptocurrency for winning submissions.

**AI Sunset Calculation Process**: The system uses OpenAI GPT models with a sophisticated scoring algorithm that analyzes weather data including:
- cloud cover percentages, 
- precipitation, 
- humidity, 
- atmospheric conditions.
The AI calculates a 0-100 sunset beauty probability by applying weighted factors: base scoring from:
- total cloud cover (optimal 30-50%), 
- rain penalties, 
- humidity sweet spots, 
- haze dampening,
- overcast caps, 
- then generates concise descriptions of key atmospheric drivers. 

## Key Features

- **AI-Powered Sunset Analysis**: Uses OpenAI GPT models to analyze weather data and predict sunset quality
- **Interactive Mapbox Integration**: Full-screen map interface with location-based sunset predictions
- **Photo Upload & IPFS Storage**: Users can upload sunset photos with geolocation markers
- **Real-time Weather Data**: Integration with BrightSky and Open Weather weather APIs for accurate forecasting


This project is licensed under the Apache License 2.0. 