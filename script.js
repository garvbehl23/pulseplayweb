document.getElementById('loadSongs').addEventListener('click', async() => {
    try {
        const response = await fetch('/api/songs');
        const songs = await response.json();
        const songsList = document.getElementById('songsList');
        songsList.innerHTML = '';
        songs.forEach(song => {
            const songElement = document.createElement('div');
            songElement.textContent = `${song.title} by ${song.artist}`;
            songsList.appendChild(songElement);
        });
    } catch (error) {
        console.error('Error loading songs:', error);
    }
});
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('playTrack').addEventListener('click', () => {
        fetch('/play')
            .then(response => response.text())
            .then(data => alert(data))
            .catch(error => console.error('Error:', error));
    });
});

// Replace with your Spotify Access Token
const accessToken = 'BQCBFDxM3VKl3eza3ukGhA7Vn6gA-sd5yqfmH3exuvAMtR9dcf8vr1mWG0wKNhMQ6WVxnxQuZ1WFpHqEDcN9mtH-_GTjft6ppGYV_6fIsd3aJ1x-DbjUc0IHTImR0vrKdYpGActZKuJZLt7mpRm2O2fBA-RTizjU27Eki3l9Xjs4CZxgEh1YZnrEfkBYT6PsRpgVq8VUlcSNAjvurMhFnNc7veID-w';
window.onSpotifyWebPlaybackSDKReady = () => {
    const player = new Spotify.Player({
        name: 'PulsePlay Player',
        getOAuthToken: cb => { cb(accessToken); }
    });

    // Error handling
    player.addListener('initialization_error', e => console.error(e));
    player.addListener('authentication_error', e => console.error(e));
    player.addListener('account_error', e => console.error(e));
    player.addListener('playback_error', e => console.error(e));

    // Playback status updates
    player.addListener('player_state_changed', state => console.log(state));

    // Ready
    player.addListener('ready', data => {
        console.log('Ready to play');
        // You can play a track here if needed
        player.resume().then(() => {
            console.log('Playback resumed');
        });
    });

    // Not Ready
    player.addListener('not_ready', data => {
        console.log('Device ID has gone offline');
    });

    // Connect to the player
    player.connect();

    // Adding event listeners to buttons
    document.getElementById('playButton').addEventListener('click', () => {
        player.resume().then(() => {
            console.log('Playback resumed');
        });
    });

    document.getElementById('pauseButton').addEventListener('click', () => {
        player.pause().then(() => {
            console.log('Playback paused');
        });
    });
};
// Add this to your JavaScript
document.getElementById('playButton').addEventListener('click', () => {
    player.connect().then(success => {
        if (success) {
            console.log('Successfully connected to Spotify');
            // Replace with a valid Spotify track URI
            player._options.getOAuthToken(token => {
                fetch('https://api.spotify.com/v1/me/player/play', {
                    method: 'PUT',
                    body: JSON.stringify({
                        uris: ['https://open.spotify.com/track/0YQJoDL6f46J0n1rOVkpxJ'] // Replace with the URI of the track you want to play
                    }),
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            });
        }
    });
});