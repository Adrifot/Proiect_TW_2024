alphaNum = "";

// Intervals representing ranges of ASCII codes for digits, uppercase, and lowercase letters
intervals = [[48, 57], [65, 90], [97, 122]];

// Generate a string containing all alphanumeric characters
for (let interval of intervals) {
    for (let i = interval[0]; i <= interval[1]; i++) {
        alphaNum += String.fromCharCode(i);
    }
}

/**
 * Generates a random alphanumeric token of the specified length.
 * @param {number} n - The length of the token to generate.
 * @returns {string} The generated token.
 */
function generateToken(n) {
    let token = "";
    for (let i = 0; i < n; i++) {
        token += alphaNum[Math.floor(Math.random() * alphaNum.length)];
    }
    return token;
}

module.exports.generateToken = generateToken;
