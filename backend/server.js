// server.js
import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "https://live-cricket-score-five.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(new Error("CORS: Missing origin"));

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS: Not allowed by policy"));
    }
  }
};

app.use(cors(corsOptions));

app.set('trust proxy', 1); 

/** Rate Limiters **/
const dailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 8,
  message: 'Daily request limit reached for this endpoint. Try again tomorrow.',
});

const liveLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1,
  message: 'Too many requests to live scores. Please wait a minute.',
});

/** Cache Store **/
const cache = {
  live: { data: null, time: 0 },
  upcoming: { data: null, time: 0 },
  recent: { data: null, time: 0 }
};

/** Constants **/
const LIVE_BASE = 'https://cricket-api-free-data.p.rapidapi.com';
const LIVE_HOST = 'cricket-api-free-data.p.rapidapi.com';
const UPCOMING_BASE = 'https://unofficial-cricbuzz.p.rapidapi.com';
const UPCOMING_HOST = 'unofficial-cricbuzz.p.rapidapi.com';
const RECENT_BASE = 'https://unofficial-cricbuzz.p.rapidapi.com';
const RECENT_HOST = 'unofficial-cricbuzz.p.rapidapi.com';
const API_KEY = process.env.RAPIDAPI_KEY;

/** Fetch and Cache **/
async function fetchAndCache(endpoint, key, host, base) {
  const now = Date.now();
  const { data, time } = cache[key];

  const CACHE_DURATIONS = {
    live: 60 * 1000, // 1 minute
    recent: 3 * 60 * 60 * 1000, // 3 hours
    upcoming: 3 * 60 * 60 * 1000, // 3 hours
  };

if (data && now - time < CACHE_DURATIONS[key]) {
  console.log(`[CACHE HIT] ${key} served from cache.`);
  return { data, fromCache: true };
}

  try {
    const res = await fetch(`${base}${endpoint}`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': host
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[${key.toUpperCase()} ERROR] ${res.status}: ${errorText}`);
      return {
        error: `Error fetching ${key} data. You may have exceeded the quota for this endpoint.`,
        status: res.status
      };
    }

    const jsonData = await res.json();
    cache[key] = { data: jsonData, time: now };
    return { data: jsonData };
  } catch (err) {
    console.error(`[${key.toUpperCase()} FETCH FAILED]:`, err);
    return { error: 'Internal Server Error', status: 500 };
  }
}

/** API Endpoints **/

// Live scores
app.use('/api/live', liveLimiter);
app.get('/api/live', async (req, res) => {
  const result = await fetchAndCache('/cricket-livescores', 'live', LIVE_HOST, LIVE_BASE);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
});

// Upcoming matches
app.use('/api/upcoming', dailyLimiter);
app.get('/api/upcoming', async (req, res) => {
  const result = await fetchAndCache('/matches/get-schedules?matchType=international', 'upcoming', UPCOMING_HOST, UPCOMING_BASE);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
});

// Recent matches
app.use('/api/recent', dailyLimiter);
app.get('/api/recent', async (req, res) => {
  const result = await fetchAndCache('/matches/list?matchState=recent', 'recent', RECENT_HOST, RECENT_BASE);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
});

app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));

