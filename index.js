const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 8888;

// Ruta principal
app.get('/', (req, res) => {
    res.json({ message: '¡Bienvenido a la API de CentovaCast!', status: 'OK' });
});

// Ruta para devolver la URL del streaming
app.get('/radio', (req, res) => {
    res.json({ 
        message: 'Streaming activo', 
        url: 'https://estructuraweb.com.co:9389/Live' 
    });
});

// Función para separar el artista y el título de la canción
const extractArtistAndTitle = (fullTitle) => {
    if (!fullTitle) return { artist: "Desconocido", song: "No disponible" };

    const splitTitle = fullTitle.split(" - ");
    if (splitTitle.length >= 2) {
        return {
            artist: splitTitle[0].trim(),
            song: splitTitle.slice(1).join(" - ").trim()
        };
    }

    return { artist: "Desconocido", song: fullTitle };
};

// Ruta para obtener metadatos de la transmisión, incluyendo la carátula desde CentovaCast
app.get('/metadata', async (req, res) => {
    try {
        const response = await axios.get('https://estructuraweb.com.co:2199/rpc/ritmo/streaminfo.get');

        if (!response.data.data) {
            return res.status(500).json({ error: 'No se encontraron metadatos válidos' });
        }

        const songData = response.data.data.song;
        const playlistData = response.data.data.playlist;

        // Extraer artista, título y carátula
        const artist = songData.artist || "Desconocido";
        const songTitle = songData.title || "No disponible";
        const albumArt = playlistData.imageurl || "No disponible"; // Obteniendo la carátula desde CentovaCast

        res.json({
            server_name: response.data.data.title || "No disponible",
            artist: artist,
            current_song: songTitle,
            album: songData.album || "No disponible",
            album_art: albumArt,
            listen_url: "https://estructuraweb.com.co:9309/live"
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener metadatos', details: error.message });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});