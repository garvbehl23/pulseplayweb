const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const port = 2020;

const CLIENT_ID = 'b137fae438e54ae4bbd0f8925debfb04';
const CLIENT_SECRET = '73da421e646c4a3b8f97a7445db9ca86';
const REDIRECT_URI = `http://localhost:${port}/callback`;

const generateRandomString = (length) => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

const stateKey = 'spotify_auth_state';

app.use(express.static(path.join(__dirname, 'public')))
    .use(cookieParser()); // Make sure cookie-parser is used before any routes

app.get('/login', (req, res) => {
    const state = generateRandomString(16);
    res.cookie(stateKey, state, {
        httpOnly: true,
        secure: false, // Set to true if using HTTPS
        sameSite: 'Lax' // Allows cookies to be sent with top-level navigations
    });

    // Debugging: log generated state and cookie
    console.log('Generated State:', state);
    console.log('Set Cookie:', req.cookies[stateKey]); // This should log the cookie value right after setting it

    const scope = 'user-read-private user-read-email user-modify-playback-state streaming user-read-playback-state';
    const queryParams = querystring.stringify({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: scope,
        redirect_uri: REDIRECT_URI,
        state: state
    });

    res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

app.get('/callback', async(req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[stateKey] : null;

    // Debugging: log state and stored state values
    console.log('State from Spotify:', state);
    console.log('Stored State:', storedState);
    const accessToken = 'BQB95vWmVyLldKTbT5tsyZsw5iwv4-4kRDWBWqJMDT7y2ezLaQVipC58DII6C9ECWrVl80B3BTjIjXxSTnZlXn3hRi6j7DmzCwBRfXYccwDO7KlOr5RIfUw_2CVVHST5sCb04gl0OlefbUfdN417tNIAOGubZq5FRgU-BqlCw6PHGa2zqEZFPq33kdzVFGe6FjFlfte-IHfeikffsp9bXOxp-lcI-w'
        // Replace with your Spotify access tokens

    // Fetch user's Spotify profile
    axios.get('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
        .then(response => {
            console.log('User Profile:', response.data);
        })
        .catch(error => {
            console.error('Error fetching profile:', error.response.data);
        });
    const refreshToken = 'AQAsnxnu9ds9ni7a3nS5xAcCriJUvzsSkrbVdwM4-SmKH-DSwlyXyRPyZAjaUGyCjkWLfsvrObmym2pMHoLqDwhZSQ9zAp3J63hKmBm5rCbVALGXEJn2eKxvmF6qlIWz2M8';

    axios.post('https://accounts.spotify.com/api/token', querystring.stringify({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        }), {
            headers: {
                'Authorization': 'Basic ' + (Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        .then(response => {
            console.log('New Access Token:', response.data.access_token);
        })
        .catch(error => {
            console.error('Error refreshing token:', error.response.data);
        });


    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);
        const authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            method: 'post',
            data: querystring.stringify({
                code: code,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            }),
            headers: {
                'Authorization': 'Basic ' + (Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        try {
            const response = await axios(authOptions);
            const { access_token, refresh_token } = response.data;

            res.redirect('/#' +
                querystring.stringify({
                    access_token: access_token,
                    refresh_token: refresh_token
                }));
        } catch (error) {
            console.error('Error getting tokens:', error.response.data);
            res.redirect('/#' +
                querystring.stringify({
                    error: 'invalid_token'
                }));
        }
    }
});

app.get('/profile', async(req, res) => {
    const access_token = req.query.access_token;

    if (!access_token) {
        res.status(400).send('Access token is missing');
        return;
    }

    try {
        const response = await axios.get('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': 'Bearer ' + access_token
            }
        });
        res.send(response.data);
    } catch (error) {
        console.error('Error fetching profile:', error.response.data);
        res.status(400).send('Error fetching profile');
    }
});
app.get('/playlists', async(req, res) => {
    const accessToken = req.query.access_token;

    try {
        const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching playlists:', error.response.data);
        res.status(400).send('Error fetching playlists');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});