const NodeRSA = require("node-rsa");
var key = new NodeRSA(); // Generate 2048 A key 
key.generateKeyPair(1024)
var publicDer = key.exportKey("pkcs8-public-pem"); // Public key pkcs1 The length of the corresponding public key is 188,pkcs8 The length of the corresponding public key is 216
// console.log(new Date().getTime()-date1)
var privateDer = key.exportKey("pkcs1-private-pem");// Private key 
console.log(" Public key :", publicDer);
console.log(" Private key :", privateDer);
const text = "Hello RSA!";
// Import private key 
key.importKey(privateDer, "pkcs1-private-pem");
// Sign and encrypt 
//var key = new NodeRSA()
const sign = key.sign(privateDer, "base64", "utf8");
console.log("A Private key signature :", sign);
const encrypted = key.encrypt(sign, "base64");
console.log("B Public key encryption :", encrypted);
// Decrypt and verify signature 
//var key = new NodeRSA()
//key.setOptions({ encryptionScheme: 'pkcs1' })
const decrypted = key.decrypt(encrypted, "utf8");
console.log("C Private key decryption :", decrypted);
const verify = key.verify(text, decrypted, "utf8", "base64");
console.log("D Public key signature verification :", verify);
const crypto = require("crypto");
// encryption 
const crypto_encrypted = crypto.publicEncrypt(publicDer, Buffer.from(text)).toString("base64");
console.log("E Public key encryption :", crypto_encrypted);
// Decrypt 
var crypto_decrypted = crypto.privateDecrypt({

key: privateDer,
padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
},
Buffer.from(crypto_encrypted, "base64")
).toString("utf8");
console.log("F Private key decryption :", crypto_decrypted);
const decrypted2 = key.decrypt(crypto_encrypted, "utf8");
console.log("G Private key decryption :", decrypted2);
