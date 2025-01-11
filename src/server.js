import express from 'express';
import 'dotenv/config';
import { apiKeyAuth, limiter } from './middleware/auth.js';
import { keyManager } from './config/keys.js';
import { getSongSuggestions } from './services/openai.js';
import { createPlaylist, initiateSpotifyLogin } from './services/spotify.js';

const app = express();
app.use(express.json());
app.use(limiter);

// Generate API key endpoint
app.post('/api/keys', (req, res) => {
  const apiKey = keyManager.generateKey();
  res.json({ apiKey });
});

// Spotify login endpoint
app.get('/api/spotify/login', (req, res) => {
  initiateSpotifyLogin();
  res.json({ message: 'Please visit http://localhost:8888/login to authorize with Spotify' });
});

// Generate playlist endpoint with songCount
app.post('/api/playlist', apiKeyAuth, async (req, res) => {
  try {
    const { mood, songCount } = req.body;
    
    if (!mood) {
      return res.status(400).json({ error: 'Mood is required' });
    }

    if (songCount && (!Number.isInteger(songCount) || songCount <= 0)) {
      return res.status(400).json({ error: 'songCount must be a positive integer' });
    }

    console.log(`Processing request for mood: ${mood} with songCount: ${songCount}`);

    // Get song suggestions from OpenAI, passing the songCount if provided
    const songs = await getSongSuggestions(mood, songCount);
    console.log('Received song suggestions:', songs);
    
    // Create Spotify playlist
    const playlistUrl = await createPlaylist(songs, mood);
    console.log('Created playlist:', playlistUrl);
    
    res.json({
      success: true,
      playlist: playlistUrl,
      songs
    });
  } catch (error) {
    console.error('Detailed error:', error);
    
    // Send a more specific error message
    let errorMessage = 'Failed to generate playlist';
    if (error.response?.data) {
      errorMessage = error.response.data.error || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
