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
    const splitTitle = fullTitle.split(" - "); // Divide por " - "
    return {
        artist: splitTitle[0] || "Desconocido",
        song: splitTitle[1] || fullTitle
    };
};

// Función para obtener el MBID del álbum desde MusicBrainz
const getMBIDFromMusicBrainz = async (artistName, songTitle) => {
    try {
        const queryUrl = `https://musicbrainz.org/ws/2/release-group/?query=artist:${encodeURIComponent(artistName)} AND release:${encodeURIComponent(songTitle)}&fmt=json`;
        const response = await axios.get(queryUrl);

        if (response.data["release-groups"] && response.data["release-groups"].length > 0) {
            return response.data["release-groups"][0].id; // Devuelve el MBID del primer resultado
        }

        return null;
    } catch (error) {
        console.error("Error obteniendo MBID desde MusicBrainz:", error.message);
        return null;
    }
};

// Función para obtener la carátula del álbum desde Cover Art Archive
const getAlbumArtFromCoverArtArchive = async (mbid) => {
    if (!mbid) return "No disponible";

    return `https://coverartarchive.org/release-group/${mbid}/front`; // URL directa de la imagen
};

// Ruta para obtener metadatos de la transmisión
app.get('/metadata', async (req, res) => {
    try {
        const response = await axios.get('https://estructuraweb.com.co:9309/status-json.xsl');

        if (!response.data.icestats || !response.data.icestats.source) {
            return res.status(500).json({ error: 'No se encontraron metadatos válidos' });
        }

        const source = Array.isArray(response.data.icestats.source) ? response.data.icestats.source[0] : response.data.icestats.source;

        const { artist, song } = extractArtistAndTitle(source.title);

        // Obtener el MBID del álbum desde MusicBrainz
        const mbid = await getMBIDFromMusicBrainz(artist, song);

        // Obtener la carátula desde Cover Art Archive usando el MBID
        const album_art = await getAlbumArtFromCoverArtArchive(mbid);

        res.json({
            server_name: source.server_name || "No disponible",
            server_description: source.server_description || "No disponible",
            current_song: source.title || "No disponible",
            artist: artist,
            album: mbid ? song : "No disponible", // Si encontramos un MBID, usamos el nombre de la canción como álbum
            album_art: album_art,
            listeners: source.listeners || 0,
            bitrate: source.bitrate || "No disponible",
            genre: source.genre || "No disponible",
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