async function main()
{
    const tapi = require('./teslaapias')
    let products = await tapi.getData('products')
    for (const p of products) {
        console.log(p.display_name || p.site_name)
    }
    //console.log('products: ', products)


    data = await tapi.getData('vehicles')
    //console.log('data: ', data)
    const vehicle = data[0]
    console.log(`Vehicle ${vehicle.display_name} vin: ${vehicle.vin} is: ${vehicle.state} id_s: ${vehicle.id_s} `);

    if(vehicle.state == 'online'){
        vehicle.vehIndex = 0
        data = await tapi.getData('vehicle', vehicle)
        //await tapi.getData('honk_horn', vehicle)
        var cs = data.charge_state;
        console.log(`Current charge level: ${cs.battery_level}% Battery Range ${cs.battery_range}, est ${cs.est_battery_range} `)

        let max_range = cs.battery_range / (cs.battery_level / 100)
        console.log(`Max Range: ${Math.round(max_range)}  miles`)
        let est_max_range =  cs.est_battery_range / (cs.battery_level / 100)
        console.log(`Est Max Range: ${Math.round(est_max_range)}  miles`)
        
        let ds = data.drive_state
        console.log(`heading: ${ds.heading} latitude: ${ds.latitude} longitude: ${ds.longitude} `)

        let vs = data.vehicle_state
        console.log(`car_version: ${vs.car_version} odometer: ${vs.odometer} homelink_nearby: ${vs.homelink_nearby} `)

    }else{
        await tapi.getData('wake_up', vehicle)
        console.log('Waking up... Try again in a about a minute')
    }
}

(async () => {
    try{ await main() }
    catch(e){ console.log('error:', e) }
})()
    
