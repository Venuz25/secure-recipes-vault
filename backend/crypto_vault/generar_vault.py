"""
Genera un nuevo par de claves ECDH para el vault en formato PEM.
Estas claves se utilizaran para el cifrado de la clave AES de las recetas para guardarse en la base de datos.
"""

from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
import base64

private_key = ec.generate_private_key(ec.SECP256R1())

priv_pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
).decode('utf-8')

pub_pem = private_key.public_key().public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
).decode('utf-8')

print(f'VAULT_PRIVATE_KEY={base64.b64encode(priv_pem.encode()).decode()}')
print(f'VAULT_PUBLIC_KEY={base64.b64encode(pub_pem.encode()).decode()}')
