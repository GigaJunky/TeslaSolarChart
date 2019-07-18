let urlprefix = location.protocol + '//' + location.host + '/'
    , products = `${urlprefix}https://owner-api.teslamotors.com/api/1/products`
    , site, live_status
    , lblMsg = document.getElementById("lblMsg")
    , tbIntervalSecs = document.getElementById('tbIntervalSecs')
    , IntervalSecs = tbIntervalSecs.value * 1000  //1 * 1000
    , ctx = document.getElementById('canvas').getContext('2d')
    , chartData = {
        datasets: [
            { type: 'line', fill: false, label: 'Grid', borderColor: 'red' },
            { type: 'line', fill: false, label: 'Solar', borderColor: 'yellow' },
            { type: 'line', fill: false, label: 'Home', borderColor: 'green' }
        ]
    },
    myChart = new Chart(ctx, {
        type: 'bar', data: chartData,
        options: {
            title: { display: true, text: 'Solar Production Realtime' }
            , tooltips: { mode: 'index', intersect: true }
            , responsive: true,
            scales: {
                xAxes: [{ gridLines: { color: 'darkgray', lineWidth: 0.2 } } ],
                yAxes: [{ gridLines: { color: 'lightgray', lineWidth: 0.4, zeroLineColor: 'lightgray' } }]
              },
        }
    })


getSiteID()

document.getElementById('tbIntervalSecs').addEventListener('change', () => {
    IntervalSecs = tbIntervalSecs.value * 1000
})


console.log(IntervalSecs)
let teTimmer = setInterval(getStatus, IntervalSecs)

function stop() { window.clearInterval(teTimmer) }
function start() { teTimmer = setInterval(getStatus, IntervalSecs) }

function getSiteID() {
    ajax(products, r => {
        let p = r.response.filter(s => s.resource_type === 'solar')
        site = p[0].energy_site_id
        live_status = `${urlprefix}https://owner-api.teslamotors.com/api/1/energy_sites/${site}/live_status`
        getStatus()
    })
}

function getStatus() {
    const factor = 1000
    ajax(live_status, r => {
        if (r.error) {
            stop()
            lblMsg.innerHTML = r.error
        } else {
            let d = r.response
            console.log(d.grid_power, r.response)
            lblMsg.innerHTML = d.grid_power + ' ' + d.timestamp;
            chartData.labels.push(labelformat(d.timestamp))
            chartData.datasets[0].data.push(d.grid_power / factor)
            chartData.datasets[1].data.push(d.solar_power / factor)
            chartData.datasets[2].data.push(d.load_power / factor)
            myChart.update()
        }
    })
}

function labelformat(sDate) {
    let d = new Date(sDate)
    return d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds()
}
