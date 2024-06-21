alphaNum = "";

intervals = [[48, 57], [65, 90], [97, 122]];

for(let interval of intervals) {
    for(let i = interval[0]; i<=interval[1]; i++) {
        alphaNum += String.fromCharCode(i);
    }
}

function generateToken(n) {
    let token = "";
    for(let i=0; i<n; i++) {
        token += alphaNum[Math.floor(Math.random() * alphaNum.length)];
    }
    return token;
}

module.exports.generateToken = generateToken;