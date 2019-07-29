const request = require('../request')
    , pvheaders = require('../private/pvoutput')
    , qs = require('querystring')

function pvoutput(data) {
    let options = { method: 'post', host: 'pvoutput.org', port: 443, headers: pvheaders, path: '/service/r2/addoutput.jsp?' + qs.encode(data) }
    request(options, (err, res) => {
        console.log(data, err, res)
    })
}

module.exports = { pvoutput }

