"""
GENERADOR DE CLAVES - Generación de Claves
Este módulo proporciona una función para generar un par de claves ECDSA (pública y privada) para los nuevos usuarios.
"""

import sys
import json
import os
import base64
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# Función para generar y proteger llaves (Registro)
def generate_and_encrypt(password_str):
    private_key = ec.generate_private_key(ec.SECP256R1())
    
    # 1. Obtenemos los bytes en formato PEM
    public_pem_bytes = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )

    private_pem_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    )

    salt = os.urandom(16)
    
    kdf = PBKDF2HMAC(algorithm=hashes.SHA3_256(), length=16, salt=salt, iterations=100000)
    aes_key = kdf.derive(password_str.encode())

    aesgcm = AESGCM(aes_key)
    nonce = os.urandom(12)
    
    # Ciframos el PEM privado
    encrypted_private = aesgcm.encrypt(nonce, private_pem_bytes, None)

    digest = hashes.Hash(hashes.SHA3_256())
    digest.update(salt + password_str.encode('utf-8'))
    password_hash_bytes = digest.finalize()

    return {
        "public_key": base64.b64encode(public_pem_bytes).decode('utf-8'),
        "encrypted_private_key": base64.b64encode(encrypted_private).decode('utf-8'),
        "salt": base64.b64encode(salt).decode('utf-8'),
        "nonce": base64.b64encode(nonce).decode('utf-8'),
        "password_hash": base64.b64encode(password_hash_bytes).decode('utf-8') # ¡Agregado!
    }
# Función para recuperar la llave (Login / Uso)
def decrypt_private_key(password_str, encrypted_b64, salt_b64, nonce_b64, expected_hash_b64):
    try:
        salt = base64.b64decode(salt_b64)

        digest = hashes.Hash(hashes.SHA3_256())
        digest.update(salt + password_str.encode('utf-8'))
        calculated_hash_b64 = base64.b64encode(digest.finalize()).decode('utf-8')

        if calculated_hash_b64 != expected_hash_b64:
            return {"status": "error", "message": "Contraseña incorrecta"}

        nonce = base64.b64decode(nonce_b64)
        encrypted_data = base64.b64decode(encrypted_b64)

        kdf = PBKDF2HMAC(algorithm=hashes.SHA3_256(), length=16, salt=salt, iterations=100000)
        aes_key = kdf.derive(password_str.encode())

        aesgcm = AESGCM(aes_key)
        decrypted_pem_bytes = aesgcm.decrypt(nonce, encrypted_data, None)
        
        return {"status": "success", "private_key": decrypted_pem_bytes.decode('utf-8')}
    except Exception:
        return {"status": "error", "message": "Datos corruptos o error de seguridad en la llave"}

if __name__ == "__main__":
    if sys.argv[1] == "generate":
        print(json.dumps(generate_and_encrypt(sys.argv[2])))
    elif sys.argv[1] == "decrypt":
        print(json.dumps(decrypt_private_key(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6])))