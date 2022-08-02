let binascii = require('binascii')
const NodeRSA = require('node-rsa');
const utf8 = require('utf8');

function hex_to_ascii(str1){
	var hex  = str1.toString();
	var str = '';
	for (var n = 0; n < hex.length; n += 2) {
		str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
	}
	return str;
}

var Dict = {
    'sender_public_key': '1234',
    'recipient_public_key': '5678',
    'amount': 100
}

function sign_transaction(){
    var rsa = new NodeRSA();
    rsa.importKey(binascii.unhexlify('377abcaf271c'), "pkcs1")
    //var signer = PKCS1_v1_5.new(private_key)
    var my_hash = CryptoJS.SHA256(utf8.encode(JSON.stringify(Dict)))
    //my_hash = SHA.new(str(this.to_dict()).encode('utf8'))
    return binascii.hexlify(rsa.sign(my_hash))
    //return binascii.hexlify(signer.sign(my_hash)).decode('ascii')
}
// console.log(sign_transaction())

function walletnew(){
    var key = new NodeRSA();
    key.generateKeyPair(1024);
    //random_gen = Crypto.Random.new().read
    //private_key = RSA.generate(1024, random_gen)
    //public_key = private_key.publickey()
    var response = {
        'private_key': binascii.hexlify(key.exportKey('private')),
        'public_key': binascii.hexlify(key.exportKey('public'))
    }
    return response
}
console.log(walletnew());

