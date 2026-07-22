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

module.exports = obtenerLogrosComb