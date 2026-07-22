export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' })
    }

    try {
        const { usersteamid, appid, name, apiname } = req.body

        if (!usersteamid) return res.status(400).json({ error: 'SteamId requerido' })
        if (!appid) return res.status(400).json({ error: 'Appid requerido' })
        if (!name) return res.status(400).json({ error: 'Gamename requerido' })
        if (!apiname) return res.status(400).json({ error: 'Apiname requerido' })

        await pool.query(
            'INSERT INTO widget_config (steamid, appid, gamename, achievement_apiname) VALUES ($1, $2, $3, $4) ON CONFLICT (steamid) DO UPDATE SET appid = $2, gamename = $3, achievement_apiname = $4',
            [usersteamid, appid, name, apiname]
        )

        return res.status(200).json({ mensaje: 'Widget guardado', url: `/widget/${usersteamid}` })
    } catch (e) {
        console.error('Error en /api/save-widget:', e)
        return res.status(500).json({ error: 'Error interno del servidor', detalles: e.message })
    }
}