const express = require('express');
const router = express.Router();
const path = require('path');

const CryptoJS = require("crypto-js");
let binascii = require('binascii')
const NodeRSA = require('node-rsa');
const utf8 = require('utf8');

const app = express();
const morgan = require('morgan');
const cors = require('cors');
app.use(cors());
app.use(morgan("dev"));

let bodyParser = require('body-parser');
const { type } = require('os');

// app.use(express.urlencoded({
//     extended: true
// }))

app.use(bodyParser.json({
    limit: "50mb"
}));
app.use(bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000
}));

// https://github.com/brix/crypto-js
class Transaccion{
    constructor(sender_public_key, sender_private_key,
                recipient_public_key, amount){
        this.sender_public_key = sender_public_key
        this.sender_private_key = sender_private_key
        this.recipient_public_key = recipient_public_key
        this.amount = amount
    }

    to_dict(){
        // var dict = new OrderedDict();
        // dict.set('sender_public_key', this.sender_public_key);
        // dict.set('recipient_public_key', this.recipient_public_key);
        // dict.set('amount', this.amount);
        // return dict

        var dict = {
            'recipient_public_key': this.recipient_public_key,
            'sender_public_key': this.sender_public_key,
            'amount': this.amount
        }
        return dict
    }
        

    sign_transaction(){
        var rsa = new NodeRSA();    
        const k = this.sender_private_key;
        console.log(k);
        // console.log(binascii.unhexlify('3082025c02010002818100ac8b9712dadb2433d1d58ebfacaec23f8660924953c6338cb521ad685f93fb5cd46c5828f5d7556d1e5a72edb57339432f1dbbef6f97b6711f392f3c35189b561b0138b7043e95cb499431bac5bc0ab87a08cb119a121774b6df6c5822e1b2a512bfc71bc543f422b1d98cd5ee3838f6ed340eab916b9ac0a4229bfb1f1231750203010001028180497f92a454f6a926abb900fc13e6435744f9e906743986e6e69748631fe78cd8bfa1c131fd7ab2e86ed80f81c35ba8263eb13747686d23296fa7efbf814c9089faa71754055a87876c09fb40e5a4a0736e93152fcac4c087700ee31ef126c2b5b5b9227563f6939b5ac09b328b4d4b37e55cfe866ce4401adc81bd35c27ef047024100bd87e11e9f6b1683e2d7d00cbed3c962708b2103bab5f16da137ad2f5c04f648269b2c520785fc2edeb86e95a900054bdbcf52bada0fe132fedd606d7bc7cbab024100e90ebf75e85a9b8284335b91a7c2f6b687c28688d86895cf8b611dbcdd2abaca62189e15a26ef9cd05b53eb3f9b6ac29b8b2197ed63a6a015e32236622a3d75f0241009ad3c27a429eb790dba1930aa664da5179409ea2ae46ed47b2788a1873227692303f78f035c72560a07ea78fc8b4049f989bffa83674dc71cd33c90f071c0aeb02403a2f6e69978b178c2c494e313d3b15b1588f9e5b07fc847a7e87ce8eda80d285b89c00cbd1f3f6f5d2d8ff409bb599a208f49e1ce68b4aeff07e800bfdd5fded024032879544feb2da19b3d5cb290b29ebdc93ab5b8ea9e190e64a5873ccfc3f83c1f54914ddcacda3494ab8a70cd34fe89145351f9d4a8ddb114d1aa1d8ab81e970'))
        console.log(binascii.unhexlify(k));
        rsa.importKey(binascii.unhexlify(k), "private")
        //var signer = PKCS1_v1_5.new(private_key)
        
        // console.log("AAAAA");
        var my_hash = CryptoJS.SHA256(utf8.encode(JSON.stringify(this.to_dict())))
        console.log(typeof(my_hash));
        //my_hash = SHA.new(str(this.to_dict()).encode('utf8'))
        console.log(my_hash)
        console.log(rsa.sign(my_hash));
        return rsa.sign(my_hash).toString('hex')
        // sign = rsa.sign(k, "ascii", "utf8");
        // return sign
        //return binascii.hexlify(signer.sign(my_hash)).decode('ascii')
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname+"/templates/index.html"))
    // res.render('./templates/index.html');
});

app.post('/generate/transaction', (req, res)=> {
    const sender_public_key = req.body.sender_public_key;
    const sender_private_key = req.body.sender_private_key;
    const recipient_public_key = req.body.recipient_public_key;
    const amount = req.body.amount;
    // console.log(req.body);
    var transaction = new Transaccion(sender_public_key, sender_private_key, recipient_public_key, amount);
    // console.log(transaction)
    var response = {
        'transaction': transaction.to_dict(),
        // 'signature': '123'
        'signature': transaction.sign_transaction()        
    }
    // console.log(response);
    res.send(response)
    
    //return jsonify(response), 200
});

app.get('/make/transaction', (req, res) => {
    res.sendFile(path.join(__dirname+'/templates/make_transaction.html'))
});

app.get('/view/transactions', (req, res) => {
    res.sendFile(path.join(__dirname+'/templates/view_transactions.html'))
});

app.get('/wallet/new', (req, res)=> {
    //var my_hash = CryptoJS.SHA256(utf8.encode(JSON.stringify(this.to_dict())))
    var key = new NodeRSA();
    key.generateKeyPair(512);
    //random_gen = Crypto.Random.new().read
    //private_key = RSA.generate(1024, random_gen)
    //public_key = private_key.publickey()
    // var response = [
    //     binascii.hexlify(key.exportKey('private')),
    //     binascii.hexlify(key.exportKey('public'))
    // ]
    //var text = binascii.hexlify(key.exportKey('private'))
    //console.log(text)
    //console.log(binascii.unhexlify(text))
    var response = {
        'private_key': binascii.hexlify(key.exportKey('private')),
        'public_key': binascii.hexlify(key.exportKey('public'))
    }
    //console.log(response);
    res.send(response)
    // return JSON.stringify(response)
    // return JSON.stringify(response)
});


app.listen(8080, () => {
    console.log(`Server on port 8080`);
})
// app.listen(8081, () => {
//     console.log(`Server on port 8081`);
// })