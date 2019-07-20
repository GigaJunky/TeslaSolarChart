
let
    urlprefix = location.protocol + '//' + location.host + '/' //'http://localhost:3000/' //'https://cors-anywhere.herokuapp.com/'
    , ctx = document.getElementById('canvas').getContext('2d'),
    tbStartDate = document.getElementById('tbStartDate'),
    lblMsg = document.getElementById('lblMsg')
    , site, products = `${urlprefix}https://owner-api.teslamotors.com/api/1/products`
    , time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    , wcfg = { DarkSkyID: -1, Lat: -1, Long: -1 }

    , chartData = {
        type: 'bar',
        data: {
            labels: ['12am', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, '12pm', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            datasets: [
                { type: 'bar', label: 'Solar', backgroundColor: 'hsla(240, 100%, 40%, 0.7)', borderWidth: 1 },
                { type: 'line', label: 'Grid', borderColor: 'gray', borderWidth: 1, fill: true, backgroundColor: 'rgba(128, 128, 128, 0.4)' },
                { type: 'line', label: 'Temp', borderColor: 'green', borderWidth: 1, fill: false, yAxisID: 'Temp' },
                { type: 'line', label: 'UV', borderColor: 'red', borderWidth: 1, fill: false, yAxisID: 'UV' },
                { type: 'line', label: 'Cloud Cover', borderColor: 'yellow', borderWidth: 1, fill: false, yAxisID: 'Cloud Cover' },
                { type: 'line', label: 'Visibility', borderColor: 'blue', borderWidth: 1, fill: false, yAxisID: 'Visiblity' }
    
            ]
        },
        options: {
            title: { display: true, text: 'Solar Production' },
            tooltips: { mode: 'index', intersect: false },
            responsive: true,
            scales: {
                xAxes: [{ stacked: true, gridLines: { color: 'darkgray', lineWidth: 0.2 } }],
                yAxes: [
                    { stacked: true, gridLines: { color: 'lightgray', lineWidth: 0.4, zeroLineColor: 'lightgray' } },
                    { id: 'Temp', type: 'linear', position: 'right' },
                    { id: 'UV', type: 'linear', position: 'right', ticks: { max: 10, min: 0 } },
                    { id: 'Cloud Cover', type: 'linear', position: 'right', ticks: { max: 1, min: 0 } },
                    { id: 'Visiblity', type: 'linear', position: 'right', ticks: { max: 10, min: 0 } }
                ]
            }
        }
    }
    , myChart = new Chart(ctx, chartData)
    
tbStartDate.value = getToday()

getLocation()
getSiteID()

function getSiteID() {
    ajax(products, r => {
        let p = r.response.filter(s => s.resource_type === 'solar')
        site = p[0].energy_site_id
        live_status = `${urlprefix}https://owner-api.teslamotors.com/api/1/energy_sites/${site}/live_status`
        TeslaEnergyCmd()
    })
}

function createTCmdUrl(kind, sStartDate) {
    let now = new Date(sStartDate).toISOString()
    return `${urlprefix}https://owner-api.teslamotors.com/api/1/energy_sites/${site}/history?kind=${kind}&date=${now}&period=day&time_zone=${time_zone}`
}

function createDSdUrl(sDate) {
    //let utime = Math.round((new Date(sDate).getTime()) / 1000)
    let utime = sDate + 'T00:00:00'
    // -1 to be provided by proxyserver
    return `${urlprefix}https://api.darksky.net/forecast/${wcfg.DarkSkyID}/${wcfg.Lat},${wcfg.Long},${utime}`
}

function TeslaEnergyCmd() {
    let cd, cache, sStartDate = tbStartDate.value
        , ls = localStorage.getItem(sStartDate)
    cache = document.getElementById('cbCache').checked && ls !== null

    if (cache) {
        cd = JSON.parse(ls)
        cache = valData(cd)
    }

    if (cache) LoadChart(cd)
    else {
        cmd = createTCmdUrl('power', sStartDate)
        ajax(cmd, (c) => {
            lblMsg.innerText = c.error ? c.error : ''
            if (!c.error)
                getWeather(sStartDate, w => {
                    let cd = { ...ReduceDataTE(c), ...ReduceWeather(w) }
                    localStorage.setItem(sStartDate, JSON.stringify(cd))
                    LoadChart(cd)
                })
        })
    }
}

function getWeather(sStartDate, cb) {
    console.log('getWeather: ', wcfg, wcfg.DarkSkyID !== -1)
    if(wcfg.DarkSkyID === -2) return cb (null)
    ajax(createDSdUrl(sStartDate), w => {
        console.log('w: ', w)
        cb(w)
    })
}

function ReduceWeather(w) {
    console.log('ReduceWeather: ', w)
    if(w === null || w.error) return { temp: [], uv: [], cloudCover: [], visibility: [] }
    temp = w.hourly.data.map(o => o.temperature)
    uv = w.hourly.data.map(o => o.uvIndex)
    cloudCover = w.hourly.data.map(o => o.cloudCover)
    visibility = w.hourly.data.map(o => o.visibility)
    return { temp, uv, cloudCover, visibility }
}

function ReduceDataTE(data) {
    console.log('ReduceDataTE: ', data)
    let ts = data.response.time_series
        , sStartDate = tbStartDate.value //ts[0].timestamp
        , day = ts.filter(o => o.timestamp.substr(0, 10) === sStartDate.substr(0, 10))
        , m = Measureto24HoursTE(day)
        , d = {
            day: m.day.substr(0, 10), e: m.e, c: m.c,
            retrieved: new Date().toISOString()
        }
    console.log('ts: ', ts.length, ts[0].timestamp, ts[ts.length - 1].timestamp, tbStartDate.value)
    return d
}

function Measureto24HoursTE(a) {
    let sp = []
    let gp = []
    for (let h = 0; h < 24; h++) {
        let o = a.filter(o => new Date(o.timestamp).getHours() === h)
        if (o.length > 0) {
            let s = Sum(o.map(s => s.solar_power))
            let g = Sum(o.map(s => s.grid_power))
            sp[h] = s / 4 / 1000
            gp[h] = g / 4 / 1000
        }
    }
    return { day: a[0].timestamp, e: [sp], c: gp }
}

function valData(cd) { return cd.c && cd.c.length >= 24 && cd.e && Array.isArray(cd.e) }

function LoadChart(data) {
    console.log('lc: ', data)
    let s = data.e[0]
    lblMsg.innerText = 'Production: ' + (Sum(s)).toFixed(2) + '  Consumption: ' + Sum(data.c).toFixed(2)
    let ds = chartData.data.datasets
    ds[0].data = s //solor
    ds[1].data = data.c //grid
    ds[2].data = data.temp
    ds[3].data = data.uv
    ds[4].data = data.cloudCover
    ds[5].data = data.visibility
    chartData.options.title.text = 'Solar Production ' + data.day
    myChart.update()
}

function DateInc(days) {
    tbStartDate.value =  DateAdd(tbStartDate.value, days)
    TeslaEnergyCmd()
}

function getLocation() {
    if (navigator.geolocation) 
      navigator.geolocation.getCurrentPosition(position => {
        wcfg.Lat = position.coords.latitude
        wcfg.Long = position.coords.longitude
        console.log("Latitude: ", wcfg.Lat, "Longitude: ", wcfg.Long)
      } )
     else console.log("Geolocation is not supported by this browser.")
  }
  
  
