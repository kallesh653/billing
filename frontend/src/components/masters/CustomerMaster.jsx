import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Switch,
  InputNumber,
  Checkbox
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import Layout from '../common/Layout';

const { Option } = Select;
const { TextArea } = Input;

function CustomerMaster() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm();
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingAddresses, setShippingAddresses] = useState([]);

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, []);

  const fetchCustomers = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await api.get('/customers', {
        params: {
          page,
          limit: pagination.pageSize,
          search
        }
      });

      if (response.data.success) {
        setCustomers(response.data.data);
        setPagination({
          ...pagination,
          current: response.data.pagination.page,
          total: response.data.pagination.total
        });
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to fetch customers');
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/customers/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    setSameAsBilling(true);
    setShippingAddresses([]);
    setIsModalVisible(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue({
      ...customer,
      'billingAddress.addressLine1': customer.billingAddress?.addressLine1,
      'billingAddress.addressLine2': customer.billingAddress?.addressLine2,
      'billingAddress.city': customer.billingAddress?.city,
      'billingAddress.state': customer.billingAddress?.state,
      'billingAddress.pincode': customer.billingAddress?.pincode,
      shippingAddresses: customer.shippingAddresses || []
    });
    setSameAsBilling(customer.shippingAddress?.sameAsBilling !== false);
    setShippingAddresses(customer.shippingAddresses || []);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/customers/${id}`);
      if (response.data.success) {
        message.success('Customer deleted successfully');
        fetchCustomers(pagination.current, searchText);
        fetchStats();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to delete customer');
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const customerData = {
        ...values,
        billingAddress: {
          addressLine1: values['billingAddress.addressLine1'],
          addressLine2: values['billingAddress.addressLine2'],
          city: values['billingAddress.city'],
          state: values['billingAddress.state'],
          pincode: values['billingAddress.pincode'],
          country: 'India'
        },
        shippingAddress: sameAsBilling ? { sameAsBilling: true } : { sameAsBilling: false },
        shippingAddresses: values.shippingAddresses || []
      };

      // Remove the dot-notation fields
      Object.keys(customerData).forEach(key => {
        if (key.includes('.')) {
          delete customerData[key];
        }
      });

      let response;
      if (editingCustomer) {
        response = await api.put(`/customers/${editingCustomer._id}`, customerData);
        message.success('Customer updated successfully');
      } else {
        response = await api.post('/customers', customerData);
        message.success('Customer created successfully');
      }

      setIsModalVisible(false);
      form.resetFields();
      fetchCustomers(pagination.current, searchText);
      fetchStats();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save customer');
    }
    setLoading(false);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    fetchCustomers(1, value);
  };

  const handleTableChange = (newPagination) => {
    fetchCustomers(newPagination.current, searchText);
  };

  const columns = [
    {
      title: 'Customer Code',
      dataIndex: 'customerCode',
      key: 'customerCode',
      width: 120,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 180,
    },
    {
      title: 'Company',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 150,
    },
    {
      title: 'Mobile',
      dataIndex: 'mobile',
      key: 'mobile',
      width: 120,
      render: (text) => (
        <Space>
          <PhoneOutlined />
          {text}
        </Space>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      render: (text) => text || '-'
    },
    {
      title: 'Type',
      dataIndex: 'customerType',
      key: 'customerType',
      width: 100,
      render: (type) => {
        const colors = {
          Regular: 'default',
          Wholesale: 'blue',
          Retail: 'green',
          Distributor: 'purple',
          Corporate: 'orange'
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      }
    },
    {
      title: 'Outstanding',
      dataIndex: 'outstandingBalance',
      key: 'outstandingBalance',
      width: 120,
      align: 'right',
      render: (amount) => `₹ ${amount.toFixed(2)}`
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this customer?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Layout>
    <div style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '24px' }}>Customer Management</h2>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Customers"
              value={stats.totalCustomers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#667eea' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Inactive Customers"
              value={stats.totalInactive || 0}
              valueStyle={{ color: '#ef4444' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Wholesale"
              value={stats.typeStats?.find(t => t._id === 'Wholesale')?.count || 0}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Corporate"
              value={stats.typeStats?.find(t => t._id === 'Corporate')?.count || 0}
              valueStyle={{ color: '#f97316' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Search and Add Button */}
      <Card>
        <Space style={{ marginBottom: '16px', width: '100%', justifyContent: 'space-between' }}>
          <Input
            placeholder="Search by name, mobile, email, or code"
            prefix={<SearchOutlined />}
            style={{ width: 400 }}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add New Customer
          </Button>
        </Space>

        {/* Customers Table */}
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="_id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={900}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <h3>Basic Information</h3>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerName"
                label="Customer Name"
                rules={[{ required: true, message: 'Please enter customer name' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Customer Name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="companyName" label="Company Name">
                <Input placeholder="Company Name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="mobile"
                label="Mobile"
                rules={[{ required: true, message: 'Please enter mobile number' }]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="Mobile Number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="alternatePhone" label="Alternate Phone">
                <Input prefix={<PhoneOutlined />} placeholder="Alternate Phone" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input prefix={<MailOutlined />} type="email" placeholder="Email Address" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customerType"
                label="Customer Type"
                initialValue="Regular"
              >
                <Select>
                  <Option value="Regular">Regular</Option>
                  <Option value="Wholesale">Wholesale</Option>
                  <Option value="Retail">Retail</Option>
                  <Option value="Distributor">Distributor</Option>
                  <Option value="Corporate">Corporate</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="gstNumber" label="GST Number">
                <Input placeholder="GST Number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="panNumber" label="PAN Number">
                <Input placeholder="PAN Number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isActive" label="Active" valuePropName="checked" initialValue={true}>
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="creditLimit" label="Credit Limit" initialValue={0}>
                <InputNumber
                  style={{ width: '100%' }}
                  prefix="₹"
                  min={0}
                  placeholder="Credit Limit"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="creditDays" label="Credit Days" initialValue={0}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="Credit Days"
                />
              </Form.Item>
            </Col>
          </Row>

          <h3 style={{ marginTop: '24px' }}>Billing Address</h3>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="billingAddress.addressLine1"
                label="Address Line 1"
                rules={[{ required: true, message: 'Please enter address' }]}
              >
                <Input prefix={<HomeOutlined />} placeholder="Address Line 1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="billingAddress.addressLine2" label="Address Line 2">
                <Input placeholder="Address Line 2" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="billingAddress.city"
                label="City"
                rules={[{ required: true, message: 'Please enter city' }]}
              >
                <Input placeholder="City" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="billingAddress.state"
                label="State"
                rules={[{ required: true, message: 'Please enter state' }]}
              >
                <Input placeholder="State" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="billingAddress.pincode"
                label="Pincode"
                rules={[{ required: true, message: 'Please enter pincode' }]}
              >
                <Input placeholder="Pincode" />
              </Form.Item>
            </Col>
          </Row>

          <h3 style={{ marginTop: '24px' }}>Shipping Addresses</h3>
          <Checkbox
            checked={sameAsBilling}
            onChange={(e) => setSameAsBilling(e.target.checked)}
            style={{ marginBottom: '16px' }}
          >
            Use Billing Address (default)
          </Checkbox>

          {!sameAsBilling && (
            <Form.List name="shippingAddresses">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card key={key} style={{ marginBottom: 12 }}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, 'companyName']} label="Company Name">
                            <Input placeholder="Company Name" />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item {...restField} name={[name, 'gstNumber']} label="GST No">
                            <Input placeholder="GST Number" />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item {...restField} name={[name, 'panNumber']} label="PAN No">
                            <Input placeholder="PAN Number" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item {...restField} name={[name, 'mobile']} label="Mobile">
                            <Input placeholder="Mobile" />
                          </Form.Item>
                        </Col>
                        <Col span={16}>
                          <Form.Item {...restField} name={[name, 'addressLine1']} label="Address Line 1">
                            <Input placeholder="Address Line 1" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item {...restField} name={[name, 'addressLine2']} label="Address Line 2">
                            <Input placeholder="Address Line 2" />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item {...restField} name={[name, 'city']} label="City">
                            <Input placeholder="City" />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item {...restField} name={[name, 'state']} label="State">
                            <Input placeholder="State" />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item {...restField} name={[name, 'pincode']} label="Pincode">
                            <Input placeholder="Pincode" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button danger type="link" onClick={() => remove(name)}>Remove</Button>
                      </Space>
                    </Card>
                  ))}
                  <Button type="dashed" onClick={() => add()} style={{ width: '100%' }}>
                    + Add Shipping Address
                  </Button>
                </>
              )}
            </Form.List>
          )}

          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} placeholder="Additional notes about the customer" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingCustomer ? 'Update' : 'Create'} Customer
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
    </Layout>
  );
}

export default CustomerMaster;
