"""
GENERADOR DE CLAVES - Módulo de Gestión de Identidad Criptográfica
Proporciona funcionalidades para la generación, protección y recuperación de pares de claves ECDSA P-256.
"""

import sys
import json
import os
import base64
import io
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# Configuración de salida para compatibilidad con flujos de Node.js
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def generate_and_encrypt(password_str):
    """Generación de par de claves y cifrado de la clave privada (Registro)"""
    private_key = ec.generate_private_key(ec.SECP256R1())
    
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
    
    # Derivación de clave AES-128 vía PBKDF2
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA3_256(), 
        length=16, 
        salt=salt, 
        iterations=100000
    )
    aes_key = kdf.derive(password_str.encode())

    # Cifrado Autenticado (AEAD) vía AES-GCM
    aesgcm = AESGCM(aes_key)
    nonce = os.urandom(12)
    encrypted_private = aesgcm.encrypt(nonce, private_pem_bytes, None)

    # Generación de Hash de verificación (Salted SHA3-256)
    digest = hashes.Hash(hashes.SHA3_256())
    digest.update(salt + password_str.encode('utf-8'))
    password_hash_bytes = digest.finalize()

    return {
        "public_key": base64.b64encode(public_pem_bytes).decode('utf-8'),
        "encrypted_private_key": base64.b64encode(encrypted_private).decode('utf-8'),
        "salt": base64.b64encode(salt).decode('utf-8'),
        "nonce": base64.b64encode(nonce).decode('utf-8'),
        "password_hash": base64.b64encode(password_hash_bytes).decode('utf-8')
    }

def decrypt_private_key(password_str, encrypted_b64, salt_b64, nonce_b64, expected_hash_b64):
    """Descifrado de clave privada y validación de integridad de credenciales"""
    try:
        salt = base64.b64decode(salt_b64)

        # Validación opcional de Hash (Skip permitido para protocolos locales)
        if expected_hash_b64 != "VERIFY_SKIP":
            digest = hashes.Hash(hashes.SHA3_256())
            digest.update(salt + password_str.encode('utf-8'))
            calculated_hash_b64 = base64.b64encode(digest.finalize()).decode('utf-8')

            if calculated_hash_b64 != expected_hash_b64:
                return {"status": "error", "message": "Credenciales inválidas: Hash mismatch"}

        nonce = base64.b64decode(nonce_b64)
        encrypted_data = base64.b64decode(encrypted_b64)

        # Re-derivación de la clave simétrica
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA3_256(), 
            length=16, 
            salt=salt, 
            iterations=100000
        )
        aes_key = kdf.derive(password_str.encode())

        # Descifrado y verificación de autenticidad (Tag check)
        aesgcm = AESGCM(aes_key)
        decrypted_pem_bytes = aesgcm.decrypt(nonce, encrypted_data, None)
        
        return {
            "status": "success", 
            "private_key": decrypted_pem_bytes.decode('utf-8')
        }
    except Exception as e:
        return {
            "status": "error", 
            "message": "Fallo en autenticación GCM: Clave incorrecta o datos corruptos"
        }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)
        
    mode = sys.argv[1]
    if mode == "generate":
        print(json.dumps(generate_and_encrypt(sys.argv[2])))
    elif mode == "decrypt":
        print(json.dumps(decrypt_private_key(
            sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6]
        )))