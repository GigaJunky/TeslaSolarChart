const http = require('http')
,    https = require('https')

const request = async (params, postData) => {
/*
  const lib = url.startsWith('https://') ? https : http;
    port: port || url.startsWith('https://') ? 443 : 80,
*/
  const lib = https

  if(params.url){
    const u = new URL(params.url)
    if(u.protocol == 'http:') lib == http
    params.host = u.hostname
    params.port = u.port
    params.path = u.pathname + u.search
  }

  return new Promise((resolve, reject) => {
    const req = lib.request(params, res => {
      if (res.statusCode < 200 || res.statusCode >= 300) 
        return reject(new Error(`Status Code: ${res.statusCode}`))
      const data = []
      res.on('data', chunk => data.push(chunk))
      res.on('end', () => resolve(Buffer.concat(data).toString()))
    })
    req.on('error', reject)
    if (postData) req.write(postData)
    req.end()    // IMPORTANT
  })
}

/*
(async () => {
  try {
    const data = await request(
      'https://the-showman-and-the-g-clef-u8pmjbhb7ixy.runkit.sh',
    );
    console.log(data);
  } catch (error) {
    console.error(error);
  }
})();
*/

module.exports = request 