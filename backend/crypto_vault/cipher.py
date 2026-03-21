"""
PROTECTOR DE RECETAS - Cifrado de Recetas
Este módulo proporciona funciones para cifrar y descifrar recetas utilizando el algoritmo AES en modo CFB.
"""

import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

def encrypt_recipe(data_bytes):
    # Generamos una llave de 32 bytes y un IV de 16 bytes
    key = os.urandom(32)
    iv = os.urandom(16)
    
    cipher = Cipher(algorithms.AES(key), modes.CFB(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(data_bytes) + encryptor.finalize()
    
    return ciphertext, key, iv

def decrypt_recipe(ciphertext, key, iv):
    cipher = Cipher(algorithms.AES(key), modes.CFB(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    decrypted_data = decryptor.update(ciphertext) + decryptor.finalize()
    
    return decrypted_data