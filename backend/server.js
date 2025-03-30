require('dotenv').config();  // โหลดตัวแปรจาก .env
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { encrypt, decrypt } = require('./cryptoUtils');  // นำเข้า encrypt และ decrypt

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

// API สำหรับการบันทึกการจอง
app.post('/api/bookings', async (req, res) => {
  try {
    const { title, description, start, end, userEmail, idCard } = req.body;

    // เข้ารหัสข้อมูลก่อนบันทึก
    const encryptedTitle = encrypt(title);
    const encryptedDescription = encrypt(description);
    const encryptedUserEmail = encrypt(userEmail);
    const encryptedIdCard = encrypt(idCard);  // เข้ารหัสรหัสบัตรประชาชน

    // บันทึกข้อมูลในฐานข้อมูล
    const booking = await prisma.booking.create({
      data: {
        title: encryptedTitle,
        description: encryptedDescription,
        start: new Date(start),
        end: new Date(end),
        userEmail: encryptedUserEmail,
        idCard: encryptedIdCard,  // เก็บรหัสบัตรประชาชนที่เข้ารหัส
      },
    });

    res.json({ message: "✅ Booking created!", id: booking.id });
  } catch (err) {
    console.error('❌ Error creating booking:', err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API สำหรับดึงข้อมูลการจอง
// ในไฟล์ server.js หรือไฟล์ที่เกี่ยวข้อง
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });

    // ถอดรหัสข้อมูลที่ดึงมา
    const decryptedBookings = bookings.map((b) => ({
      ...b,
      title: decrypt(b.title),
      description: decrypt(b.description),
      userEmail: decrypt(b.userEmail),
      idCard: decrypt(b.idCard),  // ถอดรหัสรหัสบัตรประชาชน
    }));

    const userEmail = req.userEmail; // ค่าของ userEmail ที่ได้จากการล็อกอิน (จาก session หรือ middleware)

    // ถ้าอีเมลตรง ให้แสดงข้อมูลรหัสบัตรประชาชน
    const userBookings = decryptedBookings.map((booking) => {
      if (booking.userEmail === userEmail) {
        return booking;  // ถ้าตรง ก็แสดงข้อมูลปกติ
      } else {
        return { ...booking, idCard: '***Hidden***' };  // ถ้าไม่ตรง จะซ่อนรหัสบัตร
      }
    });

    res.json(userBookings);  // ส่งข้อมูลกลับไปยัง frontend
  } catch (err) {
    console.error('❌ Error fetching bookings:', err);
    res.status(500).json({ error: "Internal server error" });
  }
});




const PORT = 4000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
