import sys
import json
import os
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def encrypt_content(data_json):
    key = os.urandom(16)
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    
    ciphertext = aesgcm.encrypt(nonce, data_json.encode('utf-8'), None)
    sha256_hash = hashlib.sha256(ciphertext).hexdigest()
    
    return {
        "key": key.hex(),
        "nonce": nonce.hex(),
        "ciphertext": ciphertext.hex(),
        "hash": sha256_hash
    }

def decrypt_content(nonce_hex, ciphertext_hex, key_hex, hash_esperado):
    ciphertext = bytes.fromhex(ciphertext_hex)
    hash_calculado = hashlib.sha256(ciphertext).hexdigest()
    
    if hash_calculado != hash_esperado:
        raise ValueError("El hash del archivo no coincide con el registro oficial.")

    key = bytes.fromhex(key_hex)
    nonce = bytes.fromhex(nonce_hex)
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