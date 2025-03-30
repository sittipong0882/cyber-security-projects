const crypto = require('crypto');

// ใช้คีย์จาก .env และเติมให้มีความยาว 32 อักขระ
const SECRET_KEY = process.env.SECRET_KEY.padEnd(32, '0').slice(0, 32);  // เติมและตัดให้เป็น 32 อักขระ
const IV_LENGTH = 16;  // ขนาดของ IV (16 ไบต์)

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);  // สร้าง IV แบบสุ่ม
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(SECRET_KEY), iv);  // สร้าง Cipher
  let encrypted = cipher.update(text);  
  encrypted = Buffer.concat([encrypted, cipher.final()]);  // เข้ารหัสและรวมผลลัพธ์
  return iv.toString('hex') + ':' + encrypted.toString('hex');  // คืนค่า iv: ข้อความที่ถูกเข้ารหัส
}

function decrypt(text) {
  const [iv, encryptedText] = text.split(':');  // แยก iv และ ข้อความที่ถูกเข้ารหัส
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(SECRET_KEY), Buffer.from(iv, 'hex'));  // สร้าง Decipher
  let decrypted = decipher.update(Buffer.from(encryptedText, 'hex'));
  decrypted = Buffer.concat([decrypted, decipher.final()]);  // ถอดรหัสและรวมผลลัพธ์
  return decrypted.toString();  // คืนค่าข้อความที่ถอดรหัสแล้ว
}

module.exports = { encrypt, decrypt };
