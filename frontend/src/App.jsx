import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Container, Button, Form, Table, Row, Col, Card } from 'react-bootstrap';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import './index.css';

function App() {
  const [session, setSession] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', idCard: '' });
  const [bookings, setBookings] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (event === "SIGNED_IN" && session?.user?.email) {
        await axios.post("http://localhost:4000/api/login-log", {
          email: session.user.email,
          displayName: session.user.user_metadata?.full_name || '',
        });
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session?.user?.email) {
      fetchBookings();
    }
  }, [session]);

  const fetchBookings = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/bookings', {
        headers: {
          'x-user-email': session?.user?.email || '',
        }
      });
      setBookings(res.data);
    } catch {
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) return toast.error('กรุณาเข้าสู่ระบบก่อน');
    if (!form.title || !form.description || !startDate || !startTime || !endTime || !form.idCard)
      return toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');

    try {
      const dateStr = startDate.toLocaleDateString('sv-SE'); // YYYY-MM-DD
      const payload = {
        ...form,
        start: new Date(`${dateStr} ${startTime}`).toISOString(),
        end: new Date(`${dateStr} ${endTime}`).toISOString(),
        userEmail: session.user.email,
      };

      const conflict = bookings.find(
        (b) =>
          new Date(b.start).toISOString() === payload.start ||
          new Date(b.end).toISOString() === payload.end
      );
      if (conflict) return toast.error('ไม่สามารถจองในวันและเวลาเดียวกันได้');

      await axios.post('http://localhost:4000/api/bookings', payload);
      toast.success('บันทึกการจองสำเร็จ');
      setForm({ title: '', description: '', idCard: '' });
      setStartTime('');
      setEndTime('');
      setStartDate(null);
      fetchBookings();
    } catch {
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:4000/api/logout-log', {
        email: session.user.email,
      });
    } catch {}
    await supabase.auth.signOut();
    setSession(null);
    toast.success('ออกจากระบบสำเร็จ');
  };

  const handleIdCardChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      if (value.length <= 13) {
        setForm({ ...form, idCard: value });
      } else {
        toast.error('รหัสบัตรประชาชนต้องมี 13 หลักเท่านั้น');
      }
    }
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let i = 9; i <= 18; i++) {
      times.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return times;
  };

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100 p-3">
      <Row className="w-100">
        <Col xs={12} lg={10} className="mx-auto">
          <Card className="shadow-lg rounded-lg border-0">
            <Card.Header className="bg-green-700 text-white text-center py-4 rounded-t-lg">
              <h2 className="text-2xl font-bold text-black">ระบบคำร้องขอใช้ห้อง 707</h2>
            </Card.Header>
          </Card>

          {!session ? (
            <div className="text-center mb-5">
              <h3 className="text-xl font-semibold mb-3 text-black">เข้าสู่ระบบด้วย Google</h3>
              <Button onClick={handleLogin} variant="success" size="lg" className="rounded-lg shadow-md px-6 py-3 hover:bg-green-700">
                Login with Google
              </Button>
            </div>
          ) : (
            <>
              <h3 className="text-green-700 text-2xl mb-4 font-semibold text-black">สวัสดี {session.user.email}</h3>
              <Button onClick={handleLogout} variant="danger" size="lg" className="rounded-lg shadow-md px-6 py-3 mb-4 hover:bg-red-700">
                ออกจากระบบ
              </Button>

              <Form onSubmit={handleSubmit} className="p-4 border border-gray-200 shadow-sm rounded-lg bg-white">
                <Form.Group>
                  <Form.Label className="font-semibold text-black">หัวข้อ</Form.Label>
                  <Form.Control
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="กรอกหัวข้อการจอง"
                    className="text-black"
                  />
                </Form.Group>

                <Form.Group className="mt-3">
                  <Form.Label className="font-semibold text-black">รายละเอียด</Form.Label>
                  <Form.Control
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="กรอกรายละเอียด"
                    className="text-black"
                  />
                </Form.Group>

                <Form.Group className="mt-3">
                  <Form.Label className="font-semibold text-black">รหัสบัตรประชาชน</Form.Label>
                  <Form.Control
                    value={form.idCard}
                    onChange={handleIdCardChange}
                    placeholder="กรอกเลขบัตรประชาชน"
                    className="text-black"
                  />
                </Form.Group>

                <Row className="mt-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="font-semibold text-black">วันที่</Form.Label>
                      <DatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date)}
                        dateFormat="dd/MM/yyyy"
                        minDate={new Date()}
                        className="text-black w-full p-3"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mt-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="font-semibold text-black">เวลาเริ่ม</Form.Label>
                      <Form.Control as="select" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="text-black">
                        <option value="">เลือกเวลาเริ่ม</option>
                        {generateTimeOptions().map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </Form.Control>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="font-semibold text-black">เวลาสิ้นสุด</Form.Label>
                      <Form.Control as="select" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="text-black">
                        <option value="">เลือกเวลาสิ้นสุด</option>
                        {generateTimeOptions().map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </Form.Control>
                    </Form.Group>
                  </Col>
                </Row>

                <Button type="submit" variant="success" className="w-full py-3 mt-4 text-white rounded-lg shadow-md hover:bg-green-700">
                  บันทึกการจอง
                </Button>
              </Form>

              <h4 className="text-lg font-semibold mt-6 text-black">รายการจองล่าสุด</h4>
              <Table bordered responsive className="shadow-md mt-4 bg-white rounded-lg">
                <thead className="bg-success text-white text-center">
                  <tr>
                    <th>หัวข้อ</th>
                    <th>รายละเอียด</th>
                    <th>เริ่ม</th>
                    <th>สิ้นสุด</th>
                    <th>รหัสบัตรประชาชน</th>
                    <th>โดย</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {bookings.length > 0 ? (
                    bookings.map((b, index) => (
                      <tr key={b.id} className={`${index % 2 === 0 ? "bg-light" : ""}`}>
                        <td>{b.title}</td>
                        <td>{b.description}</td>
                        <td>{new Date(b.start).toLocaleString()}</td>
                        <td>{new Date(b.end).toLocaleString()}</td>
                        <td>{b.idCard}</td>
                        <td>{b.userEmail}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-black">ไม่มีข้อมูล</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </>
          )}
        </Col>
      </Row>
      <ToastContainer />
    </Container>
  );
}

export default App;
