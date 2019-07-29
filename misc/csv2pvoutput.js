const fs = require('fs')
    , pvo = require('./pvoutputAPI')
    , filename = process.argv[2] || 'pvout.csv'
    , csv = fs.readFileSync(filename).toString()
    , lines = csv.match(/[^\r\n*]+/g);
    lines.forEach((l,i) => {
        if(i!==0) pvo.pvoutput( { data: l })
    })
