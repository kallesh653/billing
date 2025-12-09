import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';

const MainCodeMaster = () => {
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
      const { data: response } = await api.get('/maincodes');
      setData(response.mainCodes);
    } catch (error) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        await api.put(`/maincodes/${editingItem._id}`, values);
        message.success('Updated successfully');
      } else {
        await api.post('/maincodes', values);
        message.success('Created successfully');
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
      await api.delete(`/maincodes/${id}`);
      message.success('Deleted successfully');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(record._id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Layout>
      <h1>Main Code Master</h1>
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
        >
          Add Main Code
        </Button>

        <Table dataSource={data} columns={columns} rowKey="_id" loading={loading} />
      </Card>

      <Modal
        title={editingItem ? 'Edit Main Code' : 'Add Main Code'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingItem(null);
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="code" label="Code" rules={[{ required: true }]}>
            <Input disabled={!!editingItem} placeholder="01" />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Juices" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </Form>
      </Modal>
    </Layout>
  );
};

export default MainCodeMaster;
