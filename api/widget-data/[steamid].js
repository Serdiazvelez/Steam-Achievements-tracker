const pool = require('../_lib/db')
const obtenerLogrosComb = require('../_lib/steam')

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método no permitido' })
    }

    try {
        const { steamid } = req.query

        const resultado = await pool.query(
            'SELECT appid, gamename, achievement_apiname FROM widget_config WHERE steamid = $1',
            [steamid]
        )

        if (resultado.rows.length === 0) {
            throw new Error('No se encontró configuración para el steamid')
        }

        const { appid, gamename, achievement_apiname } = resultado.rows[0]
        const achcombined = await obtenerLogrosComb(steamid, appid)

        const total = achcombined.length
        const completados = achcombined.filter(a => a.achieved).length
        const logroSeleccionado = achcombined.find(a => a.apiname === achievement_apiname)

        return res.status(200).json({
            gamename,
            total,
            completados,
            logroSeleccionado,
            appid,
            timestamp: new Date().toISOString()
        })
    } catch (e) {
        console.error('Error en /api/widget-data:', e)
        return res.status(500).json({ error: e.message })
    }
}