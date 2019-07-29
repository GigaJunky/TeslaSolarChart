const TeslaAPI = require('./TeslaAPI')
let now = new Date()
now.setHours(0,0,0,0)
let date =  process.argv[2] ? process.argv[2] : new now.toISOString().substr(0,10) 

TeslaAPI.requestData({ kind: 'products' }, (err, res) =>{
    TeslaAPI.requestData({ kind: 'power', period: 'day', date: date})
    TeslaAPI.requestData({ kind: 'energy', period: 'week', date: date })
    TeslaAPI.requestData({ kind: 'energy', period: 'month', date: date })
    TeslaAPI.requestData({ kind: 'vehicles' })
    //TeslaAPI.requestData({ kind: 'honk_horn' })
    
})
