App.crypto = {

  generateRandomKey: function(size) {
    return CryptoJS.lib.WordArray.random(size).toString();
  },

  decrypt: function(encrypted_content, key, iv, auth, authKey) {
    var computedAuth = this.hmac256(encrypted_content, authKey);
    if(computedAuth !== auth) {
      console.log("Auth hash does not match, not decrypting.")
      return null;
    }
    var keyData = CryptoJS.enc.Hex.parse(key);
    var ivData  = CryptoJS.enc.Hex.parse(iv);
    var decrypted = CryptoJS.AES.decrypt(encrypted_content, keyData, { iv: ivData,  mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    return decrypted.toString(CryptoJS.enc.Utf8);
  },

  encrypt: function(text, key, authKey) {
    var keyData = CryptoJS.enc.Hex.parse(key);
    var iv = this.generateRandomKey(32);
    var ivData  = CryptoJS.enc.Hex.parse(iv);
    var encrypted = CryptoJS.AES.encrypt(text, keyData, { iv: ivData,  mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    var cipher = encrypted.toString();
    return {cipher: cipher, iv: iv, auth: this.hmac256(cipher, authKey)};
  },

  hmac256: function(message, key) {
    var keyData = CryptoJS.enc.Hex.parse(key);
    var messageData = CryptoJS.enc.Utf8.parse(message);
    return CryptoJS.HmacSHA256(messageData, keyData).toString();
  }
}
