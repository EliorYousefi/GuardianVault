const crypto = require('crypto');

class Cryptography 
{
    constructor(encryptionKey)
    {
        this.aesGcmKey = encryptionKey;
    }

    async encryptData(data) 
    {
        // Generate a random IV (Initialization Vector)
        const iv = crypto.randomBytes(16);

        // Create the AES-GCM cipher
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(this.aesGcmKey, 'hex'), iv);

        // Update the cipher with the plaintext
        const encryptedData = cipher.update(data, 'utf-8', 'hex');

        encryptedData += cipher.final('hex');

        // Get the authentication tag
        const tag = cipher.getAuthTag().toString('hex');

        // Return the IV, ciphertext, and authentication tag
        return {iv, encryptedData, tag };
    }

    async decryptData(iv, ciphertext, tag) 
    {
        // Create the AES-GCM decipher
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(this.aesGcmKey, 'hex'), Buffer.from(iv, 'hex'));

        // Set the authentication tag
        decipher.setAuthTag(Buffer.from(tag, 'hex'));

        // Update the decipher with the ciphertext
        const decryptedData = decipher.update(ciphertext, 'hex', 'utf-8');
        decryptedData += decipher.final('utf-8');

        // Return the decrypted plaintext
        return decryptedData;
    }
}

module.exports = {Cryptography};