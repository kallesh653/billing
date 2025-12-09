import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Popconfirm,
  Tag,
  Switch,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  TeamOutlined,
  CrownOutlined,
  LockOutlined,
  MailOutlined
} from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';

const UserMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [stats, setStats] = useState({ total: 0, admins: 0, cashiers: 0, active: 0 });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: response } = await api.get('/auth/users');
      setData(response.users || []);

      // Calculate stats
      const total = response.users?.length || 0;
      const admins = response.users?.filter(u => u.role === 'admin').length || 0;
      const cashiers = response.users?.filter(u => u.role === 'cashier').length || 0;
      const active = response.users?.filter(u => u.isActive).length || 0;
      setStats({ total, admins, cashiers, active });
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        await api.put(`/auth/users/${editingItem._id}`, values);
        message.success('User updated successfully');
      } else {
        await api.post('/auth/register', values);
        message.success('User created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingItem(null);
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue({
      name: record.name,
      username: record.username,
      email: record.email,
      role: record.role,
      isActive: record.isActive,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/auth/users/${id}`);
      message.success('User deleted successfully');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/auth/users/${id}`, { isActive: !currentStatus });
      message.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Status update failed');
    }
  };

  const columns = [
    {
      title: 'User',
      dataIndex: 'name',
      key: 'name',
      responsive: ['xs', 'sm', 'md', 'lg'],
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            {record.role === 'admin' ? (
              <CrownOutlined style={{ color: '#faad14' }} />
            ) : (
              <UserOutlined style={{ color: '#667eea' }} />
            )}
            {name}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>@{record.username}</div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      responsive: ['md', 'lg'],
      render: (email) =>
        email ? (
          <Space>
            <MailOutlined style={{ color: '#667eea' }} />
            {email}
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      responsive: ['sm', 'md', 'lg'],
      render: (role) => (
        <Tag
          icon={role === 'admin' ? <CrownOutlined /> : <TeamOutlined />}
          color={role === 'admin' ? 'gold' : 'blue'}
          style={{ fontSize: 13, padding: '4px 12px', fontWeight: 600 }}
        >
          {role === 'admin' ? 'Administrator' : 'Cashier'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      responsive: ['xs', 'sm', 'md', 'lg'],
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleStatus(record._id, isActive)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      responsive: ['xs', 'sm', 'md', 'lg'],
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
            type="primary"
            ghost
          />
          <Popconfirm
            title="Delete this user?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>User Management</h1>
        <p style={{ color: '#666', fontSize: 14 }}>
          Manage administrators and cashiers
        </p>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.total}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#667eea' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Administrators"
              value={stats.admins}
              prefix={<CrownOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Cashiers"
              value={stats.cashiers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={stats.active}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingItem(null);
            form.resetFields();
            setModalVisible(true);
          }}
          style={{ marginBottom: 16 }}
          size="large"
        >
          Add New User
        </Button>

        <Table
          dataSource={data}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 768 }}
        />
      </Card>

      <Modal
        title={
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            {editingItem ? 'Edit User' : 'Add New User'}
          </div>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingItem(null);
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter full name' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter full name"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please enter username' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter username"
              size="large"
              disabled={!!editingItem}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              type="email"
              placeholder="Enter email address"
              size="large"
            />
          </Form.Item>

          {!editingItem && (
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please enter password' },
                { min: 6, message: 'Password must be at least 6 characters' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter password"
                size="large"
              />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select role' }]}
            initialValue="cashier"
          >
            <Select size="large" placeholder="Select role">
              <Select.Option value="admin">
                <Space>
                  <CrownOutlined style={{ color: '#faad14' }} />
                  Administrator - Full Access
                </Space>
              </Select.Option>
              <Select.Option value="cashier">
                <Space>
                  <UserOutlined style={{ color: '#667eea' }} />
                  Cashier - Limited Access
                </Space>
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="isActive"
            label="User Status"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch
              checkedChildren="Active"
              unCheckedChildren="Inactive"
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large">
            {editingItem ? 'Update User' : 'Create User'}
          </Button>
        </Form>
      </Modal>
    </Layout>
  );
};

export default UserMaster;
