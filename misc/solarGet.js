async function main()
{
    const tapi = require('./teslaapias')
    , time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    let now = new Date()
    now.setHours(0, 0, 0, 0)
    let qdate = process.argv[2] ? process.argv[2] : now.toISOString().substr(0, 10)

    let params = {"energy_site_id": 172341421520, kind: 'energy',
    date: qdate, period: 'day', time_zone: time_zone }
    let solar = await tapi.getData('solar', params )
    console.log(solar)
    params.period = 'month'
    solar = await tapi.getData('solar', params )
    console.log(solar)
    params.period = 'year'
    solar = await tapi.getData('solar', params )
    console.log(solar)

}

(async () => {
    try{ await main() }
    catch(e){ console.log('error:', e) }
})()
    
