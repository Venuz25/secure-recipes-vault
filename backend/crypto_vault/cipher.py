"""
CIFRADOR Y DESCIFRADOR DE CONTENIDO PARA RECETAS - Cifrado AES-GCM
Este módulo proporciona funciones para cifrar y descifrar el contenido de las recetas utilizando AES-GCM. 
Además, se incluye un hash SHA3-256 del contenido cifrado para verificar la integridad de los datos al descifrarlos.
"""

import sys
import json
import os
import hashlib
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def encrypt_content(data_json):
    key = os.urandom(16)
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    
    ciphertext = aesgcm.encrypt(nonce, data_json.encode('utf-8'), None)
    sha3_hash = hashlib.sha3_256(ciphertext).hexdigest()
    
    return {
        "key": base64.b64encode(key).decode('utf-8'),
        "nonce": base64.b64encode(nonce).decode('utf-8'),
        "ciphertext": base64.b64encode(ciphertext).decode('utf-8'),
        "hash": sha3_hash
    }

def decrypt_content(nonce_b64, ciphertext_b64, key_b64, hash_esperado):
    ciphertext = base64.b64decode(ciphertext_b64)
    hash_calculado = hashlib.sha3_256(ciphertext).hexdigest()
    
    if hash_esperado != "NO_HASH" and hash_calculado != hash_esperado:
        raise ValueError(f"INTEGRITY_ERROR: El hash del archivo no coincide con el registro oficial.")

    key = base64.b64decode(key_b64)
    nonce = base64.b64decode(nonce_b64)
    aesgcm = AESGCM(key)
    
    decrypted_data = aesgcm.decrypt(nonce, ciphertext, None)
    return decrypted_data.decode('utf-8')

if __name__ == "__main__":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    if len(sys.argv) < 2:
        sys.exit(1)

    mode = sys.argv[1]
    try:
        if mode == 'encrypt':
            result = encrypt_content(sys.argv[2])
            sys.stdout.write(json.dumps(result, ensure_ascii=False))

        elif mode == 'decrypt':
            nonce = sys.argv[2]
            ciphertext = sys.argv[3]
            key = sys.argv[4]
            expected_hash = sys.argv[5]
            
            decrypted_str = decrypt_content(nonce, ciphertext, key, expected_hash)
            sys.stdout.write(decrypted_str)
            
    except Exception as e:
        sys.stderr.write(str(e))
        sys.exit(1)