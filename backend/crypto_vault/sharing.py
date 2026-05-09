import sys
import json
import base64
import os
import io
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# Forzamos la salida en UTF-8 para evitar problemas de caracteres en la terminal
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def wrap_key(subscriber_public_pem_b64, aes_key_b64):
    try:
        # Decodificamos la pública (viene de la BD o del .env en b64)
        public_key_bytes = base64.b64decode(subscriber_public_pem_b64)
        subscriber_public_key = serialization.load_pem_public_key(public_key_bytes)

        ephemeral_private_key = ec.generate_private_key(ec.SECP256R1())
        ephemeral_public_key = ephemeral_private_key.public_key()
        
        # Intercambio Diffie-Hellman
        shared_key = ephemeral_private_key.exchange(ec.ECDH(), subscriber_public_key)

        # Derivación de la llave simétrica de 16 bytes
        derived_key = HKDF(
            algorithm=hashes.SHA256(), 
            length=16, salt=None, 
            info=b'recipe_key_wrap'
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
        return {"status": "error", "message": f"Wrap error: {str(e)}"}

def unwrap_key(private_pem_b64, ephemeral_public_pem_b64, wrapped_key_b64, nonce_b64):
    """
    Función unificada de descifrado.
    Ahora carga AMBAS llaves (Privada y Pública Efímera) desde Base64.
    """
    try:
        # CORRECCIÓN: Ahora decodificamos la privada también porque viene en b64
        private_key_bytes = base64.b64decode(private_pem_b64)
        private_key = serialization.load_pem_private_key(private_key_bytes, password=None)
        
        public_key_bytes = base64.b64decode(ephemeral_public_pem_b64)
        ephemeral_public_key = serialization.load_pem_public_key(public_key_bytes)

        shared_key = private_key.exchange(ec.ECDH(), ephemeral_public_key)
        
        derived_key = HKDF(
            algorithm=hashes.SHA256(), 
            length=16, salt=None, 
            info=b'recipe_key_wrap'
        ).derive(shared_key)
        
        aesgcm = AESGCM(derived_key)
        decrypted_aes_key = aesgcm.decrypt(base64.b64decode(nonce_b64), base64.b64decode(wrapped_key_b64), None)

        return base64.b64encode(decrypted_aes_key).decode('utf-8')
    except Exception as e:
        # Lanzamos excepción para que rewrap_key pueda capturar el error
        raise Exception(f"Unwrap error: {str(e)}")

def rewrap_key(vault_private_pem_b64, vault_ephemeral_b64, vault_wrapped_b64, vault_nonce_b64, subscriber_public_b64):
    try:
        # Desemvolvemos la llave maestra usando la identidad del servidor
        raw_aes_b64 = unwrap_key(vault_private_pem_b64, vault_ephemeral_b64, vault_wrapped_b64, vault_nonce_b64)
        
        # Envolvemos la llave para el suscriptor
        return wrap_key(subscriber_public_b64, raw_aes_b64)
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)
        
    mode = sys.argv[1]
    
    if mode == "wrap":
        print(json.dumps(wrap_key(sys.argv[2], sys.argv[3])))
        
    elif mode == "unwrap":
        try:
            print(unwrap_key(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]))
        except Exception as e:
            print(str(e))
            
    elif mode == "rewrap":
        print(json.dumps(rewrap_key(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6])))