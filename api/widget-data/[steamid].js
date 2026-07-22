import pool from '../_lib/db.js'
import obtenerLogrosComb from '../_lib/steam.js'

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método no permitido' })
    }

    try {
        const { steamid } = req.query

        console.log("SteamID recibido:", steamid)

        const resultado = await pool.query(
            'SELECT appid, gamename, achievement_apiname FROM widget_config WHERE steamid = $1',
            [steamid]
        )

        console.log("Resultado BD:", resultado.rows)

        if (resultado.rows.length === 0) {
            throw new Error('No se encontró configuración para el steamid')
        }

        const { appid, gamename, achievement_apiname } = resultado.rows[0]

        const achcombined = await obtenerLogrosComb(steamid, appid)

        const logroSeleccionado = achcombined.find(
            a => a.apiname === achievement_apiname
        )

        return res.status(200).json({
            gamename,
            total,
            completados,
            logroSeleccionado,
            appid
        })

    } catch (e) {
        console.error('Error en /api/widget-data:', e)
        return res.status(500).json({ error: e.message })
    }
}