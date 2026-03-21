"""
GENERADOR DE CLAVES - Generación de Claves RSA
Este módulo proporciona una función para generar un par de claves RSA (pública y privada) para los nuevos usuarios.
"""

import sys
import json
import os
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def generate_and_encrypt_keys(password_str):
    # 1. Generar par de llaves RSA
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )

    # 2. Derivar una llave AES a partir de la contraseña del usuario
    salt = os.urandom(16)
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    aes_key = kdf.derive(password_str.encode())

    # 3. Cifrar la llave privada con AES-GCM
    aesgcm = AESGCM(aes_key)
    nonce = os.urandom(12) # Vector de inicialización
    encrypted_private_key = aesgcm.encrypt(nonce, private_pem, None)

    # 4. Devolver todo en formato HEX para guardarlo fácil en la DB
    return {
        "public_key": public_pem.decode('utf-8'),
        "encrypted_private_key": encrypted_private_key.hex(),
        "salt": salt.hex(),
        "nonce": nonce.hex()
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Falta la contraseña"}))
        sys.exit(1)
        
    password = sys.argv[1]
    result = generate_and_encrypt_keys(password)
    print(json.dumps(result))