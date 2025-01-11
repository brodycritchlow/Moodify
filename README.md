# Moodify 🎵  
Moodify is an API that generates personalized Spotify playlists tailored to your mood. Instead of relying on Spotify's recommendation engine, Moodify uses custom machine learning models hosted on GitHub to analyze mood inputs and curate the perfect set of tracks.  

---

## Features  
- 🎶 **Mood-Based Playlists**: Generate playlists by providing mood keywords (e.g., "happy," "chill," "melancholy").  
- 🤖 **AI-Powered Selection**: Utilizes GitHub-hosted models to analyze music features and assign mood labels.  
- 🕒 **Custom Playlist Duration**: Specify the amount of songs in your playlist. (1-50 songs)
---

## Getting Started  

### Prerequisites  
- A [Spotify Developer Account](https://developer.spotify.com/dashboard/applications).  
- A Spotify API Client ID and Client Secret.  
- Access to the GitHub-hosted models.

### Installation  
1. Clone the repository:  
   ```bash  
   git clone https://github.com/yourusername/moodify.git  
   cd moodify  
   ```

2. Install dependencies:
    ```bash
    pip install -r requirements.txt  
    ```

3. Set up your environment variables:

Create a .env file in the root directory and add your Spotify credentials:

```
SPOTIFY_CLIENT_ID=your_client_id  
SPOTIFY_CLIENT_SECRET=your_client_secret  
SPOTIFY_REDIRECT_URI=http://localhost:5000/callback  
```

Start the server:

    ```bash
    npm run dev
    ```