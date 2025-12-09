import { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs, Typography } from 'antd';
import { UserOutlined, LockOutlined, ShopOutlined, CrownOutlined, TeamOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('admin');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    const result = await login(values.username, values.password);

    if (result.success) {
      // Check if user role matches selected tab
      if (activeTab === 'admin' && result.user.role !== 'admin') {
        message.error('This account is not an Admin account. Please login as Cashier.');
        setLoading(false);
        return;
      }
      if (activeTab === 'user' && result.user.role !== 'user') {
        message.error('This account is not a Cashier account. Please login as Admin.');
        setLoading(false);
        return;
      }

      message.success(`Welcome ${result.user.name}!`);
      navigate('/dashboard');
    } else {
      message.error(result.message);
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated background bubbles */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 0
      }}>
        <div className="bubble" style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          top: '-100px',
          left: '-100px',
          animation: 'float 20s infinite ease-in-out'
        }} />
        <div className="bubble" style={{
          position: 'absolute',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          bottom: '-50px',
          right: '-50px',
          animation: 'float 15s infinite ease-in-out',
          animationDelay: '2s'
        }} />
        <div className="bubble" style={{
          position: 'absolute',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.06)',
          top: '40%',
          right: '10%',
          animation: 'float 18s infinite ease-in-out',
          animationDelay: '4s'
        }} />
      </div>

      <Card
        className="login-card"
        style={{
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          borderRadius: 16,
          border: 'none',
          position: 'relative',
          zIndex: 1,
          animation: 'slideUp 0.6s ease-out',
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.95)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src="/logo.jpeg"
            alt="Company Logo"
            style={{
              width: 80,
              height: 80,
              margin: '0 auto 16px',
              display: 'block',
              borderRadius: 12,
              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
              objectFit: 'cover'
            }}
          />
          <Title level={2} style={{ margin: '0 0 8px 0', fontSize: 28, fontWeight: 700, color: '#1a1a1a' }}>
            Company Management System
          </Title>
          <Text style={{ fontSize: 16, color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <ThunderboltOutlined style={{ color: '#667eea' }} />
            Professional Business Management Solution
          </Text>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            form.resetFields();
          }}
          centered
          size="large"
          style={{ marginBottom: 24 }}
          items={[
            {
              key: 'admin',
              label: (
                <span style={{ padding: '0 24px', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CrownOutlined style={{ fontSize: 18 }} /> Admin
                </span>
              )
            },
            {
              key: 'user',
              label: (
                <span style={{ padding: '0 24px', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TeamOutlined style={{ fontSize: 18 }} /> Cashier
                </span>
              )
            }
          ]}
        />

        <div
          style={{
            background: activeTab === 'admin'
              ? 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)'
              : 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
            padding: 20,
            borderRadius: 12,
            marginBottom: 24,
            textAlign: 'center',
            border: `2px solid ${activeTab === 'admin' ? '#ffd666' : '#91d5ff'}`,
            transition: 'all 0.3s ease',
            boxShadow: `0 4px 12px ${activeTab === 'admin' ? 'rgba(255, 214, 102, 0.3)' : 'rgba(145, 213, 255, 0.3)'}`
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700, color: '#262626' }}>
            {activeTab === 'admin' ? 'Admin Login' : 'Cashier Login'}
          </h3>
          <p style={{ margin: 0, color: '#595959', fontSize: 14, fontWeight: 500 }}>
            {activeTab === 'admin' ? 'Full system access and management' : 'Billing & Orders interface'}
          </p>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please enter username!' }]}
            label={<span style={{ fontWeight: 600, color: '#262626' }}>Username</span>}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#667eea' }} />}
              placeholder="Enter your username"
              autoFocus
              style={{
                height: 48,
                borderRadius: 8,
                fontSize: 15
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter password!' }]}
            label={<span style={{ fontWeight: 600, color: '#262626' }}>Password</span>}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#667eea' }} />}
              placeholder="Enter your password"
              style={{
                height: 48,
                borderRadius: 8,
                fontSize: 15
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 52,
                fontSize: 17,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: 10,
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
              }}
            >
              {activeTab === 'admin' ? <CrownOutlined /> : <TeamOutlined />}
              {' '}Login as {activeTab === 'admin' ? 'Admin' : 'Cashier'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
