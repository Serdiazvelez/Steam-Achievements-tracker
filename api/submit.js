export default async function handler(req, res) {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Aquí recibirás los datos del formulario
    const { STEAM_ID } = req.body;
    console.log('Body recibido:', req.body)
    console.log('Steam ID:', STEAM_ID)
    if (!STEAM_ID) {
      return res.status(400).json({ error: 'SteamId requerido' });
    }

    // Aquí irá tu lógica:
    // - Validar SteamId
    // - Llamar a la API de Steam
    const url1 = (`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&include_appinfo=true&format=json`)
    console.log('URL1 SteamGames', url1)

    const response = await fetch(url1);

    if (!response.ok){
      console.log('ERROR HTTP:', response.status);
      throw new Error('Error al consultar la API de Steam');
    }
    
    const data = await response.json();
    console.log('Respuesta completa de Steam', data);
    // - Procesar datos


    // - Devolver respuesta

    return res.status(200).json({
      mensaje: `Datos recibidos: ${STEAM_ID}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
