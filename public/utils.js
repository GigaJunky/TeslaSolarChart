function getToday() {
    let params = new URLSearchParams(location.search)
    if (params.has('date')) return params.get('date')
    let d = new Date()
    d.setHours(0,0,0,0)
    return d.toISOString().substr(0, 10)
}

function DateAdd(day, days) {
    let d = new Date(day)
    d.setDate(d.getDate() + days)
    return d.toISOString().substr(0, 10)
}

function Sum(nums) { return nums.reduce((total, sum) => total + sum) }

