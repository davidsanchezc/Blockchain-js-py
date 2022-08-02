import binascii
import Crypto

from Crypto.Hash import SHA
from Crypto.PublicKey import RSA
from Crypto.Signature import PKCS1_v1_5
# print(binascii.hexlify(b'ABC').decode('ascii'))
from flask import jsonify


Dict = {
    'sender_public_key': '1234',
    'recipient_public_key': '5678',
    'amount': 100
}
def sign_transaction():
        private_key = RSA.importKey(binascii.unhexlify('377abcaf271c'))
        signer = PKCS1_v1_5.new(private_key)
        my_hash = SHA.new(str(Dict).encode('utf8'))
        return binascii.hexlify(signer.sign(my_hash)).decode('ascii')

def new_wallet():
    random_gen = Crypto.Random.new().read
    private_key = RSA.generate(1024, random_gen)
    public_key = private_key.publickey()
    response = {
        'private_key': binascii.hexlify(private_key.export_key(format('DER'))).decode('ascii'),
        'public_key': binascii.hexlify(public_key.export_key(format('DER'))).decode('ascii')
    }
    return jsonify(response)

print(new_wallet())