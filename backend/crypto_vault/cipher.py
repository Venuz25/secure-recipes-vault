"""
PROTECTOR DE RECETAS - Cifrado de Recetas
Este módulo proporciona funciones para cifrar y descifrar recetas utilizando el algoritmo AES-128 en modo CFB.
"""

import sys
import json
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def encrypt_content(data_json, key_hex):
    key = bytes.fromhex(key_hex)
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    
    ciphertext = aesgcm.encrypt(nonce, data_json.encode('utf-8'), None)
    
    return {
        "nonce": nonce.hex(),
        "ciphertext": ciphertext.hex()
    }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)
        
    recipe_data = sys.argv[1]
    key_hex = sys.argv[2]
    
    result = encrypt_content(recipe_data, key_hex)
    print(json.dumps(result))