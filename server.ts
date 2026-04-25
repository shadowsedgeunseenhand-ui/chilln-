import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// SF Chill Spots Database
const SPOT_DATABASE = [
  {
    id: "dolores-park",
    name: "Dolores Park (The Banana Belt)",
    neighborhood: "Mission",
    coords: { lat: 37.7596, lon: -122.4269 },
    exposure: "Sunny",
    description: "The classic SF sun-trap. High key the warmest pocket in the city.",
    fact: "Locals call it the Banana Belt because it stays hella sunny while the rest of the city gets hammered by fog."
  },
  {
    id: "ocean-beach",
    name: "Ocean Beach",
    neighborhood: "West Side",
    coords: { lat: 37.7600, lon: -122.5100 },
    exposure: "Windy/Cold",
    description: "Raw, vast, and often foggy. Great for bonfire vibes but dress for a storm.",
    fact: "It's nearly 3.5 miles long, making it SF's largest beach."
  },
  {
    id: "golden-gate-park",
    name: "Golden Gate Park",
    neighborhood: "Central",
    coords: { lat: 37.7690, lon: -122.4830 },
    exposure: "Mixed",
    description: "The city's backyard. Huge enough to find a sunny meadow or a foggy forest.",
    fact: "It is 20% larger than New York's Central Park."
  },
  {
    id: "precita-park",
    name: "Precita Park",
    neighborhood: "Bernal Heights",
    coords: { lat: 37.7473, lon: -122.4140 },
    exposure: "Sunny",
    description: "A mellow neighborhood strip. Mellow vibes and great coffee nearby.",
    fact: "It was once part of a creek that flowed through the Mission."
  },
  {
    id: "bernal-hill",
    name: "Bernal Hill",
    neighborhood: "Bernal Heights",
    coords: { lat: 37.7429, lon: -122.4146 },
    exposure: "Windy/Cold",
    description: "360-degree views to die for. It's a climb, but the high stoke is worth it.",
    fact: "The hill was used for dairy ranching until the early 1900s."
  },
  {
    id: "twin-peaks",
    name: "Twin Peaks",
    neighborhood: "Central",
    coords: { lat: 37.7544, lon: -122.4477 },
    exposure: "Windy/Cold",
    description: "The ultimate viewpoint. Usually windy, often foggy, always epic.",
    fact: "Known as 'Noe Peaks' until the 19th century."
  },
  {
    id: "baker-beach",
    name: "Baker Beach",
    neighborhood: "Presidio",
    coords: { lat: 37.7916, lon: -122.4827 },
    exposure: "Mixed",
    description: "Bridge views and crashing waves. Watch out for the north end—it's clothing optional.",
    fact: "It was the original site of the Burning Man festival."
  },
  {
    id: "presidio",
    name: "The Presidio",
    neighborhood: "North Side",
    coords: { lat: 37.7989, lon: -122.4662 },
    exposure: "Sheltered",
    description: "A former military base turned national park. Deep woods and hidden trails.",
    fact: "It was a military post for three different nations: Spain, Mexico, and the US."
  },
  {
    id: "alamo-square",
    name: "Alamo Square",
    neighborhood: "Western Addition",
    coords: { lat: 37.7763, lon: -122.4347 },
    exposure: "Sunny",
    description: "Home of the Painted Ladies. Iconic architecture and city skyline views.",
    fact: "The park used to be a major stop for horse-drawn wagons in the 1800s."
  },
  {
    id: "lafayette-park",
    name: "Lafayette Park",
    neighborhood: "Pacific Heights",
    coords: { lat: 37.7914, lon: -122.4279 },
    exposure: "Sheltered",
    description: "Manicured lawns and tennis courts. Very high-end energy.",
    fact: "It sits on one of the highest hills in SF, offering massive bay views."
  },
  {
    id: "alta-plaza",
    name: "Alta Plaza Park",
    neighborhood: "Pacific Heights",
    coords: { lat: 37.7909, lon: -122.4372 },
    exposure: "Mixed",
    description: "Tiered terraces and wide vistas. A prime spot for a sunset session.",
    fact: "The grand staircase was used in the 1972 film 'What's Up, Doc?'."
  },
  {
    id: "washington-square",
    name: "Washington Square Park",
    neighborhood: "North Beach",
    coords: { lat: 37.8003, lon: -122.4101 },
    exposure: "Sunny",
    description: "The heart of Little Italy. Coffee, focaccia, and people watching.",
    fact: "Established in 1847, it's one of the city's first parks."
  },
  {
    id: "buena-vista",
    name: "Buena Vista Park",
    neighborhood: "Haight-Ashbury",
    coords: { lat: 37.7686, lon: -122.4414 },
    exposure: "Sheltered",
    description: "Dense trees and winding paths. Feels like a secret forest in the city.",
    fact: "It is the oldest official park in San Francisco."
  },
  {
    id: "glen-canyon",
    name: "Glen Canyon Park",
    neighborhood: "Glen Park",
    coords: { lat: 37.7408, lon: -122.4440 },
    exposure: "Mixed",
    description: "Wild and rugged. Great for bouldering and catching a break from the city noise.",
    fact: "It contains one of the few remaining free-flowing creeks in SF."
  },
  {
    id: "mountain-lake",
    name: "Mountain Lake Park",
    neighborhood: "Presidio Heights",
    coords: { lat: 37.7876, lon: -122.4700 },
    exposure: "Sheltered",
    description: "A quiet lake on the edge of the Presidio. Very peaceful and family-friendly.",
    fact: "It is one of only three natural lakes remaining in San Francisco."
  },
  {
    id: "marina-green",
    name: "Marina Green",
    neighborhood: "Marina",
    coords: { lat: 37.8062, lon: -122.4382 },
    exposure: "Windy/Cold",
    description: "The classic yacht-club vibe. Windy as hell but the views are unbeatable.",
    fact: "It was once an airfield for the US Air Mail service."
  },
  {
    id: "lake-merced",
    name: "Lake Merced Park",
    neighborhood: "South West",
    coords: { lat: 37.7212, lon: -122.4862 },
    exposure: "Windy/Cold",
    description: "Massive lake for long walks and rowing vibes. Usually cooler than the rest of the city.",
    fact: "It used to be a freshwater lagoon separated by the ocean by sand dunes."
  },
  {
    id: "corona-heights",
    name: "Corona Heights Park",
    neighborhood: "Castro",
    coords: { lat: 37.7645, lon: -122.4390 },
    exposure: "Windy/Cold",
    description: "Red rock formations and panoramic views. A quick scramble for a high reward.",
    fact: "Known for its unique chert rock formations and native wildflowers."
  },
  {
    id: "st-marys",
    name: "St Mary's Square",
    neighborhood: "Chinatown",
    coords: { lat: 37.7925, lon: -122.4057 },
    exposure: "Sheltered",
    description: "A hidden rooftop oasis in the dense city. Very quiet and unexpectedly sun-drenched.",
    fact: "A statue of Sun Yat-sen resides in the park to commemorate his time in SF."
  },
  {
    id: "grandview",
    name: "Grandview Park (Turtle Hill)",
    neighborhood: "Inner Sunset",
    coords: { lat: 37.7562, lon: -122.4716 },
    exposure: "Windy/Cold",
    description: "Living up to its name. High elevation means big views and big wind.",
    fact: "The sand here is 140,000 years old, part of the ancient dune system."
  },
  {
    id: "stinson-beach",
    name: "Stinson Beach",
    neighborhood: "Marin Coast",
    coords: { lat: 37.8991, lon: -122.6444 },
    exposure: "Sunny",
    description: "The crown jewel of Marin. Long sandy stretches and rolling waves.",
    fact: "It's the perfect getaway when the city is socked in, but traffic on Hwy 1 is a mood."
  },
  {
    id: "muir-beach",
    name: "Muir Beach",
    neighborhood: "Marin Coast",
    coords: { lat: 37.8591, lon: -122.5811 },
    exposure: "Sheltered",
    description: "A locals' favorite cove. Quieter than Stinson and often sheltered from the worst winds.",
    fact: "The overlook nearby offers some of the best rolling vistas in the Bay Area."
  },
  {
    id: "mt-tam",
    name: "Mount Tamalpais State Park",
    neighborhood: "Marin Coast",
    coords: { lat: 37.9235, lon: -122.5965 },
    exposure: "Mixed",
    description: "Above the clouds. High elevation, rolling trails, and world-class beauty.",
    fact: "On a clear day, you can see all the way to the Sierra Nevada mountains."
  },
  {
    id: "tennessee-valley",
    name: "Tennessee Valley",
    neighborhood: "Marin Coast",
    coords: { lat: 37.8601, lon: -122.5298 },
    exposure: "Mixed",
    description: "A mellow hike to a hidden beach. Sheltered trails leading to a windy cove.",
    fact: "Named after the steamship Tennessee that wrecked here in 1853."
  },
  {
    id: "point-reyes",
    name: "Point Reyes National Seashore",
    neighborhood: "Marin Coast",
    coords: { lat: 38.0402, lon: -122.8611 },
    exposure: "Windy/Cold",
    description: "The edge of the world. Dramatic cliffs, foggy shores, and elk sightings.",
    fact: "It is one of the foggiest and windiest places on the US Pacific Coast."
  },
  {
    id: "linda-mar",
    name: "Linda Mar Beach",
    neighborhood: "Pacifica",
    coords: { lat: 37.5966, lon: -122.5025 },
    exposure: "Sunny",
    description: "Surf vibes and wider sands. Just south of the city and often clearer.",
    fact: "Home to what people call the 'World's Most Beautiful' Taco Bell."
  },
  {
    id: "salesforce-park",
    name: "Salesforce Park",
    neighborhood: "SoMa",
    coords: { lat: 37.7891, lon: -122.3965 },
    exposure: "Sheltered",
    description: "A floating forest 70 feet above the street. Surprisingly calm and warm.",
    fact: "It features a water fountain that is triggered by the movement of buses below."
  }
];

app.use(express.json());

// Weather Proxy Endpoint
// Zones for micro-climate reporting
const ZONES = [
  { id: 'west', name: 'West (Fog)', spot: 'Ocean Beach', lat: 37.7600, lon: -122.5100, hint: 'Baseline for cold' },
  { id: 'central', name: 'Central (Mixed)', spot: 'Golden Gate Park', lat: 37.7690, lon: -122.4830, hint: 'The In-Between' },
  { id: 'east', name: 'East (Sun)', spot: 'Dolores Park', lat: 37.7590, lon: -122.4270, hint: 'Goldilocks Zone' },
  { id: 'north', name: 'North (Wind)', spot: 'Crissy Field', lat: 37.8040, lon: -122.4660, hint: 'High wind alert' },
  { id: 'marin', name: 'Marin (Beaches)', spot: 'Stinson Beach', lat: 37.9004, lon: -122.6444, hint: 'Coastal Getaway' }
];

// Micro-climates endpoint
app.get("/api/micro-climates", async (req, res) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const dayOffset = parseInt(req.query.dayOffset as string || '0');

  const fetchZoneWeather = async (zone: typeof ZONES[0]) => {
    // Standard mock data offsets to ensure variation if API is down
    const offsets: Record<string, { t: number, w: number, c: string }> = {
      west: { t: -8, w: 15, c: 'Fog' },
      central: { t: -2, w: 5, c: 'Clouds' },
      east: { t: 8, w: -6, c: 'Clear' },
      north: { t: -1, w: 18, c: 'Windy' },
      marin: { t: 2, w: 10, c: 'Sunny' }
    };
    const zoneOffset = offsets[zone.id] || { t: 0, w: 0, c: 'Clear' };

    // If dayOffset > 0, we should really use forecast, but for simplicity and reliability 
    // we'll apply a predictable delta to the "current" baseline if API is down, 
    // or fetch forecast if API key exists.
    
    if (!apiKey) {
      // Mock data with day variation (temp tends to rise slightly in this mock forecast)
      return {
        ...zone,
        temp: 62 + zoneOffset.t + (dayOffset * 2),
        wind: Math.max(2, 8 + zoneOffset.w + (dayOffset * 3)),
        condition: dayOffset > 0 ? 'Partly Cloudy' : zoneOffset.c
      };
    }

    try {
      // For offsets, use the 5-day forecast API
      const endpoint = dayOffset === 0 ? 'weather' : 'forecast';
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/${endpoint}?lat=${zone.lat}&lon=${zone.lon}&units=imperial&appid=${apiKey}`
      );
      
      if (!response.ok) throw new Error("API Limit or Error");
      
      const data = await response.json();
      
      if (dayOffset === 0) {
        return {
          ...zone,
          temp: Math.round(data.main.temp),
          wind: Math.round(data.wind.speed),
          condition: data.weather[0].main
        };
      } else {
        // Find the slot for the forecast (8 slots per day)
        const forecastIndex = dayOffset * 8; 
        const dayData = data.list[forecastIndex] || data.list[data.list.length - 1];
        return {
          ...zone,
          temp: Math.round(dayData.main.temp),
          wind: Math.round(dayData.wind.speed),
          condition: dayData.weather[0].main
        };
      }
    } catch (e) {
      // Return varied fallback if API fails
      return { 
        ...zone, 
        temp: 60 + zoneOffset.t + (dayOffset * 2), 
        wind: Math.max(2, 10 + zoneOffset.w), 
        condition: zoneOffset.c 
      };
    }
  };

  try {
    const climateData = await Promise.all(ZONES.map(fetchZoneWeather));
    res.json(climateData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch micro-climates" });
  }
});

// Forecast Endpoint
app.get("/api/forecast", async (req, res) => {
  const { lat, lon } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    // Return mock 5-day forecast
    const mockForecast = Array.from({ length: 5 }).map((_, i) => ({
      dt: Math.floor(Date.now() / 1000) + (i * 86400),
      main: { temp: 65 + i, humidity: 50 },
      wind: { speed: 8 + i },
      weather: [{ main: "Clear", description: "mock sky" }]
    }));
    return res.json({ list: mockForecast });
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat || 37.7749}&lon=${lon || -122.4194}&units=imperial&appid=${apiKey}`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Forecast API failed" });
  }
});

app.get("/api/weather", async (req, res) => {
  const { lat, lon } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    // Return mock SF weather if no API key is provided
    return res.json({
      main: { temp: 68, humidity: 50 },
      wind: { speed: 8 },
      weather: [{ main: "Clear", description: "mock clear sky" }],
      name: "San Francisco (Mock)"
    });
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat || 37.7749}&lon=${lon || -122.4194}&units=imperial&appid=${apiKey}`
    );
    
    if (!response.ok) {
      // Fallback to mock if API returns error
      return res.json({
        main: { temp: 62, humidity: 65 },
        wind: { speed: 10 },
        weather: [{ main: "Clouds", description: "mock cloudy" }],
        name: "San Francisco (Mock Fallback)"
      });
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Weather error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "SF is too chaotic right now, try again." });
  }
});

// Spots Listing with filtering
app.get("/api/spots", (req, res) => {
  const { weatherCondition, windSpeed, duration } = req.query;
  
  let filtered = [...SPOT_DATABASE];
  const wind = parseFloat(windSpeed as string);
  const dur = parseFloat(duration as string);
  
  // Logic expansion:
  // If wind is low (< 10) and duration is high (> 4), prioritize Marin and South SF
  if (wind < 10 && (dur > 4 || isNaN(dur))) {
    filtered = filtered.sort((a, b) => {
      const isAOut = a.neighborhood === "Marin Coast" || a.neighborhood === "South of SF" || a.neighborhood === "Pacifica";
      const isBOut = b.neighborhood === "Marin Coast" || b.neighborhood === "South of SF" || b.neighborhood === "Pacifica";
      if (isAOut && !isBOut) return -1;
      if (!isAOut && isBOut) return 1;
      return 0;
    });
  }
  
  // Normal weather logic
  if (wind > 12) {
    filtered = filtered.sort((a, b) => {
      if (a.exposure === "Sheltered" && b.exposure !== "Sheltered") return -1;
      if (a.exposure !== "Sheltered" && b.exposure === "Sheltered") return 1;
      return Math.random() - 0.5;
    });
  } else if (weatherCondition === "Clear") {
    filtered = filtered.sort((a, b) => {
      if (a.exposure === "Sunny" && b.exposure !== "Sunny") return -1;
      if (a.exposure !== "Sunny" && b.exposure === "Sunny") return 1;
      return Math.random() - 0.5;
    });
  } else {
    // General shuffle if no strong condition
    filtered = filtered.sort(() => Math.random() - 0.5);
  }

  res.json(filtered);
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
