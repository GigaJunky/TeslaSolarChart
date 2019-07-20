const http = require('http')
    , fs = require('fs')
    , url = require('url')
    , request = require('./request')
    , public = fs.readdirSync('public').map(f => f.toLowerCase())
    , port = process.argv[2] || 3000 
//, crypto = require('crypto')
    let cfg, dscfg = { DarkSky: -1, Lat: -1, Long: -1}
    
    const  os = require('os'), dns = require('dns')
    dns.lookup(os.hostname(),  (err, ip, fam) => console.log(`hostname: http://${os.hostname()}:${port} ip: http://${ip}:${port}`))

    if(!fs.existsSync('./private/teslatoken.json')){
        console.error('No teslatoken.json. Run node misc/login.js email password first and try again.')
        process.exit()
    } else
    cfg = JSON.parse(fs.readFileSync('./private/teslatoken.json'))

    if(!fs.existsSync('./private/darkskyconfig.json')){
        console.error('No darkskyconfig.json. No Weather will be provided. Goto https://darksky.net/dev and sign up for a free key')
    } else{
        dscfg = JSON.parse(fs.readFileSync('./private/darkskyconfig.json'))
        if(dscfg.DarkSkyID.length !== 32) console.warn('Invalid DarkSky Weather API Key.')
    }

const requestHandler = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    let sUrl = req.url.substr(1).toLowerCase()

    let now = new Date().toISOString()//.substr(0, 10)
    console.log('server request: ', now, sUrl)

    let q = url.parse(sUrl, true)
    if (public.includes(q.pathname))
        return res.end(fs.readFileSync('public/' + q.pathname))

    //console.log(q)
    let Port = q.port
    if (q.port === null) if (q.protocol === 'https:') Port = 443; else Port = 80

    let options = { method: 'GET', host: q.hostname, port: Port, path: q.path, headers: {}, protocol: q.protocol }
    //console.log('options:', options)
    let fn = '', m, groups
    switch (q.host) {
        case 'owner-api.teslamotors.com':
            //console.log('response headers: ', req.headers.authorization) //, req.headers)
            options.headers = {
                "user-agent": "Mozilla/5.0 (Linux; Android 8.1.0; Pixel XL Build/OPM4.171019.021.D1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/68.0.3440.91 Mobile Safari/537.36"
                , "x-tesla-user-agent": "TeslaApp/3.4.4-350/fad4a582e/android/8.1.0",
                'Authorization': "Bearer " + cfg.access_token,
                'Content-Type': 'application/json; charset=utf-8'
            }
            if (q.path.endsWith('live_status')) fn = 'nosave'
            else if (q.path.endsWith('products')) fn = fn = `${q.host}_products.json`
            else fn = `${q.host}_${q.path}.json`
                
            if (q.query.kind === 'energy' || q.query.kind === 'power') {
                let dd = DaysDif(q.query.date.substr(0, 10))
                if(dd === 0) q.query.date = DateAdd(q.query.date.substr(0,10),  -1 ) //todays starts with yesterday data
                fn = `${q.host}_${q.query.kind}_${q.query.date.substr(0, 10)}_${q.query.period}.json`
                // currently tesla is ingoring the date and only sending data from the beginging of yesterday 12am. so you will need to read cached data for each day prior
                //return res.end(JSON.stringify( { error: 'no data cached' } ))
                if (dd > 0) { //future
                    console.log('totday file: ', fn)
                    if (!fs.existsSync('data/' + fn))
                        return res.end(JSON.stringify({ error: 'no data cached' }))
                } else if (dd === 0){ //delete to force latest for today only
                    if (fs.existsSync('data/' + fn)) fs.unlinkSync('data/' + fn)
                }else { //past
                    if (!fs.existsSync('data/' + fn))
                        return res.end(JSON.stringify({ error: 'no data cached' }))
                }
            }

            break
        case 'api.darksky.net':
            //let dsre = /(?<DarkSkyID>[0-9A-F-]*)\/(?<lat>[0-9.-]*),(?<long>[0-9.-]*),(?<utime>\d*)$/i
            let dsre = /([0-9A-F-]*)\/([0-9.-]*),([0-9.-]*),([0-9-:TZ.]*)$/i
            m = q.pathname.match(dsre)
            groups = { DarkSkyID: m[1], lat: m[2], long: m[3], utime: m[4] }
            console.log('wgroups:', groups, dscfg)
            if (groups.DarkSkyID === '-1') { //flag to provide config from proxy server
                q.pathname = `/forecast/${dscfg.DarkSkyID}/${dscfg.Lat},${dscfg.Long},${groups.utime.toUpperCase()}`
                console.log('pathname: ', q.pathname)
                options.path = q.pathname
                m = q.pathname.match(dsre)
            }
            //let wd = new Date(groups.utime * 1000).toISOString().slice(0, 10)
            let wd = groups.utime.slice(0, 10)
            fn = `${q.host}_${wd}_${dscfg.Lat}_${dscfg.Long}.json`
            break

        case 'mysolarcity.com':
            //m = q.pathname.match(/(?<type>\w*)\/(?<installId>[0-9A-F\-]{36,36})$/i)
            m = q.pathname.match(/(\w*)\/([0-9A-F\-]{36,36})$/i)
            groups = {type: m[1], installId: m[2] }
            if (m && q.query.starttime) fn = `mysolarcity.com_${groups.type}_${q.query.starttime.slice(0, 10)}_${q.query.period}.json`
            else if (m && groups.type === 'share')
                fn = 'SaveSolarCityConfig'
            else fn = `${q.host}${q.path}.json`
            break

        default:
            //console.log('q: ', q)
            console.log(sUrl)
            if (q.href === '') {
                if (public.includes('index.html')) return res.end(fs.readFileSync('public/index.html'))
                return res.end('Type in a url')
            }
            if (q.host === null) return res.end('No Host:' + q.href)
            //console.log('req headers: ', req.headers)
            //let fn = options.host + crypto.createHash('md5').update(q.path).digest("hex")
            //fn = q.host + q.path.replace(/[\/\\:*>?"<>|]/g, "_")
            //fn = `data/${fn}.txt`
            fn = `${q.host}${q.path}.txt`
    }

    //request new data or return cached
    fn = 'data/' + safeFileName(fn).toLowerCase()
    if (fs.existsSync(fn)) {
        fs.readFile(fn, (ferr, fdata) => {
            if (ferr) throw ferr
            console.log('read fle: ', fn)
            return res.end(fdata)
        })
    } else {
        request(options, (err, data) => {
            //console.log('res headers: ', res.headers)
            if (err) console.log('err:', err)
            if (fn.includes('savesolarcityconfig')) {
                let scc = SaveSolarCityConfig(data)
                return res.end(`Solar City Shared url atempted search and save. Saving to private/solarcityconfig.json:
                CustomerGUID: ${scc.CustomerGUID}, DefaultInstallationGUID: ${scc.DefaultInstallationGUID}`)
            }

            if (data && !fn.includes('nosave'))
                fs.writeFile(fn, data, (err) => {
                    if (err) console.log(err)
                    console.log(`File Saved ${fn} Byte: ${data.length}  ${data.slice(0, 10)}...`)
                })
            res.end(data)
        })
    }
}
const server = http.createServer(requestHandler)

server.listen(port, (err) => {
    if (err) return console.log('something bad happened', err)
    console.log(`server is listening on ${port}`)
})

/**** utility functions ****/

function DaysDif(sday) {
    let today = new Date()
    today.setHours(0, 0, 0, 0)
    let day = new Date(sday)
    day.setHours(0, 0, 0, 0)
    let dd = (new Date(day) - today)
    console.log(sday, today, day, Math.floor(dd / 24 / 60 / 60 / 1000) + 1)
    return Math.floor(dd / 24 / 60 / 60 / 1000) + 1
}

function safeFileName(fn) { return fn.replace(/[\/\\:*>?"<>|]/g, "_") }

function SaveSolarCityConfig(data) {
    let cfg = {
        CustomerGUID: SearchForGuidByName(data, 'CustomerGUID')
        , DefaultInstallationGUID: SearchForGuidByName(data, 'DefaultInstallationGUID')
    }
    console.log('SaveSolarCityConfig: ', cfg.CustomerGUID, cfg.DefaultInstallationGUID)
    fs.writeFileSync('private/solarcityconfig.json', JSON.stringify(cfg))
    return cfg
}

function SearchForGuidByName(str, name) {
    let re = new RegExp(`"${name}":"([a-z0-9-"]*)"`, "i")
    let m = str.match(re)
    if (m) return m[1]
    return null
}

function DateAdd(day, days) {
    let d = new Date(day)
    d.setDate(d.getDate() + days)
    return d.toISOString().substr(0, 10)
}
