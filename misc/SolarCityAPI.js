const fs = require('fs')
    , request = require('../request')
    , auth = require('../private/SolarCityConfig.json')
    , datapath = '../data/'


function saveData(data, query) {
    let jdata = JSON.parse(data)
    if(jdata.Message) console.log('error:', jdata.Message)
    
    let fn = `mysolarcity.com_${query.kind}_${query.StartTime}_${query.EndTime}_${query.Period}.json`
    if(query.StartTime === query.EndTime)
        fn = `mysolarcity.com_${query.kind}_${query.StartTime}_${query.Period}.json`
    fs.writeFileSync(fn, data)
    console.log('saving file:', fn, data.length)
}

function createOptions(query) {
    query.IsByDevice = query.IsByDevice !== false
    query.Period = query.Period || 'hour'
    query.EndTime = query.EndTime || query.StartTime
    let cmd = `/solarcity-api/powerguide/v1.0/${query.kind}/${auth.DefaultInstallationGUID}?ID=${auth.CustomerGUID}&IsByDevice=${query.IsByDevice}&Period=${query.Period}&StartTime=${query.StartTime.substr(0,10)}T00:00:00&EndTime=${query.EndTime.substr(0,10)}T23:59:59`
    console.log(cmd)
    return {
        method: 'GET', host: 'mysolarcity.com', port: 443, path: cmd,
        headers: {'Content-Type': 'application/json; charset=utf-8' }
    }
}

function requestData(query, cb) {
    request(createOptions(query), (err, res) => {
        if (err){
            if (cb) cb(err, null) 
        }else {
            saveData(res, query)
            if (cb) cb(null, res)
        }
    })
}


module.exports = {
    requestData: requestData,
    createOptions: createOptions,
    saveData: saveData
}
