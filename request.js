const https = require('https')
const http = require('http')

module.exports = function request(options, cb)
{   
    let data = ''
    if(options.protocol === 'http:')
         p = http
    else p = https

    var req = p.request(options, (res) => {
        res.on('data',d => data += d )
        res.on('end', () => cb(null, data))
    })
    req.on("error", (e) => cb(e.message, null))
    if(options.body)req.write(options.body)
    req.end()
}

