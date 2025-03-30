import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Container, Button, Form, Table, Row, Col, Card } from 'react-bootstrap';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

function App() {
  const [session, setSession] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', start: '', end: '', idCard: '' });
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const fetchBookings = async () => {
    const res = await axios.get('http://localhost:4000/api/bookings');
    setBookings(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      toast.error('กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    if (!form.title || !form.description || !form.start || !form.end || !form.idCard) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const payload = {
      ...form,
      userEmail: session.user.email
    };

    await axios.post('http://localhost:4000/api/bookings', payload);
    setForm({ title: '', description: '', start: '', end: '', idCard: '' });
    fetchBookings();
    toast.success('บันทึกการจองสำเร็จ');
  };

  useEffect(() => {
    if (session) fetchBookings();
  }, [session]);

  const handleLogin = async () => {
    const { user, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) console.error(error);
    else console.log("Logged in as", user);
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

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <Row className="w-100">
        <Col xs={12} lg={8} className="mx-auto">
          <Card className="shadow-lg rounded-lg border-0">
            <Card.Header className="bg-green-700 text-white text-center py-4 rounded-t-lg">
              <h2 className="text-2xl font-bold text-black">ระบบคำร้องขอใช้สถานที่</h2>
            </Card.Header>
          </Card>

          {!session ? (
            <div className="text-center mb-5">
              <h3 className="text-xl font-semibold mb-3 text-black">เข้าสู่ระบบด้วย Google</h3>
              <Button
                onClick={handleLogin}
                variant="success"
                size="lg"
                className="rounded-lg shadow-md px-6 py-3 hover:bg-green-700">
                Login with Google
              </Button>
            </div>
          ) : (
            <>
              <h3 className="text-green-700 text-2xl mb-4 font-semibold text-black">สวัสดี {session.user.email}</h3>

              <Form onSubmit={handleSubmit} className="p-4 border border-gray-200 shadow-sm rounded-lg bg-white">
                <Form.Group>
                  <Form.Label className="font-semibold text-black">หัวข้อ</Form.Label>
                  <Form.Control
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="กรอกหัวข้อการจอง"
                    className="rounded-md border-gray-300 focus:ring-2 focus:ring-green-500 text-black"
                  />
                </Form.Group>

                <Form.Group className="mt-3">
                  <Form.Label className="font-semibold text-black">รายละเอียด</Form.Label>
                  <Form.Control
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="กรอกรายละเอียดการจอง"
                    className="rounded-md border-gray-300 focus:ring-2 focus:ring-green-500 text-black"
                  />
                </Form.Group>

                <Form.Group className="mt-3">
                  <Form.Label className="font-semibold text-black">รหัสบัตรประชาชน</Form.Label>
                  <Form.Control
                    value={form.idCard}
                    onChange={handleIdCardChange}
                    placeholder="กรอกหมายเลขบัตรประชาชน"
                    className="rounded-md border-gray-300 focus:ring-2 focus:ring-green-500 text-black"
                  />
                </Form.Group>

                <Row className="mt-3">
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label className="font-semibold text-black">เวลาเริ่ม</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={form.start}
                        onChange={(e) => setForm({ ...form, start: e.target.value })}
                        className="rounded-md border-gray-300 focus:ring-2 focus:ring-green-500 text-black"
                      />
                    </Form.Group>
                  </Col>

                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label className="font-semibold text-black">เวลาสิ้นสุด</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={form.end}
                        onChange={(e) => setForm({ ...form, end: e.target.value })}
                        className="rounded-md border-gray-300 focus:ring-2 focus:ring-green-500 text-black"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Button type="submit" variant="success" className="w-full py-3 mt-4 text-white rounded-lg shadow-md hover:bg-green-700">
                  บันทึกการจอง
                </Button>
              </Form>

              <h4 className="text-lg font-semibold mt-6 text-black">รายการจองล่าสุด</h4>
              <Table bordered responsive className="shadow-md mt-4 bg-white rounded-lg transition-all duration-300 ease-in-out">
                <thead className="bg-gradient-to-r from-green-500 to-teal-500 text-white text-center">
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
                      <tr
                        key={b.id}
                        className={`${index % 2 === 0 ? "bg-gray-50" : "bg-gray-100"
                          } hover:bg-blue-100 cursor-pointer transition-colors duration-200 hover:scale-105 hover:shadow-xl`}
                      >
                        <td className="py-3 px-4 text-black font-medium">{b.title}</td>
                        <td className="py-3 px-4 text-black">{b.description}</td>
                        <td className="py-3 px-4 text-black">{new Date(b.start).toLocaleString()}</td>
                        <td className="py-3 px-4 text-black">{new Date(b.end).toLocaleString()}</td>
                        <td className="py-3 px-4 text-black">{b.userEmail === session.user.email ? b.idCard : '***Hidden***'}</td>
                        <td className="py-3 px-4 text-black">{b.userEmail}</td>
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

      {/* Toast container */}
      <ToastContainer />
    </Container>
  );
}

export default App;
