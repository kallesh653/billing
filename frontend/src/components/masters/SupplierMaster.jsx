import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, message, Space, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';

const SupplierMaster = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: response } = await api.get('/suppliers');
      setData(response.suppliers);
    } catch (error) {
      message.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        await api.put(`/suppliers/${editingItem._id}`, values);
        message.success('Supplier updated successfully');
      } else {
        await api.post('/suppliers', values);
        message.success('Supplier created successfully');
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
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/suppliers/${id}`);
      message.success('Supplier deleted successfully');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    {
      title: 'Supplier Name',
      dataIndex: 'supplierName',
      key: 'supplierName',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{name}</div>
          {record.contactPerson && (
            <div style={{ fontSize: 12, color: '#999' }}>
              Contact: {record.contactPerson}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Mobile',
      dataIndex: 'mobile',
      key: 'mobile',
      render: (mobile) => (
        <Space>
          <PhoneOutlined style={{ color: '#667eea' }} />
          {mobile}
        </Space>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => email ? (
        <Space>
          <MailOutlined style={{ color: '#667eea' }} />
          {email}
        </Space>
      ) : '-'
    },
    {
      title: 'GST Number',
      dataIndex: 'gstNumber',
      key: 'gstNumber',
      render: (gst) => gst || '-'
    },
    {
      title: 'Total Purchased',
      dataIndex: 'totalPurchased',
      key: 'totalPurchased',
      render: (amount) => `₹${amount?.toFixed(2) || '0.00'}`,
      align: 'right'
    },
    {
      title: 'Pending',
      dataIndex: 'totalPending',
      key: 'totalPending',
      render: (amount) => (
        <Tag color={amount > 0 ? 'red' : 'green'}>
          ₹{amount?.toFixed(2) || '0.00'}
        </Tag>
      ),
      align: 'right'
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete this supplier?" onConfirm={() => handleDelete(record._id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Layout>
      <h1 style={{ marginBottom: 24, fontSize: 28, fontWeight: 600 }}>
        Supplier Master
      </h1>
      <p style={{ marginTop: -15, marginBottom: 24, color: '#666' }}>
        Manage all your suppliers in one place
      </p>

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
          Add New Supplier
        </Button>

        <Table
          dataSource={data}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingItem ? 'Edit Supplier' : 'Add New Supplier'}
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
            name="supplierName"
            label="Supplier Name"
            rules={[{ required: true, message: 'Please enter supplier name' }]}
          >
            <Input placeholder="Enter supplier name" size="large" />
          </Form.Item>

          <Form.Item name="contactPerson" label="Contact Person">
            <Input placeholder="Enter contact person name" size="large" />
          </Form.Item>

          <Form.Item
            name="mobile"
            label="Mobile Number"
            rules={[{ required: true, message: 'Please enter mobile number' }]}
          >
            <Input placeholder="Enter mobile number" size="large" />
          </Form.Item>

          <Form.Item name="email" label="Email Address">
            <Input type="email" placeholder="Enter email address" size="large" />
          </Form.Item>

          <Form.Item name="gstNumber" label="GST Number">
            <Input placeholder="Enter GST number" size="large" />
          </Form.Item>

          <Form.Item label="Address">
            <Input.Group compact>
              <Form.Item name={['address', 'street']} noStyle>
                <Input placeholder="Street" style={{ width: '100%', marginBottom: 8 }} />
              </Form.Item>
              <Form.Item name={['address', 'city']} noStyle>
                <Input placeholder="City" style={{ width: '50%', marginBottom: 8 }} />
              </Form.Item>
              <Form.Item name={['address', 'state']} noStyle>
                <Input placeholder="State" style={{ width: '50%', marginBottom: 8 }} />
              </Form.Item>
              <Form.Item name={['address', 'pincode']} noStyle>
                <Input placeholder="Pincode" style={{ width: '100%' }} />
              </Form.Item>
            </Input.Group>
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large">
            {editingItem ? 'Update Supplier' : 'Create Supplier'}
          </Button>
        </Form>
      </Modal>
    </Layout>
  );
};

export default SupplierMaster;
