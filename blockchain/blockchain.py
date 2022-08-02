import hashlib
import json
import requests
from urllib.parse import urlparse
from argparse import ArgumentParser
from binascii import unhexlify
from collections import OrderedDict
from time import time
from uuid import uuid4

from Crypto.Hash import SHA
from Crypto.PublicKey import RSA
from Crypto.Signature import PKCS1_v1_5
from flask import Flask
from flask import jsonify
from flask import render_template
from flask import request
from flask_cors import CORS

MINING_SENDER = 'The Blockchain'
MINING_REWARD = 1
MINING_DIFFICULTY = 2


class Blockchain:

    def __init__(self):
        self.transactions = []
        self.chain = []
        self.nodes = set()
        self.node_id = str(uuid4()).replace('-', '')
        # Crear bloque génesis
        self.crear_bloque(0, '00')

    def crear_bloque(self, nonce, previous_hash):
        """
        Agregar un bloque de transacciones al blockchain
        """
        block = {
            'block_number': len(self.chain) + 1,
            'timestamp': time(), 
            'transactions': self.transactions,
            'nonce': nonce,
            'previous_hash': previous_hash
        }
        #print(block_number)
        self.transactions = []
        self.chain.append(block)
        return block

    @staticmethod
    def verificar_firma_de_transaccion(sender_public_key, signature, transaction):
        public_key = RSA.importKey(unhexlify(sender_public_key))
        verifier = PKCS1_v1_5.new(public_key)
        h = SHA.new(str(transaction).encode('utf8'))
        # print(h)
        try:
            verifier.verify(h, unhexlify(signature))
        except ValueError:
            return False
        return True

    def enviar_transaccion(self, sender_public_key, recipient_public_key, signature, amount):
        transaction = OrderedDict({
            'sender_public_key': sender_public_key,
            'recipient_public_key': recipient_public_key,
            'amount': amount
        })
        if sender_public_key == MINING_SENDER:
            # Reward for mining the block
            self.transactions.append(transaction)
            return len(self.chain) + 1
        else:
            # Transaction from wallet to another wallet
            signature_verification = self.verificar_firma_de_transaccion(
                sender_public_key, signature, transaction)
            if signature_verification:
                self.transactions.append(transaction)
                return len(self.chain) + 1
            else:
                return False

    @staticmethod
    def validar_prueba(transactions, last_hash, nonce, difficulty=MINING_DIFFICULTY):
        guess = (str(transactions) + str(last_hash) +
                str(nonce)).encode('utf8')
        # print(guess)
        h = hashlib.new('sha256')
        h.update(guess)
        guess_hash = h.hexdigest()
        return guess_hash[:difficulty] == '0' * difficulty

    def proof_of_work(self):
        last_block = self.chain[-1]
        # print(last_block)
        last_hash = self.hash(last_block)
        nonce = 0
        while self.validar_prueba(self.transactions, last_hash, nonce) is False:
            nonce += 1
        return nonce

    @staticmethod
    def hash(block):
        block_string = json.dumps(block, sort_keys=True)
        h = hashlib.new('sha256')
        # print(h)
        h.update(block_string.encode('utf8'))
        return h.hexdigest()

    def resolver_conflictos(self):
        neighbours = self.nodes
        new_chain = None
        max_length = len(self.chain)
        for node in neighbours:
            response = requests.get(f'http://{node}/chain')
            if response.status_code == 200:
                resp = response.json()
                external_length = resp['length']
                external_chain = resp['chain']
                if external_length > max_length and self.validar_cadena(external_chain):
                    max_length = external_chain
                    new_chain = external_chain
        if new_chain:
            self.chain = new_chain
            return True
        return False

    def validar_cadena(self, given_chain):
        last_block = given_chain[0]
        current_index = 1
        while current_index < len(given_chain):
            block = given_chain[current_index]
            if block['previous_hash'] != self.hash(last_block):
                return False
            transactions = block['transactions'][:-1]
            transaction_elements = ['sender_public_key',
                                    'recipient_public_key',
                                    'amount']
            transactions = [OrderedDict((k, transaction[k]) for k in transaction_elements)
                            for transaction in transactions]
            if not self.validar_prueba(transactions,
                                    block['previous_hash'],
                                    block['nonce'],
                                    MINING_DIFFICULTY):
                return False
            last_block = block
            current_index += 1
        return True

    def registrar_nodo(self, node_url):
        parsed_url = urlparse(node_url)
        if parsed_url.netloc:
            self.nodes.add(parsed_url.netloc)
        elif parsed_url.path:
            self.nodes.add(parsed_url.path)
        else:
            raise ValueError('Invalid URL')


blockchain = Blockchain()
app = Flask(__name__)
CORS(app)


@app.route('/')
def index():
    return render_template('./index.html')


@app.route('/configure')
def configure():
    return render_template('./configure.html')


@app.route('/nodes/resolve', methods=['GET'])
def consensus():
    replaced = blockchain.resolver_conflictos()

    if replaced:
        response = {
            'message': 'Nuestra cadena fue reemplazada',
            'new_chain': blockchain.chain
        }
    else:
        response = {
            'message': 'Nuestra cadena es autorizada',
            'chain': blockchain.chain
        }
    return jsonify(response), 200


@app.route('/transactions/get', methods=['GET'])
def transactions_get():
    response = {
        'transactions': blockchain.transactions
    }
    return jsonify(response), 200


@app.route('/chain', methods=['GET'])
def chain():
    response = {
        'chain': blockchain.chain,
        'length': len(blockchain.chain)
    }
    return jsonify(response), 200


@app.route('/mine', methods=['GET'])
def mine():
    # PoW
    nonce = blockchain.proof_of_work()
    blockchain.enviar_transaccion(sender_public_key=MINING_SENDER,
                                recipient_public_key=blockchain.node_id,
                                signature='',
                                amount=MINING_REWARD)
    last_block = blockchain.chain[-1]
    previous_hash = blockchain.hash(last_block)
    block = blockchain.crear_bloque(nonce, previous_hash)
    # print(blockchain)
    response = {
        'message': 'Nuevo bloque creado',
        'block_number': block['block_number'],
        'transactions': block['transactions'],
        'nonce': block['nonce'],
        'previous_hash': block['previous_hash']
    }
    
    return jsonify(response), 200


@app.route('/nodes/get', methods=['GET'])
def nodes_get():
    nodes = list(blockchain.nodes)
    response = {
        'nodes': nodes
    }
    return jsonify(response), 200


@app.route('/nodes/register', methods=['POST'])
def nodes_register():
    values = request.form
    nodes = [v.strip() for v in values.get('nodes').split(',')]
    if nodes is None:
        return 'Error: proporcione una lista de nodos válida', 400
    for node in nodes:
        blockchain.registrar_nodo(node)
    response = {
        'message': 'Se han agregado nodos',
        'total_nodes': [node for node in blockchain.nodes]
    }
    return jsonify(response), 200


@app.route('/transaction/new', methods=['POST'])
def transaction_new():
    values = request.form
    required = ['confirmation_sender_public_key', 'confirmation_recipient_public_key',
                'transaction_signature', 'confirmation_amount']
    print(values, required)
    if not all(k in values for k in required):
        return 'Missing values', 400
    transaction_results = blockchain.enviar_transaccion(values['confirmation_sender_public_key'],
                                                        values['confirmation_recipient_public_key'],
                                                        values['transaction_signature'],
                                                        values['confirmation_amount'])
    if transaction_results:
        response = {
            'message': f'La transacción será agregada al bloque {transaction_results}'}
        return jsonify(response), 201
    else:
        response = {'message': 'Transacción o firma no válida'}
        return jsonify(response), 406


if __name__ == '__main__':
    parser = ArgumentParser()
    parser.add_argument('-p', '--port', default=5001,
                        type=int, help='port to listen to')
    args = parser.parse_args()
    port = args.port
    app.run(host='127.0.0.1', port=port, debug=True)
