"""
COMPARTIR CLAVES DE RECETAS ENTRE CHEFS Y SUSCRIPTORES CON ECDH P-256
Módulo de criptografía para compartir claves de recetas entre chefs y suscriptores con ECDH P-256.
"""

import sys
import json
import base64
import os
import io
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# Forzar salida en UTF-8 para evitar bloqueos en Windows/Node
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def wrap_key(subscriber_public_pem_b64, aes_key_b64):
    try:
        public_key_bytes = base64.b64decode(subscriber_public_pem_b64)
        subscriber_public_key = serialization.load_pem_public_key(public_key_bytes)

        ephemeral_private_key = ec.generate_private_key(ec.SECP256R1())
        ephemeral_public_key = ephemeral_private_key.public_key()

        shared_key = ephemeral_private_key.exchange(ec.ECDH(), subscriber_public_key)

        derived_key = HKDF(
            algorithm=hashes.SHA256(),
            length=16,
            salt=None,
            info=b'recipe_key_wrap',
        ).derive(shared_key)

        aesgcm = AESGCM(derived_key)
        nonce = os.urandom(12)
        wrapped_aes_key = aesgcm.encrypt(nonce, base64.b64decode(aes_key_b64), None)

        return {
            "status": "ok",
            "wrapped_key": base64.b64encode(wrapped_aes_key).decode('utf-8'),
            "ephemeral_public_key": base64.b64encode(
                ephemeral_public_key.public_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PublicFormat.SubjectPublicKeyInfo
                )
            ).decode('utf-8'),
            "nonce": base64.b64encode(nonce).decode('utf-8')
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

def unwrap_key(subscriber_private_pem, ephemeral_public_pem_b64, wrapped_key_b64, nonce_b64):
    try:
        private_key = serialization.load_pem_private_key(subscriber_private_pem.encode(), password=None)
        ephemeral_public_key = serialization.load_pem_public_key(base64.b64decode(ephemeral_public_pem_b64))

        shared_key = private_key.exchange(ec.ECDH(), ephemeral_public_key)

        derived_key = HKDF(
            algorithm=hashes.SHA256(),
            length=16,
            salt=None,
            info=b'recipe_key_wrap',
        ).derive(shared_key)

        aesgcm = AESGCM(derived_key)
        decrypted_aes_key = aesgcm.decrypt(base64.b64decode(nonce_b64), base64.b64decode(wrapped_key_b64), None)

        return base64.b64encode(decrypted_aes_key).decode('utf-8')
    except Exception as e:
        return None

if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "wrap":
        print(json.dumps(wrap_key(sys.argv[2], sys.argv[3])))
    elif mode == "unwrap":
        # Nota: La llave privada se pasa como string directo
        print(unwrap_key(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]))