const request = require('../request')
, fs = require('fs')
,client_id='e4a9949fcfa04068f59abb5a658f2bac0a3428e4652315490b659d5ab3f35a9e'
,client_secret='c75f14bbadc8bee3a7594412c31416f8300256d7668ea7e6e7f06727bfb9d220'

if(process.argv.length !== 4){
    console.log('node login.js email password')
    process.exit()
}

let postData = JSON.stringify({
    "grant_type": "password",
    "client_id": client_id,
    "client_secret": client_secret,
    "email": process.argv[2],
    "password": process.argv[3]
})
,options = {
    hostname: 'owner-api.teslamotors.com', port: 443, method: 'POST', path: '/oauth/token'
    , body: postData
    , headers: {
        "user-agent": "Mozilla/5.0 (Linux; Android 8.1.0; Pixel XL Build/OPM4.171019.021.D1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/68.0.3440.91 Mobile Safari/537.36"
        , "x-tesla-user-agent": "TeslaApp/3.4.4-350/fad4a582e/android/8.1.0"
        , 'Content-Type': 'application/json'
        , 'Content-Length': postData.length
    }
}

request(options, (err, res) => {
    if(err) console.log('err: ', err)
    else{
        if(res.error) console.log(res.error)
        else
        console.log('writing TeslaToken.json', res)
        fs.writeFileSync('./private/teslatoken.json', res)
    }
})
