import dotenv  from 'dotenv'
dotenv.config({path: '.env.local'}) 


import {Pool} from 'pg'
const apiKey = process.env.STEAM_API_KEY;
import http from 'http'
import fs from 'fs'
import url from 'url'

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT
})

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Servir index.html en la raíz
  if (pathname === '/') {
    fs.readFile('index.html', (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('404 - Archivo no encontrado');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  const partes = pathname.split('/')


//Conexion a styles HTML

if (pathname === '/style.css') {
  fs.readFile('style.css', (err, data) =>{
    if (err) {
      res.writeHead(404)
      res.end('404 - Archivo no encontrado')
      return
    }
    res.writeHead(200, {'Content-Type':'text/css'})
    res.end(data)
  })
  return
}

//Conexion a styles Widget
if(pathname === '/widget-style.css'){
  fs.readFile('widget-style.css', (err,data) =>{
    if (err){
      res.writeHead(404)
      res.end('404 - Archivo no encontrado')
      return
    }
    res.writeHead(200, {'Content-Type':'text/css'})
    res.end(data)
  })
  return
}


//Endpoint widget
  if (partes[2] === 'widget-data' && req.method === 'GET'){
    const steamidFromUrl = partes[3]
    try {
      const resultado = await pool.query(
        'SELECT appid, gamename, achievement_apiname FROM widget_config WHERE steamid = $1',
        [steamidFromUrl]
      )

      if (resultado.rows.length === 0){
        throw new Error('No se encontro configuracion para el steamid')
      }

      const {appid, gamename, achievement_apiname} = resultado.rows[0]

      const achcombined = await obtenerLogrosComb(steamidFromUrl, appid)

      const total = achcombined.length
      const completados = achcombined.filter(a => a.achieved).length
      const logroSeleccionado = achcombined.find(a => a.apiname === achievement_apiname)

      res.writeHead(200, {'Content-Type':'application/json'})
      res.end(JSON.stringify({
        gamename,
        total,
        completados,
        logroSeleccionado,
        appid,
        timestamp: new Date().toISOString()
      }))

    }catch(e){
      console.error('Error en /api/widget-data',e)
      res.writeHead(500, {'Content-Type':'application/json'})
      res.end(JSON.stringify({error: e.message}))
    }
    return
  }

  //Api generacion widget
  if (pathname === '/api/save-widget' && req.method === 'POST'){
    let body = ''
    req.on('data', (chunk) => {body += chunk.toString() })
    req.on('end', async() => {
      try {
        const data = JSON.parse(body)
        console.log('Datos recibidos en /api/save-widget:', data)

        const steamid = data.usersteamid
        if (!steamid) {
          console.log('Error: SteamId no proporcionado')
          res.writeHead(400, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({error: 'SteamId requerido'}));
          return;
        }

        const appid = data.appid
        if(!appid){
          console.log('Error: appid no proporcionado')
          res.writeHead(400, {'Content-Type':'application/json'});
          res.end(JSON.stringify({error: 'Appid Requerido'}));
          return;
        }

        const gamename = data.name
        if(!gamename){
          console.log('Error: gamename no proporcionado')
          res.writeHead(400, {'Content-Type':'application/json'});
          res.end(JSON.stringify({error: 'Gamename requerido'}));
          return;
        }

        const achievement_apiname = data.apiname
        if(!achievement_apiname){
          console.log('Error: apiname no proporcionado')
          res.writeHead(400, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({error: 'Apiname requerido'}));
          return;
        }

        console.log('Intentando guardar widget con:', {steamid, appid, gamename, achievement_apiname})
        const result = await pool.query(
          'INSERT INTO widget_config(steamid, appid, gamename, achievement_apiname) VALUES ($1, $2, $3, $4) ON CONFLICT (steamid) DO UPDATE SET appid = $2, gamename = $3, achievement_apiname = $4',
          [steamid, appid, gamename, achievement_apiname]
        )
        console.log('Widget guardado correctamente. Resultado:', result)
 
        res.writeHead(200, {'Content-Type': 'application/json'})
        res.end(JSON.stringify({mensaje: 'Widget guardado', url: `/widget/${data.steamid}`}))
      } catch (e) {
        console.error('Error en /api/save-widget:', e)
        console.error('Stack:', e.stack)
        res.writeHead(500, {'Content-Type': 'application/json'})
        res.end(JSON.stringify({error: 'Error interno del servidor', detalles: e.message}))
      }
    })
    return;
  }


  if (partes[1] === 'widget' && req.method === 'GET'){
    fs.readFile('widget.html', (err, data) => {
      if(err){
        res.writeHead(404)
        res.end(data)
        return
      }
      res.writeHead(200, {'Content-Type':'text/html'})
      res.end(data)
    })
    return
  }


  // Api de informacion usuario
  if (pathname === '/api/submit' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        console.log('Body recibido:', data);

        const usersteamid = data.usersteamid;
        if (!usersteamid) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'SteamId requerido' }));
          return;
        }

        const apiKey = process.env.STEAM_API_KEY;
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Falta STEAM_API_KEY en las variables de entorno' }));
          return;
        }

        const steamUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${usersteamid}&include_appinfo=true&include_played_free_games=true&format=json`;
        console.log('Consultando Steam:', steamUrl);

        if (typeof fetch !== 'function') {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Node no tiene fetch nativo. Usa Node 18+ o instala node-fetch' }));
          return;
        }

        const steamResponse = await fetch(steamUrl);
        console.log('Steam HTTP status:', steamResponse.status);

        const steamData = await steamResponse.json();
        //console.log('Steam response data:', steamData);

        var steamgamesinf = steamData.response.games.map(gameinf =>({
          appid: gameinf.appid,
          name: gameinf.name,
          img_icon_url: gameinf.img_icon_url
        }));
        //console.log('Array nuevo', steamgamesinf);
        

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          mensaje: `Datos obtenidos para ${usersteamid}`,
          steamgamesinf,
          timestamp: new Date().toISOString()
        }));
      } catch (e) {
        console.error('Error en /api/submit:', e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error interno del servidor' }));
      }
    });
    return;
  }

  //Funcion apis logros e imagenes de logros.
  async function obtenerLogrosComb(steamid, appid){
    const apiKey = process.env.STEAM_API_KEY
    if (!apiKey) {
      throw new Error ('Falta STEAM_API_KEY en las variables de entorno' )
    }

    if (!steamid) {
      throw new Error('App ID requerido')
    }

    if (!appid) {
      throw new Error('SteamId requerido' )
    }

    const achievementsUrl = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appid}&key=${apiKey}&steamid=${steamid}&l=spanish&format=json`
    const achiconUrl = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v0002/?key=${apiKey}&appid=${appid}&l=spanish&format=json`;
  
    const [achresponse, iconresponse] = await Promise.all([
      fetch(achievementsUrl),
      fetch(achiconUrl)  
    ]);
    console.log('Steam Achievement HTTP status:', achresponse.status);
    console.log('Steam Achievement Icon HTTP status:', iconresponse.status);

  //validaciones

  const achData = await achresponse.json()
  const iconData = await iconresponse.json()

  //console.log('achData:', JSON.stringify(achData, null, 2))
  //console.log('iconData:', JSON.stringify(iconData, null, 2))

  if (!achData.playerstats || !achData.playerstats.achievements) {
    throw new Error ('Este juego no tiene logros o el perfil es privado' )
  }

  if (!iconData.game || !iconData.game.availableGameStats || !iconData.game.availableGameStats.achievements) {
    throw new Error('Este juego no tiene logros o el perfil es privado' )
  }

  //gameachinf y achicon logic

  var gameachinf = achData.playerstats.achievements.map(achinf =>({
    name: achinf.name,
    achieved: achinf.achieved,
    description: achinf.description,
    apiname : achinf.apiname
  }));

  var achicon = iconData.game.availableGameStats.achievements.map(achicon =>({
    icon: achicon.icon,
    icongrey: achicon.icongray,
    apiname : achicon.name
  }));

  const achcombined = gameachinf.map(ach => {
    const img = achicon.find(icon => icon.apiname === ach.apiname)
    return {
      ...ach,
      icon: img ? img.icon :null,
      icongrey: img ? img.icongrey: null 
    }
  })

  return achcombined
  
  } 

  //Llamada api de logros

  if (pathname === '/api/achievements' && req.method === 'POST') {
    let body = ''
    req.on('data', (chunk) => {body += chunk.toString()})
    req.on ('end', async () => {
      try {
        const data = JSON.parse(body)
        const achcombined = await obtenerLogrosComb(data.usersteamid, data.appid)

        res.writeHead(200, {'Content-Type': 'application/json'})
        res.end(JSON.stringify({
          mensaje: `Datos obtenidos para ${data.usersteamid} y ${data.appid}`,
          achcombined,
          timestamp: new Date().toString()
        }))
      }catch(e) {
        console.error('Error en /api/achievements:', e)
        res.writeHead(500, {'Content-Type':'application/json'})
        res.end(JSON.stringify({error: e.message}))
      }
    })
    return
  }

  // 404 para todo lo demás
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
});

server.listen(3000, () => {
  console.log('Servidor local corriendo en http://localhost:3000');
  console.log('Presiona Ctrl+C para detener');
});