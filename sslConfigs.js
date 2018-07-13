var path = require('path');
var fs = require('fs');

exports.privateKey = fs.readFileSync(path.join(__dirname, '/certificates/privatekey.pem')).toString();
exports.certificate = fs.readFileSync(path.join(__dirname, '/certificates/certificate.pem')).toString();
