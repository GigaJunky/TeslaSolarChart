const request = require('./requestas')
    , fs = require('fs')
    , datapath = './data/'
    , jd = JSON.parse(fs.readFileSync(`../private/.token`).toString()) //./node_modules/teslajs/samples/.token
    , options = { authToken: jd.access_token }

let opts = {
    "host": "owner-api.teslamotors.com"
    , "path": '/api/1/vehicles'
    , headers: {
        Authorization: "Bearer " + options.authToken
        , 'Content-Type': 'application/json; charset=utf-8'
        , "x-tesla-user-agent": "TeslaApp/3.4.4-350/fad4a582e/android/8.1.0"
        , "user-agent": "Mozilla/5.0 (Linux; Android 8.1.0; Pixel XL Build/OPM4.171019.021.D1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/68.0.3440.91 Mobile Safari/537.36"
    }
}

function createReqestOpts(cmd, params) {
    const prefix = '/api/1/'
        , cmds = {
            products: { path: `${prefix}${cmd}` }
            , vehicles: { path: `${prefix}vehicles/` }
            , vehicle: { path: `${prefix}vehicles/${params.id_s}/vehicle_data` }
            , wake_up: { path: `${prefix}vehicles/${params.id_s}/${cmd}`, method: 'POST' },

            honk_horn: { path: `${prefix}vehicles/${params.id_s}/command/${cmd}`, method: 'POST' }
            , flash_lights: { path: `${prefix}vehicles/${params.id_s}/command/${cmd}`, method: 'POST' }
            , charge_start: { path: `${prefix}vehicles/${params.id_s}/command/${cmd}`, method: 'POST' }
            , charge_stop: { path: `${prefix}vehicles/${params.id_s}/command/${cmd}`, method: 'POST' }
            , door_lock: { path: `${prefix}vehicles/${params.id_s}/command/${cmd}`, method: 'POST' }
            , door_unlock: { path: `${prefix}vehicles/${params.id_s}/command/${cmd}`, method: 'POST' }
            , auto_conditioning_start: { path: `${prefix}vehicles/${params.id_s}/command/${cmd}`, method: 'POST' }
            , auto_conditioning_stop: { path: `${prefix}vehicles/${params.id_s}/command/${cmd}`, method: 'POST' },

            solar: { path: `${prefix}energy_sites/${params.energy_site_id}/history?kind=${params.kind}&date=${params.date}&period=${params.period}&time_zone=${params.time_zone}` }

        }
        , c = cmds[cmd]
    opts.method = c.method || 'GET'
    opts.path = c.path || `${prefix}${cmd}`
        //console.log('opts:', opts)
    return opts
}

async function getData(cmd = 'vehicles', params = {}) {
    try {
        const fn = (cmd == 'solar') ? `${datapath}${params.kind}${params.period}${params.date.substring(0,10)}.json` : `${datapath}${cmd}.json`
        console.log(fn)
        let vehIndex = params.vehIndex || 0
        let FileRefreshSecs = params.FileRefreshSecs || 3600
        if (fs.existsSync(fn)) {
            let stats = fs.statSync(fn)
                , fsecs = (Math.round((Date.now() - stats.ctimeMs) / 1000))
                , fd = await JSON.parse(fs.readFileSync(`${datapath}${cmd}.json`))
            vd = fd.response
            if (Array.isArray(fd.response)) {
                if (vehIndex > fd.response.length) vehIndex = 0
                vd = fd.response[0]
            }

            console.log(fn, vd.state, fsecs, vehIndex)
            if (vd.state && vd.state == 'online' && fsecs < FileRefreshSecs) return await fd.response
        }

        const opts = createReqestOpts(cmd, params)
        console.log('opts:', opts.path)
        const d = await request(opts)
        fs.writeFileSync(fn, d)
        return JSON.parse(d).response
    } catch (e) {
        return { e }
    }
}

module.exports = { getData: getData }