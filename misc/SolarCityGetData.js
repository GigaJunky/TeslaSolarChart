const SolarCityAPI = require('./SolarCityAPI')
let now = new Date()
now.setHours(0,0,0,0)
let today = now.toISOString().substr(0,10)
, StartDate = process.argv[2] || today
, EndDate   = process.argv[3] || today

SolarCityAPI.requestData({ kind: 'measurements', StartTime: StartDate, EndTime: EndDate, Period: 'hour'  })
SolarCityAPI.requestData({ kind: 'consumption', StartTime: StartDate })
    
