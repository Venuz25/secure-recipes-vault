"""
GENERADOR DE CLAVES - Generación de Claves
Este módulo proporciona una función para generar un par de claves ECDSA (pública y privada) para los nuevos usuarios.
"""

import sys
import json
import os
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# Función para generar y proteger llaves (Registro)
def generate_and_encrypt(password_str):
    private_key = ec.generate_private_key(ec.SECP256R1())
    
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode('utf-8')

    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    )

    salt = os.urandom(16)
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=16, salt=salt, iterations=100000)
    aes_key = kdf.derive(password_str.encode())

    aesgcm = AESGCM(aes_key)
    nonce = os.urandom(12)
    encrypted_private = aesgcm.encrypt(nonce, private_pem, None)

    return {
        "public_key": public_pem,
        "encrypted_private_key": encrypted_private.hex(),
        "salt": salt.hex(),
        "nonce": nonce.hex()
    }

# Función para recuperar la llave (Login / Uso)
def decrypt_private_key(password_str, encrypted_hex, salt_hex, nonce_hex):
    try:
        salt = bytes.fromhex(salt_hex)
        nonce = bytes.fromhex(nonce_hex)
        encrypted_data = bytes.fromhex(encrypted_hex)

        kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=16, salt=salt, iterations=100000)
        aes_key = kdf.derive(password_str.encode())

        aesgcm = AESGCM(aes_key)
        decrypted_pem = aesgcm.decrypt(nonce, encrypted_data, None)
        
        return {"status": "success", "private_key": decrypted_pem.decode('utf-8')}
    except Exception:
        return {"status": "error", "message": "Contraseña incorrecta para descifrar llave"}

if __name__ == "__main__":
    if sys.argv[1] == "generate":
        print(json.dumps(generate_and_encrypt(sys.argv[2])))
    elif sys.argv[1] == "decrypt":
        print(json.dumps(decrypt_private_key(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5])))