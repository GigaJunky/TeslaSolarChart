const TeslaAPI = require('./TeslaAPI')

TeslaAPI.requestData({ kind: 'products' }, (err, res) =>{
    TeslaAPI.requestData({ kind: 'power', period: 'day'})
    TeslaAPI.requestData({ kind: 'energy', period: 'week' })
    TeslaAPI.requestData({ kind: 'energy', period: 'month' })
    TeslaAPI.requestData({ kind: 'vehicles' })
    //TeslaAPI.requestData({ kind: 'honk_horn' })
    
})
