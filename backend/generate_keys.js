const { Keys } = require('casper-js-sdk');
const fs = require('fs');
const path = require('path');

const keysDir = path.join(__dirname, 'keys');
if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir);
}

const edKeyPair = Keys.Ed25519.new();
const privateKeyPath = path.join(keysDir, 'secret_key.pem');
const publicKeyPath = path.join(keysDir, 'public_key_hex.txt');

// Extract the raw private key bytes to save it
// The casper-js-sdk exports an Ed25519 keypair
const pem = edKeyPair.exportPrivateKeyInPem();
fs.writeFileSync(privateKeyPath, pem);

const pubHex = edKeyPair.accountHex();
fs.writeFileSync(publicKeyPath, pubHex);

console.log(`Keys generated successfully!`);
console.log(`Public Key: ${pubHex}`);
console.log(`Private key saved to ${privateKeyPath}`);
