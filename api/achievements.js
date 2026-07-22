import obtenerLogrosComb from './_lib/steam.js'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' })
    }

    try {
        const { usersteamid, appid } = req.body
        const achcombined = await obtenerLogrosComb(usersteamid, appid)

        return res.status(200).json({
            mensaje: `Datos obtenidos para ${usersteamid} y ${appid}`,
            achcombined,
            timestamp: new Date().toISOString()
        })
    } catch (e) {
        console.error('Error en /api/achievement:', e)
        return res.status(500).json({ error: e.message })
    }
}