import sys
import json
import os
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def encrypt_content(data_json):
    # 1. Generar clave aleatoria de 16 bytes (AES-128)
    key = os.urandom(16)
    aesgcm = AESGCM(key)
    
    # 2. Generar nonce de 12 bytes para GCM
    nonce = os.urandom(12)
    
    # 3. Cifrar el contenido
    ciphertext = aesgcm.encrypt(nonce, data_json.encode('utf-8'), None)
    
    # 4. Generar el Hash de integridad SHA-256 del ciphertext
    sha256_hash = hashlib.sha256(ciphertext).hexdigest()
    
    return {
        "key": key.hex(),
        "nonce": nonce.hex(),
        "ciphertext": ciphertext.hex(),
        "hash": sha256_hash
    }

def decrypt_content(nonce_hex, ciphertext_hex, key_hex):
    key = bytes.fromhex(key_hex)
    nonce = bytes.fromhex(nonce_hex)
    ciphertext = bytes.fromhex(ciphertext_hex)
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
            recipe_data = sys.argv[2] 
            result = encrypt_content(recipe_data)
            sys.stdout.write(json.dumps(result, ensure_ascii=False))

        elif mode == 'decrypt':
            nonce_hex = sys.argv[2]
            ciphertext_hex = sys.argv[3]
            key_hex = sys.argv[4]
            decrypted_str = decrypt_content(nonce_hex, ciphertext_hex, key_hex)
            sys.stdout.write(decrypted_str)
            
    except Exception as e:
        sys.stderr.write(str(e))
        sys.exit(1)