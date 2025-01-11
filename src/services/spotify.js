import express from 'express';
import 'dotenv/config';
import axios from 'axios';
import qs from 'qs';

const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const REDIRECT_URI = 'http://localhost:8888/callback';
let tokenExpirationTime = 0;
let accessToken = '';
let refreshToken = '';

// Setup auth server
const authServer = express();
authServer.listen(8888, () => {
  console.log('Auth server listening on 8888');
});

// Generate random state
function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

const scopes = [
  'playlist-modify-public',
  'playlist-modify-private',
  'user-read-private',
  'user-read-email'
];

// Handle login request
authServer.get('/login', (req, res) => {
  const state = generateRandomString(16);
  const authorizeURL = `https://accounts.spotify.com/authorize?${qs.stringify({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: scopes.join(' '),
    redirect_uri: REDIRECT_URI,
    state
  })}`;
  res.redirect(authorizeURL);
});

// Handle callback from Spotify
authServer.get('/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      qs.stringify({
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      }),
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
    tokenExpirationTime = Date.now() + (response.data.expires_in * 1000);

    res.send('Login successful! You can now close this window.');
  } catch (error) {
    res.send('Error during authentication');
    console.error('Auth error:', error);
  }
});

async function refreshAccessToken() {
  try {
    if (Date.now() > tokenExpirationTime - 60000) {
      if (refreshToken) {
        const response = await axios.post(
          'https://accounts.spotify.com/api/token',
          qs.stringify({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
          }),
          {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );

        accessToken = response.data.access_token;
        tokenExpirationTime = Date.now() + (response.data.expires_in * 1000);
        console.log('Successfully refreshed access token');
      } else {
        throw new Error('No refresh token available');
      }
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw new Error('Please login to Spotify first');
  }
}

export async function initiateSpotifyLogin() {
  console.log('Please visit http://localhost:8888/login to authorize the application');
}

export async function createPlaylist(songs, mood) {
  try {
    await refreshAccessToken();
    console.log('Starting playlist creation for mood:', mood);

    const trackUris = [];
    for (const song of songs) {
      console.log(`Searching for track: ${song.title} by ${song.artist}`);
      const searchResponse = await axios.get(
        `${SPOTIFY_API_URL}/search`,
        {
          params: {
            q: `track:${song.title} artist:${song.artist}`,
            type: 'track',
            limit: 1
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (searchResponse.data.tracks.items.length > 0) {
        trackUris.push(searchResponse.data.tracks.items[0].uri);
        console.log('Found track:', searchResponse.data.tracks.items[0].uri);
      } else {
        console.log(`No match found for: ${song.title} by ${song.artist}`);
      }
    }

    if (trackUris.length === 0) {
      throw new Error('No matching tracks found on Spotify');
    }

    // Get user info for playlist creation
    const userResponse = await axios.get(`${SPOTIFY_API_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const userId = userResponse.data.id;

    // Create a playlist
    const playlistResponse = await axios.post(
      `${SPOTIFY_API_URL}/users/${userId}/playlists`,
      {
        name: `${mood} Mood Playlist`,
        description: `A playlist generated for the mood: ${mood}`,
        public: false
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Adding tracks to playlist...');
    await axios.post(
      `${SPOTIFY_API_URL}/playlists/${playlistResponse.data.id}/tracks`,
      { uris: trackUris },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return playlistResponse.data.external_urls.spotify;
  } catch (error) {
    console.error('Spotify error:', error.response?.data || error);
    if (error.message === 'Please login to Spotify first') {
      throw new Error('Please visit http://localhost:8888/login to authorize with Spotify');
    }
    throw new Error(error.message || 'Failed to create Spotify playlist');
  }
}
