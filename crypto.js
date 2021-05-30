const crypto = require('crypto')

const algorithm = 'aes-256-cbc'
const iv = crypto.randomBytes(16)

const encrypt = (secretKey,text) => {
  var key = crypto.createHash('sha256').update(secretKey).digest('hex').toString('hex').substring(0,32)
  // return key
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()])
  return JSON.stringify({
    iv: iv.toString('hex'),
    content: encrypted.toString('hex')
  })
}

const decrypt = (hash,secretKey) => {
  var key = crypto.createHash('sha256').update(secretKey).digest('hex').toString('hex').substring(0,32)
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(hash.iv, 'hex'))
  const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()])
  return decrpyted.toString()
};

module.exports = {
  encrypt,
  decrypt
};