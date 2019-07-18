function ajax(url, cb) {
    request({ url: url, headers: { 'Content-Type': 'application/json' } }, (e, r) => cb(JSON.parse(r)))
}

function request(options, cb) {
    var xhr = new XMLHttpRequest()
    xhr.open(options.type || 'GET', options.url, true)
    xhr.onload = () => { cb(null, xhr.responseText) }
    xhr.onerror = () => { cb(xhr.statusText, null) }
    Object.entries(options.headers).forEach(h => {
        console.log(h[0], '=', h[1])
        xhr.setRequestHeader(h[0], [1])
    })
    xhr.withCredentials = true
    if(options.data) 
         xhr.send(options.data)
    else xhr.send()
}
