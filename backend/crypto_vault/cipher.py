"""
PROTECTOR DE RECETAS - Cifrado de Recetas
Este módulo proporciona funciones para cifrar y descifrar recetas utilizando AES-GCM (Authenticated Encryption).
"""

import sys
import json
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def encrypt_content(data_json, key_hex):
    key = bytes.fromhex(key_hex)
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    # Ciframos los datos
    ciphertext = aesgcm.encrypt(nonce, data_json.encode('utf-8'), None)
    return {
        "nonce": nonce.hex(),
        "ciphertext": ciphertext.hex()
    }

def decrypt_content(nonce_hex, ciphertext_hex, key_hex):
    key = bytes.fromhex(key_hex)
    nonce = bytes.fromhex(nonce_hex)
    ciphertext = bytes.fromhex(ciphertext_hex)
    aesgcm = AESGCM(key)
    # El descifrado devuelve bytes
    decrypted_data = aesgcm.decrypt(nonce, ciphertext, None)
    return decrypted_data.decode('utf-8')

if __name__ == "__main__":
    # Configurar la salida estándar para que use UTF-8 explícitamente
    # Esto evita problemas con acentos en Windows
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    if len(sys.argv) < 2:
        sys.exit(1)

    mode = sys.argv[1]
    
    try:
        if mode == 'encrypt':
            recipe_data = sys.argv[2] 
            key_hex = sys.argv[3]
            result = encrypt_content(recipe_data, key_hex)
            # ensure_ascii=False permite que los acentos se queden como letras
            sys.stdout.write(json.dumps(result, ensure_ascii=False))

        elif mode == 'decrypt':
            nonce_hex = sys.argv[2]
            ciphertext_hex = sys.argv[3]
            key_hex = sys.argv[4]
            decrypted_str = decrypt_content(nonce_hex, ciphertext_hex, key_hex)
            # Escribimos el string directamente
            sys.stdout.write(decrypted_str)
            
    except Exception as e:
        sys.stderr.write(str(e))
        sys.exit(1)