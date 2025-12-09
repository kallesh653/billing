import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, message, Space, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';

const SubCodeMaster = () => {
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
      const { data: response } = await api.get('/subcodes');
      setData(response.subCodes);
    } catch (error) {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      // Ensure unit has a default if not provided
      const submitData = {
        ...values,
        unit: values.unit || 'Piece'
      };

      if (editingItem) {
        await api.put(`/subcodes/${editingItem._id}`, submitData);
        message.success('Product updated successfully');
      } else {
        await api.post('/subcodes', submitData);
        message.success('Product created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingItem(null);
      fetchData();
    } catch (error) {
      console.error('Product operation error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Operation failed';
      message.error(errorMessage);
    }
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/subcodes/${id}`);
      message.success('Deleted successfully');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    { title: 'Product Code', dataIndex: 'subCode', key: 'subCode', width: 150 },
    { title: 'Product Name', dataIndex: 'name', key: 'name' },
    { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 100 },
    { title: 'Selling Price', dataIndex: 'price', key: 'price', width: 120, render: (price) => `₹${price}` },
    { title: 'Cost Price', dataIndex: 'costPrice', key: 'costPrice', width: 120, render: (price) => price ? `₹${price}` : '-' },
    { title: 'Current Stock', dataIndex: 'currentStock', key: 'currentStock', width: 150, render: (stock, record) => {
      if (stock === undefined || stock === null) {
        return <Tag color="blue">Unlimited</Tag>;
      }
      return <Tag color={stock <= record.minStockAlert ? 'red' : 'green'}>{stock} {record.unit}</Tag>;
    }},
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete this product?" onConfirm={() => handleDelete(record._id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Layout>
      <h1>Product Master</h1>
      <Card>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingItem(null); form.resetFields(); setModalVisible(true); }} style={{ marginBottom: 16 }}>
          Add Product
        </Button>
        <Table dataSource={data} columns={columns} rowKey="_id" loading={loading} />
      </Card>

      <Modal title={editingItem ? 'Edit Product' : 'Add Product'} open={modalVisible} onCancel={() => { setModalVisible(false); form.resetFields(); setEditingItem(null); }} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ unit: 'Piece', costPrice: 0, gstPercent: 0 }}>
          <Form.Item name="subCode" label="Product Code" rules={[{ required: true, message: 'Please enter product code' }]}>
            <Input placeholder="e.g., ROSE-100, SANDAL-250" disabled={!!editingItem} />
          </Form.Item>
          <Form.Item name="name" label="Product Name" rules={[{ required: true, message: 'Please enter product name' }]}>
            <Input placeholder="e.g., Rose Agarbatti 100 Sticks" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Optional product description" />
          </Form.Item>
          <Form.Item name="price" label="Selling Price" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="costPrice" label="Cost Price">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="unit" label="Unit" rules={[{ required: true }]}>
            <Select placeholder="Select unit">
              <Select.Option value="Piece">Piece</Select.Option>
              <Select.Option value="Box">Box</Select.Option>
              <Select.Option value="Packet">Packet</Select.Option>
              <Select.Option value="Bundle">Bundle</Select.Option>
              <Select.Option value="Carton">Carton</Select.Option>
              <Select.Option value="KG">KG</Select.Option>
              <Select.Option value="Gram">Gram</Select.Option>
              <Select.Option value="Liter">Liter</Select.Option>
              <Select.Option value="ML">ML</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="currentStock" label="Initial Stock (Optional)" tooltip="Leave empty for unlimited stock">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Opening stock quantity" />
          </Form.Item>
          <Form.Item name="minStockAlert" label="Low Stock Alert Level (Optional)">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Alert when stock falls below this" />
          </Form.Item>
          <Form.Item name="hsnCode" label="HSN Code (Optional)">
            <Input placeholder="HSN/SAC code for GST" />
          </Form.Item>
          <Form.Item name="gstPercent" label="GST % (Optional)">
            <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="GST percentage" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>{editingItem ? 'Update' : 'Create'}</Button>
        </Form>
      </Modal>
    </Layout>
  );
};

export default SubCodeMaster;
