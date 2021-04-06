let now = new Date()
now.setHours(0, 0, 0, 0)
    , qdate = process.argv[2] ? process.argv[2] : now.toISOString().substr(0, 10)

const fs = require('fs')
    , datapath = '../data/'
    , time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    , params = {
        "energy_site_id": 172341421520
        , kind: 'energy'
        , time_zone: time_zone
        , date: qdate
        , period: 'year'
        , index: 11
    }

console.log('=== month ===')
console.log('Date\t\tSolar\tHome\t%\tNet')
SolarInfo(params)

params.period = 'month'
params.index = 1
console.log('=== week ===')
SolarInfo(params)


params.period = 'day'
params.index = 1
console.log('=== day ===')
SolarInfo(params)

function kWh(Wh) { return Math.round(Wh / 1000) }

function SolarInfo(params) {
    const fn = `${datapath}${params.kind}${params.period}${params.date.substring(0,10)}.json`
        , fd = JSON.parse(fs.readFileSync(fn))
        , ts = fd.response.time_series //[params.index]
    for (const i of ts) {
        let home = kWh(i.consumer_energy_imported_from_grid) + kWh(i.consumer_energy_imported_from_solar)
            , solar = kWh(i.solar_energy_exported)
        console.log(`${i.timestamp.substr(0,10)}\t${solar}\t${home}\t${Math.round(solar/home * 100)}\t${solar-home}`)

    }
    //console.log(ts, fd.response.time_series.length)

    /*
         From Grid: ${kWh(ts.grid_energy_imported)} kWh
           To Grid: ${kWh(ts.grid_energy_exported_from_solar)} kWh
           Home Grid: ${kWh(ts.consumer_energy_imported_from_grid)} kWh
           Home Solar: ${kWh(ts.consumer_energy_imported_from_solar)} kWh

    */
}