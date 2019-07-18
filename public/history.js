let site, live_status, urlprefix = location.protocol + '//' + location.host + '/'
    , products = `${urlprefix}https://owner-api.teslamotors.com/api/1/products`, hist
    , ctx = document.getElementById('canvas').getContext('2d')
    , lblMsg = document.getElementById("lblMsg")
    , chartData = {
        type: 'bar', data: {
            datasets: [
                { type: 'bar', fill: true, label: 'Home', backgroundColor: 'blue', stack: 0 }
                , { type: 'bar', fill: true, label: 'Solar', backgroundColor: 'yellow', stack: 1 }
                , { type: 'bar', fill: true, label: 'From Grid', backgroundColor: 'darkgray', stack: 2 }
                , { type: 'bar', fill: true, label: 'To Grid', backgroundColor: 'gray', stack: 2 }
            ]
        },
        options: {
            title: { display: true, text: 'Solar Production History' }, tooltips: { mode: 'index', intersect: false }
            , responsive: true,  onClick: ChartOnClick,
            scales: {
                xAxes: [{ gridLines: { color: 'darkgray', lineWidth: 0.5 } } ],
                yAxes: [{ gridLines: { color: 'lightgray', lineWidth: 0.5, zeroLineColor: 'lightgray' } }]
              },
        }
    }
    ,myChart = new Chart(ctx, chartData)

getSiteID()

function getSiteID() {
    ajax(products, r => {
        let p = r.response.filter(s => s.resource_type === 'solar')
            site = p[0].energy_site_id
        hist = `${urlprefix}https://owner-api.teslamotors.com/api/1/energy_sites/${site}/history?kind=energy&date=${getToday()}&period=week&time_zone=America/Bogota`
        getHistory()
    })
}

function getHistory() {
    const factor = 1000
    ajax(hist, r => {
        console.log(r)
        if (r.error) {
            lblMsg.innerHTML = r.error
        } else {
            let ts = r.response.time_series
            lblMsg.innerHTML = r.response.period;
            ts.forEach(i => {
                let cd = chartData.data
                cd.labels.push(i.timestamp.slice(0, 10))
                cd.datasets[0].data.push(Math.round(i.consumer_energy_imported_from_grid + i.consumer_energy_imported_from_solar) / factor) // home usage
                cd.datasets[1].data.push(Math.round(i.solar_energy_exported) / factor) //solar generated
                cd.datasets[2].data.push(Math.round(i.grid_energy_imported) / factor) // from grid
                cd.datasets[3].data.push(Math.round(i.grid_energy_exported_from_solar) / factor * -1) // to grid
            })
            myChart.update()
        }
    })
}

function ChartOnClick(event, array) {
    
    let selected = myChart.getElementAtEvent(event)
    , dsI = selected[0]._datasetIndex

    , cd = array[dsI]['_chart'].config.data
    , idx = array[dsI]['_index']

    , label  = cd.labels[idx]
    , value  = cd.datasets[dsI].data[idx]
    , series = cd.datasets[dsI].label

    console.log(series + ':' + label + ':' + value)
    location.href = 'day.html?date=' + label
}
