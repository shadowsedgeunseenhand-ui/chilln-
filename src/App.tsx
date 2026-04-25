/**
 * Chillin' - SF Location Recommendation App
 * Built with React, Tailwind, and Google Gemini AI
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { 
  Wind, 
  Sun, 
  Cloud, 
  Navigation, 
  MapPin, 
  Clock, 
  Bike, 
  Bus, 
  Footprints, 
  Camera, 
  Dog, 
  BookOpen, 
  ShoppingBag,
  Sparkles,
  RefreshCw,
  Car,
  Users,
  IceCream,
  Tent,
  Mountain,
  Trees,
  CloudSun,
  WindArrowDown,
  Layout,
  Armchair,
  Briefcase,
  Refrigerator,
  Map as MapIcon
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini for our SF Local Guide persona
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Spot {
  id: string;
  name: string;
  neighborhood: string;
  coords: { lat: number; lon: number };
  exposure: string;
  description: string;
  fact: string;
}

interface WeatherData {
  main: { temp: number; humidity: number };
  wind: { speed: number };
  weather: [{ main: string; description: string }];
}

interface ClimateZone {
  id: string;
  name: string;
  spot: string;
  lat: number;
  lon: number;
  hint: string;
  temp: number;
  wind: number;
  condition: string;
}

export default function App() {
  // State for user inputs
  const [location, setLocation] = useState('San Francisco');
  const [timeRange, setTimeRange] = useState('Today');
  const [startTime, setStartTime] = useState(13); // Default 1:00 PM (13:00)
  const [chillDuration, setChillDuration] = useState(2);
  const [peopleCount, setPeopleCount] = useState(1);
  const [transport, setTransport] = useState<string[]>(['Walk']);
  const [preferences, setPreferences] = useState<string[]>(['Sweet Rays']);
  const [gear, setGear] = useState<string[]>([]);
  const [needs, setNeeds] = useState('');

  // App state
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [climates, setClimates] = useState<ClimateZone[]>([]);
  const [recommendations, setRecommendations] = useState<Spot[]>([]);
  const [guideOutput, setGuideOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'details' | 'map'>('details');

  // Fetch weather on mount
  useEffect(() => {
    fetchWeather();
    fetchForecast();
  }, []);

  // Sync climates with timeRange
  useEffect(() => {
    const dayOffset = timeRange === 'Today' ? 0 : timeRange === 'Tomorrow' ? 1 : 2;
    fetchClimates(dayOffset);
  }, [timeRange]);

  const fetchWeather = async () => {
    try {
      const response = await fetch('/api/weather?lat=37.7749&lon=-122.4194');
      if (!response.ok) throw new Error('Weather API failed');
      const data = await response.json();
      setWeather(data);
    } catch (err) {
      console.error(err);
      setError("SF is too chaotic right now, try again.");
    }
  };

  const fetchForecast = async () => {
    try {
      const response = await fetch('/api/forecast?lat=37.7749&lon=-122.4194');
      if (!response.ok) throw new Error('Forecast API failed');
      const data = await response.json();
      setForecast(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClimates = async (offset = 0) => {
    try {
      const response = await fetch(`/api/micro-climates?dayOffset=${offset}`);
      if (!response.ok) throw new Error('Micro-climate API failed');
      const data = await response.json();
      setClimates(data);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:00 ${period}`;
  };

  const getSelectedDayWeather = () => {
    if (!forecast || !forecast.list) return weather;
    
    // index 0 is roughly now, 8 is tomorrow, 16 is day after (3hr intervals)
    const dayIndex = timeRange === 'Today' ? 0 : timeRange === 'Tomorrow' ? 8 : 16;
    const dayData = forecast.list[dayIndex];
    
    if (!dayData) return weather;
    
    return {
      main: dayData.main,
      wind: dayData.wind,
      weather: dayData.weather,
      name: `San Francisco (${timeRange})`
    };
  };

  const activeWeather = getSelectedDayWeather();

  const getChillScoreUI = (score: number) => {
    // Score 0-10
    // Color scale: red (0) -> yellow (5) -> bright green (10)
    const hue = Math.min(Math.max((score / 10) * 120, 0), 120);
    return {
      score,
      color: `hsl(${hue}, 80%, 50%)`,
      label: score > 8 ? 'ELITE' : score > 6 ? 'SOLID' : score > 4 ? 'MELLOW' : 'ROUGH'
    };
  };

  const calculateGlobalScore = (w: WeatherData | null) => {
    if (!w) return 5;
    // Temp 65 is ideal (10), drops as it goes away
    const tempScore = Math.max(0, 10 - Math.abs(65 - w.main.temp) / 2);
    // Wind < 5 is ideal (10), drops
    const windScore = Math.max(0, 10 - w.wind.speed / 2);
    return Math.round(((tempScore + windScore) / 2) * 10) / 10;
  };

  const chillScore = getChillScoreUI(calculateGlobalScore(activeWeather));

  const findTheMove = async () => {
    setIsLoading(true);
    setError(null);
    setGuideOutput('');
    setRecommendations([]);

    try {
      // 1. Fetch filtered spots based on current weather and duration
      const durationVal = chillDuration > 8 ? 24 : chillDuration; // Open hang acts like full day
      const weatherParam = weather 
        ? `weatherCondition=${weather.weather[0].main}&windSpeed=${weather.wind.speed}&duration=${durationVal}` 
        : `duration=${durationVal}`;
      
      const spotsRes = await fetch(`/api/spots?${weatherParam}`);
      if (!spotsRes.ok) throw new Error('Failed to fetch spots');
      const spots: Spot[] = await spotsRes.json();
      
      // We'll take top results
      const topSpots = spots.slice(0, 3);
      setRecommendations(topSpots);

      // 2. Generate persona response using Gemini
      const prompt = `
        You are an 'SF Local Guide'. Your vibe is: hospitality-modern, low key, hella, laid back, high stoke, feelin some type of way.
        Current Weather: ${activeWeather?.weather[0].main}, ${activeWeather?.main.temp}°F, Wind: ${activeWeather?.wind.speed}mph.
        User inputs:
        - When: ${timeRange} starting around ${formatTime(startTime)}
        - Session Length: ${chillDuration > 8 ? "Open Hang" : chillDuration + " hours"}
        - People: ${peopleCount}
        - Transport: ${transport.join(', ')}
        - Preferred vibes: ${preferences.join(', ')}
        - Rigup (Gear): ${gear.join(', ')}
        - Needs on the way: ${needs}

        Recommend the following spot: ${topSpots[0].name} in the ${topSpots[0].neighborhood}.
        Exposure level: ${topSpots[0].exposure}.
        Unique fact: ${topSpots[0].fact}.

        Task: Write a short, conversational response explaining why this spot is THE one for today.
        Crucial Rule: Do NOT include any "SF Local Guide:" label or quotes. 
        Crucial Rule: Start the response directly with the word "Yo".
        Crucial Rule: If the spot is Dolores Park, refer to it as "The Banana Belt" for comedy.
        Keep it under 150 words. Use hospitality-modern slang combined with local flavor. Keep it short and funny.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setGuideOutput(result.text || '');
    } catch (err) {
      console.error(err);
      setError("SF is too chaotic right now, try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2D0B5A] text-white font-sans selection:bg-[#00E5FF] selection:text-[#2D0B5A] flex flex-col md:flex-row h-screen overflow-hidden">
      
      {/* Sidebar - User Inputs */}
      <aside className="w-full md:w-96 bg-[#1A0638] border-r border-[#00E5FF]/20 flex flex-col p-8 gap-8 shadow-2xl overflow-y-auto">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#00E5FF] rounded-2xl flex items-center justify-center text-3xl font-black italic shadow-lg shadow-[#00E5FF]/30 text-[#2D0B5A] font-display">sf</div>
          <h1 className="text-3xl font-black tracking-tighter uppercase font-display italic">chilln'</h1>
        </div>

        <div className="space-y-6">
          {/* Starting Location */}
          <section>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#00E5FF]/60 font-bold mb-2">Starting Location</label>
            <div className="relative group">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00E5FF]/40 group-focus-within:text-[#00E5FF] transition-colors" />
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-[#2D0B5A]/50 border border-[#00E5FF]/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] text-sm font-medium"
              />
            </div>
          </section>

          {/* When to hang */}
          <section>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#00E5FF]/60 font-bold mb-2 font-sans">Which Day?</label>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {['Today', 'Tomorrow', 'The Day After'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={`py-3 rounded-xl text-[10px] font-bold transition-all border font-sans ${
                    timeRange === t 
                    ? 'bg-[#00E5FF] border-[#00E5FF] text-[#2D0B5A] shadow-lg shadow-[#00E5FF]/20 scale-[1.02]' 
                    : 'bg-[#2D0B5A] border-[#00E5FF]/10 hover:border-[#00E5FF]/40 text-white/60'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Session Start Time Slider */}
            <div className="flex justify-between items-center mb-4">
              <label className="text-[10px] uppercase tracking-[0.2em] text-[#00E5FF]/60 font-bold font-sans">Session Start Time</label>
              <span className="text-xl font-black font-display text-[#00E5FF] italic">{formatTime(startTime)}</span>
            </div>
            <div className="relative h-12 flex items-center px-4 bg-white/5 rounded-2xl border border-white/10 group overflow-hidden">
              <input
                type="range"
                min="6"
                max="22"
                step="1"
                value={startTime}
                onChange={(e) => setStartTime(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00E5FF] relative z-10"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#00E5FF]/5 to-transparent pointer-events-none transition-transform duration-500" 
                   style={{ transform: `translateX(${(startTime - 6) * 5}%)` }}></div>
            </div>
            <div className="flex justify-between mt-2 px-1">
              <span className="text-[8px] font-black uppercase text-white/20">6 AM</span>
              <span className="text-[8px] font-black uppercase text-white/20">10 PM</span>
            </div>
          </section>

          {/* Session Length */}
          <section>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#00E5FF]/60 font-bold">How long of a session?</label>
              <span className="text-xs font-bold text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 rounded-lg">{chillDuration > 8 ? "Open Hang" : chillDuration + "h"}</span>
            </div>
            <div className="relative py-4">
              <input 
                type="range" 
                min="0.5" 
                max="9" 
                step="0.5"
                value={chillDuration}
                onChange={(e) => setChillDuration(parseFloat(e.target.value))}
                className="w-full accent-[#00E5FF] cursor-pointer"
              />
              <div className="flex justify-between mt-2 text-[9px] uppercase tracking-widest text-[#00E5FF]/30 font-bold">
                <span>Duck In</span>
                <span>The Deep Chill</span>
                <span>Open Hang</span>
              </div>
            </div>
          </section>

          {/* Number of People */}
          <section>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#00E5FF]/60 font-bold">Number of people</label>
              <span className="text-xs font-bold text-[#00E5FF]">{peopleCount === 10 ? '10+' : peopleCount}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              step="1"
              value={peopleCount}
              onChange={(e) => setPeopleCount(parseInt(e.target.value))}
              className="w-full accent-[#00E5FF] cursor-pointer"
            />
          </section>

          {/* Transport */}
          <section>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#00E5FF]/60 font-bold mb-2">Transport</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'Walk', icon: Footprints },
                { id: 'Bike', icon: Bike },
                { id: 'Drive', icon: Car },
                { id: 'Transit', icon: Bus }
              ].map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTransport(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                    transport.includes(id) 
                      ? 'bg-[#00E5FF] border-[#00E5FF] text-[#2D0B5A]' 
                      : 'border-[#00E5FF]/10 bg-[#2D0B5A] text-white/50 hover:border-[#00E5FF]/30'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {id}
                </button>
              ))}
            </div>
          </section>

          {/* Preferences */}
          <section>
             <div className="flex justify-between items-baseline mb-3">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-[#00E5FF]/60 font-black font-sans">PREFERENCES</label>
                <span className="text-[9px] text-white/30 italic">Target Vibe</span>
             </div>
             <div className="grid grid-cols-2 gap-2">
               {[
                 { id: 'Sweet Rays', label: 'Sweet Rays', icon: Sun, color: '#FFD700' },
                 { id: 'Shade', label: 'Shade', icon: CloudSun, color: '#A9A9A9' },
                 { id: 'Kite Wind', label: 'Kites', icon: WindArrowDown, color: '#00E5FF' },
                 { id: 'Big Beach', label: 'Big Beach', icon: Navigation, color: '#40E0D0' },
                 { id: 'Coved Beach', label: 'Coved Beach', icon: MapPin, color: '#20B2AA' },
                 { id: 'Rolling Vistas', label: 'Rolling Vistas', icon: Mountain, color: '#8FBC8F' },
                 { id: 'Greenery', label: 'Forest Bathing', icon: Trees, color: '#32CD32' },
                 { id: 'Benches', label: 'Bunkers & Valleys', icon: Tent, color: '#CD853F' }
               ].map(({ id, label, icon: Icon, color }) => (
                 <button
                   key={id}
                   onClick={() => setPreferences(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])}
                   className={`group flex items-center justify-between px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden ${
                     preferences.includes(id) 
                       ? 'bg-white/10 border-[#00E5FF] text-white' 
                       : 'border-white/5 bg-[#2D0B5A] text-white/30 hover:border-white/20 hover:bg-white/5'
                   }`}
                 >
                   <div className="flex items-center gap-3 relative z-10">
                     <Icon className="w-4 h-4 transition-transform group-hover:scale-110" style={{ color: preferences.includes(id) ? color : 'inherit' }} />
                     <span>{label}</span>
                   </div>
                   {preferences.includes(id) && (
                     <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
                   )}
                 </button>
               ))}
             </div>
          </section>

          {/* Physical Rigup */}
          <section>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#00E5FF]/60 font-black mb-3">GEAR RIG UP</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'Dogs', icon: Dog },
                { id: 'Frisbee', icon: Sparkles },
                { id: 'Chair', icon: Armchair },
                { id: 'Blanket', icon: ShoppingBag },
                { id: 'Small Cooler', icon: Briefcase },
                { id: 'Big Cooler', icon: Refrigerator },
                { id: 'Book', icon: BookOpen },
                { id: 'Camera', icon: Camera }
              ].map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setGear(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id])}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                    gear.includes(id) 
                      ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-white shadow-[0_0_15px_rgba(0,229,255,0.2)]' 
                      : 'border-white/5 bg-[#2D0B5A] text-white/30 hover:border-white/20'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {id}
                </button>
              ))}
            </div>
          </section>

  {/* Needs */}
          <section>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#00E5FF]/60 font-bold mb-2"> grab on the way... wine beer coffee sandos...</label>
            <input
              type="text"
              placeholder="bi-rite pints, sourdough, haze..."
              value={needs}
              onChange={(e) => setNeeds(e.target.value)}
              className="w-full bg-[#2D0B5A]/50 border border-[#00E5FF]/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] text-xs font-medium"
            />
          </section>

          <div className="pt-4">
            <button
              onClick={findTheMove}
              disabled={isLoading}
              className="w-full bg-[#00E5FF] hover:bg-[#33EAFF] transition-all py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#00E5FF]/20 text-[#1A0638] disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-3 font-display italic"
            >
              {isLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <><Navigation className="w-5 h-5 fill-current" /> WHAT IS THE MOVE?</>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 md:p-14 overflow-y-auto bg-[#2D0B5A] relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00E5FF]/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
        <AnimatePresence mode="wait">
          {!recommendations.length ? (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex flex-col items-center justify-center text-center relative z-10"
            >
              <div className="max-w-4xl w-full">
                 <div className="flex flex-col items-center mb-12">
                    {activeWeather ? (
                      <div className="flex flex-col items-center gap-6">
                        <div className="flex items-center gap-8 bg-white/5 px-10 py-6 rounded-[2.5rem] border border-white/10 backdrop-blur-2xl transition-all hover:bg-white/10">
                          <div className="text-left">
                            <p className="text-[10px] uppercase tracking-[0.4em] text-[#00E5FF] font-black mb-2">CITY CLIMATE ({timeRange})</p>
                            <div className="flex items-center gap-4">
                              <Cloud className="w-10 h-10 text-[#00E5FF]" />
                              <p className="text-5xl font-light font-display">SF · <span className="font-bold">{activeWeather.main.temp}°F</span></p>
                            </div>
                          </div>
                          
                          <div className="h-16 w-px bg-white/10 hidden md:block"></div>
                          
                          <div className="text-center bg-white/5 px-6 py-4 rounded-3xl border border-white/10">
                            <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-black mb-2">CHILL SCORE</p>
                            <div className="flex flex-col items-center">
                              <span className="text-4xl font-black font-display tracking-tighter" style={{ color: chillScore.color }}>
                                {chillScore.score}
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{chillScore.label}</span>
                            </div>
                          </div>
                        </div>

                        {/* Micro-Climates Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 w-full mt-6">
                          {climates.map(zone => {
                            const zoneScore = Math.round((Math.max(0, 10 - Math.abs(65 - zone.temp) / 2) + Math.max(0, 10 - zone.wind / 2)) / 2 * 10) / 10;
                            const zoneUI = getChillScoreUI(zoneScore);
                            
                            // SVG Gauge calculations
                            const radius = 32;
                            const circumference = 2 * Math.PI * radius;
                            const offset = circumference - (zoneScore / 10) * circumference;

                            return (
                              <div key={zone.id} className="bg-white/5 border border-white/10 p-5 rounded-[2.5rem] text-center group hover:bg-[#00E5FF]/10 transition-all flex flex-col items-center gap-4 border-b-4" style={{ borderBottomColor: zoneUI.color }}>
                                <div className="space-y-1">
                                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00E5FF]">{zone.name}</h4>
                                  <p className="text-sm font-black font-display italic leading-tight">{zone.spot}</p>
                                </div>

                                <div className="relative w-24 h-24 flex items-center justify-center">
                                  <svg className="w-full h-full -rotate-90 transform">
                                    <circle
                                      cx="48"
                                      cy="48"
                                      r={radius}
                                      stroke="currentColor"
                                      strokeWidth="8"
                                      fill="transparent"
                                      className="text-white/5"
                                    />
                                    <motion.circle
                                      initial={{ strokeDashoffset: circumference }}
                                      animate={{ strokeDashoffset: offset }}
                                      transition={{ duration: 1.5, ease: "easeOut" }}
                                      cx="48"
                                      cy="48"
                                      r={radius}
                                      stroke={zoneUI.color}
                                      strokeWidth="8"
                                      strokeDasharray={circumference}
                                      strokeLinecap="round"
                                      fill="transparent"
                                      style={{ filter: `drop-shadow(0 0 6px ${zoneUI.color}88)` }}
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                                    <span className="text-2xl font-black font-display leading-none">{zoneScore}</span>
                                    <span className="text-[7px] font-black uppercase tracking-[0.1em] opacity-40">{zoneUI.label}</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-white/5">
                                  <div>
                                    <p className="text-[7px] font-black opacity-30 uppercase mb-1">TEMP</p>
                                    <p className="text-xs font-bold">{zone.temp}°F</p>
                                  </div>
                                  <div>
                                    <p className="text-[7px] font-black opacity-30 uppercase mb-1">WIND</p>
                                    <p className="text-xs font-bold">{zone.wind}M</p>
                                  </div>
                                </div>
                                <p className="text-[8px] text-white/20 italic font-medium">"{zone.hint}"</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full border-4 border-white/5 border-t-[#00E5FF] animate-spin" />
                    )}
                 </div>
                 <h2 className="text-[10rem] font-black italic uppercase leading-[0.75] mb-8 tracking-tighter opacity-10 absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap font-display">
                   sf chilln'
                 </h2>
                 <h3 className="text-7xl md:text-9xl font-black italic uppercase leading-[0.85] mb-8 tracking-tight font-display">
                   LAUNCH A <br/>
                   <span className="text-[#00E5FF]">SESSION.</span>
                 </h3>
                 {error && (
                   <div className="inline-flex items-center gap-2 text-red-400 text-sm font-bold bg-red-400/10 py-3 px-6 rounded-2xl border border-red-400/20 backdrop-blur-sm">
                     <Sparkles className="w-4 h-4" />
                     {error}
                   </div>
                 )}
              </div>
            </motion.div>
          ) : (
            <div key="results" className="space-y-10 relative z-10 max-w-5xl mx-auto pb-20">
              {/* Weather Status Bar & View Toggle */}
              <section className="flex flex-wrap justify-between items-center bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-2xl transition-all">
                <div className="flex gap-8 items-center">
                  <div>
                    <h2 className="text-[10px] uppercase tracking-[0.3em] text-[#00E5FF] font-black mb-2">CIT CLIMATE</h2>
                    <div className="flex items-center gap-3">
                      <Cloud className="w-8 h-8 text-[#00E5FF]" />
                      <p className="text-3xl font-light font-display">
                        {activeWeather?.weather[0].main} · <span className="font-bold">{activeWeather?.main.temp}°F</span>
                      </p>
                    </div>
                  </div>
                  <div className="h-10 w-px bg-white/10 hidden md:block"></div>
                  <div className="hidden md:block">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#00E5FF] font-black mb-2">WIND SENSE</p>
                    <p className="text-2xl font-bold font-display">{activeWeather?.wind.speed} MPH</p>
                  </div>
                </div>

                <div className="flex gap-2 bg-[#1A0638]/50 p-1.5 rounded-2xl border border-white/5">
                  <button 
                    onClick={() => setViewMode('details')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'details' ? 'bg-[#00E5FF] text-[#1A0638]' : 'text-white/40 hover:text-white/60'}`}
                  >
                    <Layout className="w-3.5 h-3.5" /> Details
                  </button>
                  <button 
                    onClick={() => setViewMode('map')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-[#00E5FF] text-[#1A0638]' : 'text-white/40 hover:text-white/60'}`}
                  >
                    <MapIcon className="w-3.5 h-3.5" /> Map
                  </button>
                </div>
              </section>

              {viewMode === 'details' ? (
                <>
                  {/* Hero Recommendation */}
                  <section className="flex flex-col gap-6">
                    {recommendations.length > 0 && (
                      <div className="bg-white p-1 rounded-[2.5rem] shadow-2xl transition-transform duration-700">
                        <div className="bg-[#1A0638] rounded-[2.2rem] p-8 md:p-10 flex flex-col md:flex-row gap-10">
                          <div className="w-full md:w-64 h-64 bg-[#2D0B5A] rounded-3xl border-4 border-[#00E5FF] flex-shrink-0 overflow-hidden relative group shadow-2xl shadow-black/40">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0638]/90 to-transparent"></div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:scale-110 transition-transform duration-1000">
                              {recommendations[0].exposure === 'Sunny' ? <Sun className="w-32 h-32 text-yellow-300" /> : <Wind className="w-32 h-32 text-[#00E5FF]" />}
                            </div>
                            <div className="absolute bottom-4 left-4">
                              <span className="text-[10px] bg-[#00E5FF] px-3 py-1 rounded-full uppercase font-black text-[#1A0638] shadow-lg tracking-widest">{recommendations[0].exposure}</span>
                            </div>
                          </div>
                          
                          <div className="flex-1 flex flex-col pt-2">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="text-5xl md:text-7xl font-black italic uppercase leading-none tracking-tighter font-display">{recommendations[0].name}</h3>
                                <p className="text-[#00E5FF] font-black text-xs mt-3 uppercase tracking-[0.3em] opacity-60 italic">{recommendations[0].neighborhood}</p>
                              </div>
                              <span className="hidden md:block text-[#00E5FF] text-[10px] font-mono uppercase font-black tracking-widest opacity-20 rotate-90 origin-right translate-y-8">
                                REF: {recommendations[0].id.slice(0, 8)}
                              </span>
                            </div>
                            
                            <div className="mt-8 bg-white/5 p-6 rounded-2xl border-l-4 border-[#00E5FF] backdrop-blur-md">
                              <p className="text-xl leading-relaxed text-white font-hand">
                                {guideOutput || 'Identifying the absolute move...'}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-4 mt-8 pt-8 border-t border-white/5">
                              <div className="flex-1 min-w-[120px] py-3 border border-white/5 rounded-2xl text-center bg-white/5">
                                <p className="text-[9px] uppercase text-[#00E5FF] font-black tracking-[0.2em] mb-1">Exposure</p>
                                <p className="text-sm font-bold uppercase tracking-widest">{recommendations[0].exposure}</p>
                              </div>
                              <div className="flex-1 min-w-[120px] py-3 border border-white/5 rounded-2xl text-center bg-white/5">
                                <p className="text-[9px] uppercase text-[#00E5FF] font-black tracking-[0.2em] mb-1">Session</p>
                                <p className="text-sm font-bold uppercase tracking-widest">{chillDuration > 8 ? "All Day" : chillDuration + "h"}</p>
                              </div>
                              <div className="flex-1 min-w-[120px] py-3 border border-white/5 rounded-2xl text-center bg-white/5">
                                <p className="text-[9px] uppercase text-[#00E5FF] font-black tracking-[0.2em] mb-1">Sessionability</p>
                                <p className="text-sm font-bold uppercase tracking-widest">
                                  {recommendations[0].exposure === 'Sunny' && activeWeather?.weather[0].main === 'Clear' ? 'Peak' : 'Solid'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recommendations.length > 1 && (
                        <div 
                          onClick={() => {
                            const newRecs = [...recommendations];
                            const moved = newRecs.shift();
                            if (moved) newRecs.push(moved);
                            setRecommendations(newRecs);
                            setGuideOutput(''); // Clear text to show it's "loading" new vibe
                          }}
                          className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex items-center justify-between group hover:bg-[#00E5FF]/10 transition-all cursor-pointer backdrop-blur-md"
                        >
                          <div className="flex items-center gap-6">
                            <div className="p-4 bg-white/10 rounded-2xl group-hover:bg-[#00E5FF]/20 transition-all"><Navigation className="w-6 h-6 text-white/50 group-hover:text-[#00E5FF]" /></div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00E5FF]/40 mb-1">ALTERNATIVE CHILL</p>
                              <span className="text-xl font-black italic uppercase font-display">{recommendations[1].name}</span>
                            </div>
                          </div>
                          <RefreshCw className="w-5 h-5 text-[#00E5FF]/40 group-hover:rotate-180 transition-all duration-700" />
                        </div>
                      )}

                      <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex flex-col justify-center gap-2 backdrop-blur-md">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00E5FF]/40">CONSIDERATIONS</p>
                        <ul className="text-xs space-y-2 text-white/60 italic font-medium">
                          {recommendations.length > 2 && (
                            <li>• {recommendations[2].name} for a {recommendations[2].neighborhood} vibe</li>
                          )}
                          <li>• Factor in the {activeWeather?.wind.speed}mph wind today</li>
                          <li>• {transport.includes('Bike') ? 'Great ride up the hill' : 'Mellow commute'} coming from your spot</li>
                        </ul>
                      </div>
                    </div>
                  </section>
                </>
              ) : (
                /* Map View */
                <section className="h-[600px] w-full bg-white/5 rounded-[3rem] border border-white/10 p-4 backdrop-blur-xl relative">
                   <MapContainer 
                      center={[37.7749, -122.4194]} 
                      zoom={12} 
                      scrollWheelZoom={false}
                      className="rounded-[2.5rem]"
                    >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    {recommendations.map((spot, idx) => {
                      const sessionRate = spot.exposure === 'Sunny' && activeWeather?.weather[0].main === 'Clear' ? 9.8 : 8.2;
                      return (
                        <Marker 
                          key={spot.id} 
                          position={[spot.coords.lat, spot.coords.lon]}
                          icon={L.divIcon({
                            className: 'custom-marker',
                            html: `
                              <div class="w-10 h-10 bg-[#00E5FF] rounded-2xl flex items-center justify-center text-[#1A0638] font-black shadow-xl shadow-[#00E5FF]/30 border-2 border-white/20 transform hover:scale-110 transition-transform">
                                ${idx + 1}
                              </div>
                            `
                          })}
                        >
                          <Popup>
                            <div className="font-sans">
                              <h4 className="text-lg font-black uppercase italic font-display">{spot.name}</h4>
                              <p className="text-[10px] uppercase font-black tracking-widest text-[#00E5FF] mb-2">{spot.neighborhood}</p>
                              <p className="text-xs text-white/70 mb-3 leading-relaxed font-medium">{spot.description}</p>
                              <div className="flex gap-2 pt-2 border-t border-white/10">
                                <div className="flex-1 bg-white/5 p-2 rounded-lg text-center">
                                  <p className="text-[8px] uppercase font-black text-white/40">SENSE</p>
                                  <p className="text-[10px] font-bold">SOLID</p>
                                </div>
                                <div className="flex-1 bg-white/5 p-2 rounded-lg text-center">
                                  <p className="text-[8px] uppercase font-black text-white/40">RATING</p>
                                  <p className="text-[10px] font-bold text-[#00E5FF]">{sessionRate}</p>
                                </div>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] bg-[#1A0638]/90 border border-[#00E5FF]/20 px-6 py-2 rounded-full backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-white/60">
                    {recommendations.length} Chill Spots identified in the mix
                  </div>
                </section>
              )}

              <div className="flex justify-center mt-6">
                <button 
                  onClick={() => {
                    setRecommendations([]);
                    setViewMode('details');
                  }}
                  className="group flex items-center gap-3 text-white/20 hover:text-[#00E5FF] transition-all text-[11px] font-black uppercase tracking-[0.3em] bg-white/5 py-4 px-10 rounded-full border border-white/5 hover:border-[#00E5FF]/30 backdrop-blur-lg"
                >
                  <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                  Reset Session
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
