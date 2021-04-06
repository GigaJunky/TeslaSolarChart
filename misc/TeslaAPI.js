const fs = require('fs')
    , request = require('../request')
    , tauth = require('../private/teslatoken')
    , datapath = '../data/'

function saveData(data, query) {
    let jdata = JSON.parse(data)
    if (jdata.response && jdata.response.time_series && jdata.response.time_series.length > 0) {
        let kind = 'power', period = '_day'
        if (jdata.response.period) {
            kind = 'energy'
            period = '_' + jdata.response.period
        }

        let ts = jdata.response.time_series
            , sStartDate = ts[0].timestamp.substr(0, 10)
        sEndDate = ts[ts.length - 1].timestamp
        let fn = `${datapath}owner-api.teslamotors.com_${kind}_${sStartDate.substr(0, 10)}${period}.json`
        console.log('len: ', ts.length, 'Start: ', sStartDate, 'End: ', sEndDate, 'filename: ', fn)
        fs.writeFileSync(fn, data)
    } else {
        let fn = `${datapath}owner-api.teslamotors.com_${query.kind}_${new Date().toISOString().substr(0, 10)}.json`
        if (query.kind === 'products') fn = `${datapath}owner-api.teslamotors.com_${query.kind}.json`
        if (query.kind !== 'wake_up') fs.writeFileSync(fn, data)
    }
}

function createOptions(query) {
    let energy_site_id = 0, vehicle_id
        , time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone

    if (query.kind !== 'products') {
        let tproducts = JSON.parse(fs.readFileSync(datapath + 'owner-api.teslamotors.com_products.json'))
        let s = tproducts.response.filter(s => s.resource_type === 'solar')
        energy_site_id = s[0].energy_site_id
        let v = tproducts.response.filter(s => s.vehicle_id != undefined)
        if (v.length > 0) {
            vehicle_id = v[0].id_s
            if (query.kind === 'vehicles') {
                console.log('Cool!, You have a Tesla Vehicle named: ', v[0].display_name, v[0].vin, v[0].state)
                if (v[0].state != 'online') {
                    console.log('Waking up... Try again in a about a minute')
                    query.kind = 'wake_up'
                }
            }
        }
    }

    // currently tesla is ingoring the date and only sending data from the beginging of yesterday 12am. so you will need to read cached data for each day prior
    let d = query.date ? new Date(query.date) : new Date()
    d.setHours(0, 0, 0, 0)
    let qdate = d.toISOString()
    let cmd = '', method = 'GET'
    switch (query.kind) {
        case 'honk_horn':
            cmd = `/api/1/vehicles/${vehicle_id}/command/honk_horn`
            method = 'POST'
            break
        case 'wake_up':
            cmd = `/api/1/vehicles/${vehicle_id}/wake_up`
            method = 'POST'
            break
        case 'vehicles':
            cmd = `/api/1/vehicles/${vehicle_id}/vehicle_data`
            break

        case 'energy':
        case 'power':
            cmd = `/api/1/energy_sites/${energy_site_id}/history?kind=${query.kind}&date=${qdate}&period=${query.period}&time_zone=${time_zone}`
            break
        default:
            cmd = `/api/1/products`
            break
    }
    console.log('cmd:', cmd)
    return {
        method: method,
        host: 'owner-api.teslamotors.com',
        port: 443,
        path: cmd,
        headers: {
            'user-agent':
                'Mozilla/5.0 (Linux; Android 8.1.0; Pixel XL Build/OPM4.171019.021.D1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/68.0.3440.91 Mobile Safari/537.36',
            'x-tesla-user-agent': 'TeslaApp/3.4.4-350/fad4a582e/android/8.1.0',
            Authorization: 'Bearer ' + tauth.access_token,
            'Content-Type': 'application/json; charset=utf-8',
        },
    }
}

function requestData(query, cb) {
    request(createOptions(query), (err, res) => {
        if (err) {
            if (cb) cb(err, null)
        } else {
            saveData(res, query)
            if (cb) cb(null, res)
        }
    })
}

module.exports = {
    requestData: requestData,
    createOptions: createOptions,
    saveData: saveData,
}
