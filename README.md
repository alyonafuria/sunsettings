# sunsettings


The project is a full-stack decentralized application built on Algorand that estimates the probability of a beautiful sunset using AI-guided weather analysis, with an interactive Mapbox map and optional photo sharing pinned to IPFS via Pinata.

The demo of this web app is deployed [here](https://sunsettings-algo.vercel.app) on Vercel.




## Project Overview

This project calculates the probability of a beautiful sunset based on the user's geolocation and weather conditions. Users can upload sunset photos to the interactive map and explore recent community uploads.

Important behavior: predictions are shown only before local sunset. After local sunset time at the selected location, the app intentionally does not display a prediction.

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

- **AI-powered sunset analysis** using OpenAI models over real-time weather data
- **Interactive Mapbox map** with location-aware sunset previews and photo markers
- **Photo upload to IPFS (Pinata)** with basic metadata for map display
- **Weather integration** via BrightSky (and compatible providers) for hourly conditions


This project is licensed under the Apache License 2.0. 