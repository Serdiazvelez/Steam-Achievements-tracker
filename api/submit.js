export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' })
    }

    try {
        const { usersteamid } = req.body

        if (!usersteamid) {
            return res.status(400).json({ error: 'SteamId requerido' })
        }

        const apiKey = process.env.STEAM_API_KEY
        if (!apiKey) {
            return res.status(500).json({ error: 'Falta STEAM_API_KEY en las variables de entorno' })
        }

        const steamUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${usersteamid}&include_appinfo=true&format=json`

        const steamResponse = await fetch(steamUrl)
        const steamData = await steamResponse.json()

        const steamgamesinf = steamData.response.games.map(gameinf => ({
            appid: gameinf.appid,
            name: gameinf.name,
            img_icon_url: gameinf.img_icon_url
        }))

        return res.status(200).json({
            mensaje: `Datos obtenidos para ${usersteamid}`,
            steamgamesinf,
            timestamp: new Date().toISOString()
        })
    } catch (e) {
        console.error('Error en /api/submit:', e)
        return res.status(500).json({ error: 'Error interno del servidor' })
    }
}