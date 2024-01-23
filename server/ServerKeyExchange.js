const crypto = require('crypto');

function performKeyExchange(socket) {
    return new Promise((resolve, reject) => {
  
      const serverDH = crypto.createECDH('prime256v1');
      serverDH.generateKeys();
  
      const serverPublicKeyBase64 = serverDH.getPublicKey('base64');
  
      socket.emit('server-public-key', serverPublicKeyBase64);
  
      socket.on('client-public-key', async (clientPublicKeyBase64) => {
        try {
          const sharedSecret = serverDH.computeSecret(clientPublicKeyBase64, 'base64', 'hex');

          console.log("Shared secret key: ", sharedSecret);
  
          resolve(sharedSecret); // Resolve the promise once key exchange is complete
        } catch (err) {
          reject(err); // Reject the promise if any error occurs
        }
      });
    });
}

module.exports = { performKeyExchange };