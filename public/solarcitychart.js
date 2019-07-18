
let
    urlprefix = location.protocol + '//' + location.host + '/' //'http://localhost:3000/' //'https://cors-anywhere.herokuapp.com/'
ctx = document.getElementById('canvas').getContext('2d'),
    tbStartDate = document.getElementById('tbStartDate'),
    lblMsg = document.getElementById('lblMsg')
    , config = { "CustomerGUID": "6351eab8-be81-486f-801d-2c30080868bb", "DefaultInstallationGUID": "ab575606-2afc-4612-b600-b9a936b1fa8d" }
    , time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    , wcfg = { DarkSkyID: -1, Lat: -1, Long: -1 }

    , chartData = {
        type: 'bar',
        data: {
            labels: ['12am', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, '12pm', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            datasets: [
                { type: 'bar' , label: 'Production 1', backgroundColor: 'hsla(240, 100%, 40%, 0.7)', borderWidth: 1 },
                { type: 'bar' , label: 'Production 2', backgroundColor: 'hsla(240, 100%, 70%, 0.7)' },
                { type: 'line', label: 'Consumption', borderColor: 'gray', backgroundColor: 'rgba(128, 128, 128, 0.4)', borderWidth: 1, fill: true },
                { type: 'line', label: 'Temp', yAxisID: 'Temp', borderColor: 'green', borderWidth: 1, fill: false },
                { type: 'line', label: 'UV', yAxisID: 'UV', borderColor: 'red', borderWidth: 1, fill: false },
                { type: 'line', label: 'Cloud Cover', borderColor: 'yellow', borderWidth: 1, fill: false, yAxisID: 'Cloud Cover' },
                { type: 'line', label: 'Visibility', borderColor: 'blue', borderWidth: 1, fill: false, yAxisID: 'Visiblity' }

            ]
        },
        options: {
            title: { display: true, text: 'Solar City Solar Production' },
            tooltips: { mode: 'index', intersect: false },
            responsive: true,
            scales: {
                xAxes: [{ stacked: true }],
                yAxes: [
                    { stacked: true },
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
solarCityCmd()

function createCmdUrl(type, sStartDate, sEndDate) {
    return `${urlprefix}https://mysolarcity.com/solarcity-api/powerguide/v1.0/${type}/${config.DefaultInstallationGUID}?ID=${config.CustomerGUID}&IsByDevice=true&Period=Hour&StartTime=${sStartDate.substr(0,10)}T00:00:00&EndTime=${sEndDate.substr(0,10)}T23:59:59`
}
function createDSdUrl(sDate) {
    let utime = Math.round((new Date(sDate).getTime()) / 1000)
    // -1 to be provided by proxyserver
    return `${urlprefix}https://api.darksky.net/forecast/${wcfg.DarkSkyID}/${wcfg.Lat},${wcfg.Long},${utime}`
}


function solarCityCmd() {
    let cd, cache, sStartDate = tbStartDate.value, sEndDate = sStartDate
        , ls = localStorage.getItem(sStartDate)
    cache = document.getElementById('cbCache').checked && ls !== null

    if (cache) {
        cd = JSON.parse(ls)
        cache = valData(cd)
    }

    if (cache) LoadChart(cd)
    else {
        let type = 'measurements',
            cmd = createCmdUrl(type, sStartDate, sEndDate)
        ajax(cmd, (m) => {
            console.log('m: ', cmd, type, m)
            lblMsg.innerText = m.Message ? m.Message : ''

            type = 'consumption'
            cmd = createCmdUrl(type, sStartDate, sEndDate)
            ajax(cmd, (c) => {
                console.log('solarCity Command: ', cmd, type, c)
                lblMsg.innerText = m.Message ? m.Message : ''
                getWeather(sStartDate, w => {
                    let cd = { ...reduceDataSC({ m, c}), ...ReduceWeather(w) }
                    localStorage.setItem(sStartDate, JSON.stringify(cd))
                    LoadChart(cd)
                })

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

function reduceDataSC(data) {
    var day = data.m.Devices[0].Measurements[0].Timestamp.substr(0, 10)
        , c = data.c.Consumption.map(o => o.ConsumptionInIntervalkWh)
        , e = [], temp = [], uv = []
    //for (let i=0;i<data.m.Devices.length; i++) e[i] = data.m.Devices[i].Measurements.map(o => o.EnergyInIntervalkWh) // not allways 24
    data.m.Devices.forEach((d, i) => e[i] = Measureto24HoursSC(d.Measurements))
    return { day, e: e, c, retrieved: new Date().toISOString() }
}

function valData(mc) {
    return mc.c && mc.c.length >= 24 && mc.e && Array.isArray(mc.e)
}

function SumArray(a) {
    if (a !== undefined && a.length < 2) return a[0]
    let r = []
    for (let i = 0; i < a[0].length; i++)
        r[i] = a[0][i] + a[1][i]
    return r
}

function Measureto24HoursSC(a) {
    let m = []
    for (let h = 0; h < 24; h++) {
        let o = a.filter(o => new Date(o.Timestamp).getHours() === h)
        m[h] = o[0] ? o[0].EnergyInIntervalkWh : 0
    }
    return m
}


function LoadChart(data) {
    console.log('lc: ', data)
    let s = SumArray(data.e)
    lblMsg.innerText = 'Production: ' + (Sum(s)).toFixed(2) + '  Consumption: ' + Sum(data.c).toFixed(2)
    let ds = chartData.data.datasets
    ds[1].data = []

    if (document.getElementById('cbCombine').checked)
        ds[0].data = s //data.e[0];
    else
        data.e.forEach((e, i) => {
            console.log('e fe: ', e, i)
            ds[i].data = e
        })
    ds[2].data = data.c
    ds[3].data = data.temp
    ds[4].data = data.uv
    ds[5].data = data.cloudCover
    ds[6].data = data.visibility

    myChart.options.title.text = 'Solar Production ' + data.day
    myChart.update()
}

function DateInc(days) {
    tbStartDate.value =  DateAdd(tbStartDate.value, days)
    solarCityCmd()
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
  
  
