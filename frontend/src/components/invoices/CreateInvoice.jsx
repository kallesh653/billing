import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  Table,
  InputNumber,
  Space,
  message,
  Row,
  Col,
  Divider,
  Typography,
  Modal
} from 'antd';
import {
  DeleteOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Layout from '../common/Layout';
import api from '../../services/api';
import moment from 'moment';

const { TextArea } = Input;
const { Title, Text } = Typography;

function CreateInvoice() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedShippingId, setSelectedShippingId] = useState(null);
  const [calculations, setCalculations] = useState({
    subtotal: 0,
    totalCGST: 0,
    totalSGST: 0,
    totalIGST: 0,
    totalTax: 0,
    grandTotal: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [invoiceItems]);

  const loadInitialData = async () => {
    const results = await Promise.allSettled([
      api.get('/customers', { params: { page: 1, limit: 100 } }),
      api.get('/subcodes')
    ]);

    const [customersRes, productsRes] = results;

    if (customersRes.status === 'fulfilled' && customersRes.value?.data?.success) {
      setCustomers(customersRes.value.data.data || []);
    } else {
      console.error('Customers load failed:', customersRes.reason);
      message.warning('Customers could not be loaded. You can still add items.');
    }

    if (productsRes.status === 'fulfilled' && productsRes.value?.data?.success) {
      const d = productsRes.value.data;
      setProducts(d.subCodes || d.data || []);
    } else {
      console.error('Products load failed:', productsRes.reason);
      message.warning('Products could not be loaded. Try Refresh.');
    }
  };

  const handleCustomerSelect = (value) => {
    const customer = customers.find(c => c._id === value);
    setSelectedCustomer(customer || null);
    setSelectedShippingId(null);
  };

  const calculateItemAmounts = (item) => {
    const quantity = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    const discount = parseFloat(item.discount) || 0;
    const taxRate = parseFloat(item.taxRate) || 0;

    const baseAmount = quantity * rate;
    const discountAmount = (baseAmount * discount) / 100;
    const amount = baseAmount - discountAmount;
    const taxAmount = (amount * taxRate) / 100;

    return {
      ...item,
      cgst: taxAmount / 2,
      sgst: taxAmount / 2,
      igst: 0,
      amount: amount,
      totalAmount: amount + taxAmount
    };
  };

  const handleAddItem = (productId) => {
    if (!productId) return;

    const product = products.find(p => p._id === productId);
    if (!product) return;

    const existingItem = invoiceItems.find(item => item.productId === productId);
    if (existingItem) {
      message.warning('Item already added. Update quantity in the table.');
      return;
    }

    const newItem = calculateItemAmounts({
      key: Date.now(),
      productId: product._id,
      itemName: product.name || 'Unknown Item',
      hsnCode: product.hsnCode || '',
      quantity: 1,
      rate: product.price || 0,
      taxRate: product.gstPercent || 0,
      discount: 0,
      unit: product.unit || 'Nos'
    });

    setInvoiceItems([...invoiceItems, newItem]);
  };

  const handleItemChange = (key, field, value) => {
    const updatedItems = invoiceItems.map(item => {
      if (item.key === key) {
        const updatedItem = { ...item, [field]: value };
        return calculateItemAmounts(updatedItem);
      }
      return item;
    });
    setInvoiceItems(updatedItems);
  };

  const handleDeleteItem = (key) => {
    setInvoiceItems(invoiceItems.filter(item => item.key !== key));
  };

  const calculateTotals = () => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const totalCGST = invoiceItems.reduce((sum, item) => sum + (parseFloat(item.cgst) || 0), 0);
    const totalSGST = invoiceItems.reduce((sum, item) => sum + (parseFloat(item.sgst) || 0), 0);
    const totalIGST = invoiceItems.reduce((sum, item) => sum + (parseFloat(item.igst) || 0), 0);
    const totalTax = totalCGST + totalSGST + totalIGST;
    const grandTotal = subtotal + totalTax;

    setCalculations({
      subtotal,
      totalCGST,
      totalSGST,
      totalIGST,
      totalTax,
      grandTotal
    });
  };

  const handleSubmit = async (values) => {
    if (invoiceItems.length === 0) {
      message.error('Please add at least one item to the invoice');
      return;
    }

    if (!selectedCustomer) {
      message.error('Please select a customer');
      return;
    }

    try {
      setLoading(true);

      const invoiceData = {
        customer: selectedCustomer._id,
        shippingAddressId: selectedShippingId || undefined,
        invoiceDate: values.invoiceDate.format('YYYY-MM-DD'),
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : null,
        invoiceType: values.invoiceType || 'Tax Invoice',
        templateType: values.templateType || 'Classic',
        items: invoiceItems.map(item => ({
          itemId: item.productId,
          itemName: item.itemName,
          hsnCode: item.hsnCode,
          quantity: parseFloat(item.quantity) || 0,
          rate: parseFloat(item.rate) || 0,
          discount: parseFloat(item.discount) || 0,
          discountType: 'percentage',
          taxRate: parseFloat(item.taxRate) || 0,
          unit: item.unit
        })),
        notes: values.notes || '',
        termsAndConditions: values.termsAndConditions || ''
      };

      const response = await api.post('/invoices', invoiceData);

      if (response.data.success) {
        message.success('Invoice created successfully!');

        Modal.confirm({
          title: 'Invoice Created Successfully',
          content: 'Would you like to download the PDF invoice?',
          okText: 'Download PDF',
          cancelText: 'View Invoices',
          onOk: async () => {
            try {
              const pdfResponse = await api.get(`/invoices/${response.data.data._id}/pdf`, {
                responseType: 'blob'
              });
              const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `${response.data.data.invoiceNumber}.pdf`);
              document.body.appendChild(link);
              link.click();
              link.remove();
              window.URL.revokeObjectURL(url);
              navigate('/invoices');
            } catch (error) {
              console.error('PDF download error:', error);
              message.error('Failed to download PDF');
              navigate('/invoices');
            }
          },
          onCancel: () => {
            navigate('/invoices');
          }
        });
      }
    } catch (error) {
      console.error('Invoice creation error:', error);
      message.error(error.response?.data?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const itemColumns = [
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      width: 220,
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handleItemChange(record.key, 'itemName', e.target.value)}
          placeholder="Item Name"
          size="small"
        />
      )
    },
    {
      title: 'UOM',
      dataIndex: 'unit',
      key: 'unit',
      width: 120,
      render: (text, record) => (
        <Select
          value={text}
          onChange={(value) => handleItemChange(record.key, 'unit', value)}
          size="small"
          style={{ width: '100%' }}
        >
          <Select.Option value="Dozen">Dozen</Select.Option>
          <Select.Option value="Nos">Nos</Select.Option>
          <Select.Option value="Pieces">Pieces</Select.Option>
          <Select.Option value="Box">Box</Select.Option>
          <Select.Option value="Packets">Packets</Select.Option>
          <Select.Option value="KG">KG</Select.Option>
          <Select.Option value="Liter">Liter</Select.Option>
          <Select.Option value="ML">ML</Select.Option>
          <Select.Option value="Gram">Gram</Select.Option>
          <Select.Option value="Piece">Piece</Select.Option>
        </Select>
      )
    },
    {
      title: 'HSN Code',
      dataIndex: 'hsnCode',
      key: 'hsnCode',
      width: 120,
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handleItemChange(record.key, 'hsnCode', e.target.value)}
          placeholder="HSN Code"
          size="small"
        />
      )
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (text, record) => (
        <InputNumber
          value={text}
          onChange={(value) => handleItemChange(record.key, 'quantity', value || 0)}
          min={0}
          style={{ width: '100%' }}
          size="small"
        />
      )
    },
    {
      title: 'Rate (₹)',
      dataIndex: 'rate',
      key: 'rate',
      width: 120,
      render: (text, record) => (
        <InputNumber
          value={text}
          onChange={(value) => handleItemChange(record.key, 'rate', value || 0)}
          min={0}
          precision={2}
          style={{ width: '100%' }}
          size="small"
        />
      )
    },
    {
      title: 'Discount (%)',
      dataIndex: 'discount',
      key: 'discount',
      width: 100,
      render: (text, record) => (
        <InputNumber
          value={text}
          onChange={(value) => handleItemChange(record.key, 'discount', value || 0)}
          min={0}
          max={100}
          precision={2}
          style={{ width: '100%' }}
          size="small"
        />
      )
    },
    {
      title: 'Tax %',
      dataIndex: 'taxRate',
      key: 'taxRate',
      width: 100,
      render: (text, record) => (
        <InputNumber
          value={text}
          onChange={(value) => handleItemChange(record.key, 'taxRate', value || 0)}
          min={0}
          max={28}
          precision={2}
          style={{ width: '100%' }}
          size="small"
        />
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (text) => `₹${(parseFloat(text) || 0).toFixed(2)}`
    },
    {
      title: 'Tax',
      key: 'tax',
      width: 100,
      align: 'right',
      render: (_, record) => {
        const tax = (parseFloat(record.cgst) || 0) + (parseFloat(record.sgst) || 0) + (parseFloat(record.igst) || 0);
        return `₹${tax.toFixed(2)}`;
      }
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      align: 'right',
      render: (text) => <strong>₹{(parseFloat(text) || 0).toFixed(2)}</strong>
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteItem(record.key)}
          size="small"
        />
      )
    }
  ];

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ShoppingCartOutlined style={{ fontSize: 24, color: '#667eea' }} />
              <span>Create New Invoice</span>
            </div>
          }
          extra={
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/invoices')}
            >
              Back to Invoices
            </Button>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              invoiceDate: moment(),
              invoiceType: 'Tax Invoice',
              templateType: 'Classic'
            }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Customer"
                  name="customer"
                  rules={[{ required: true, message: 'Please select a customer' }]}
                >
                  <Select
                    showSearch
                    placeholder="Select customer"
                    onChange={handleCustomerSelect}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())
                    }
                    size="large"
                  >
                    {customers.map(customer => (
                      <Select.Option key={customer._id} value={customer._id}>
                        {customer.customerName} - {customer.mobile}
                        {customer.companyName ? ` (${customer.companyName})` : ''}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  label="Invoice Date"
                  name="invoiceDate"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item label="Due Date" name="dueDate">
                  <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Invoice Type"
                  name="invoiceType"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Select size="large">
                    <Select.Option value="Tax Invoice">Tax Invoice</Select.Option>
                    <Select.Option value="Proforma Invoice">Proforma Invoice</Select.Option>
                    <Select.Option value="Credit Note">Credit Note</Select.Option>
                    <Select.Option value="Debit Note">Debit Note</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Template" name="templateType">
                  <Select size="large">
                    <Select.Option value="Classic">Classic</Select.Option>
                    <Select.Option value="Modern">Modern</Select.Option>
                    <Select.Option value="Minimal">Minimal</Select.Option>
                    <Select.Option value="Professional">Professional</Select.Option>
                    <Select.Option value="Colorful">Colorful</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {selectedCustomer && (
              <Card size="small" style={{ marginBottom: 16, background: '#f5f7fa' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong>Customer Details:</Text>
                    <div>{selectedCustomer.customerName}</div>
                    {selectedCustomer.companyName && <div>{selectedCustomer.companyName}</div>}
                    <div>{selectedCustomer.mobile}</div>
                  </Col>
                  <Col span={12}>
                    <Text strong>Shipping Address:</Text>
                    <Select
                      placeholder="Select shipping address"
                      value={selectedShippingId}
                      onChange={setSelectedShippingId}
                      style={{ width: '100%', marginTop: 8 }}
                      size="small"
                    >
                      {(selectedCustomer.shippingAddresses || []).map(addr => (
                        <Select.Option key={addr._id} value={addr._id}>
                          {(addr.companyName ? addr.companyName + ' - ' : '')}
                          {addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode}
                        </Select.Option>
                      ))}
                      {!selectedCustomer.shippingAddresses?.length && (
                        <Select.Option value="billing" key="billing">Use Billing Address</Select.Option>
                      )}
                    </Select>
                  </Col>
                </Row>
              </Card>
            )}

            <Divider>Invoice Items</Divider>

            <Form.Item label="Add Product">
              <Select
                showSearch
                placeholder="Search and select product to add"
                onSelect={handleAddItem}
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())
                }
                size="large"
                value={null}
              >
                {products.map(product => (
                  <Select.Option key={product._id} value={product._id}>
                    {product.name} - ₹{product.price || 0} (Stock: {product.currentStock || 0})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Button type="dashed" onClick={() => setInvoiceItems([...invoiceItems, calculateItemAmounts({ key: Date.now(), productId: null, itemName: '', hsnCode: '', quantity: 1, rate: 0, taxRate: 0, discount: 0, unit: 'Nos' })])}>
              + Add Custom Item
            </Button>

            <Table
              columns={itemColumns}
              dataSource={invoiceItems}
              pagination={false}
              scroll={{ x: 1200 }}
              size="small"
              locale={{ emptyText: 'No items added. Select products from above to add.' }}
              footer={() => (
                <div style={{ textAlign: 'right' }}>
                  <Space direction="vertical" style={{ width: 300 }}>
                    <Row justify="space-between">
                      <Text>Subtotal:</Text>
                      <Text strong>₹{calculations.subtotal.toFixed(2)}</Text>
                    </Row>
                    {calculations.totalCGST > 0 && (
                      <Row justify="space-between">
                        <Text>CGST:</Text>
                        <Text>₹{calculations.totalCGST.toFixed(2)}</Text>
                      </Row>
                    )}
                    {calculations.totalSGST > 0 && (
                      <Row justify="space-between">
                        <Text>SGST:</Text>
                        <Text>₹{calculations.totalSGST.toFixed(2)}</Text>
                      </Row>
                    )}
                    {calculations.totalIGST > 0 && (
                      <Row justify="space-between">
                        <Text>IGST:</Text>
                        <Text>₹{calculations.totalIGST.toFixed(2)}</Text>
                      </Row>
                    )}
                    <Row justify="space-between">
                      <Text>Total Tax:</Text>
                      <Text>₹{calculations.totalTax.toFixed(2)}</Text>
                    </Row>
                    <Divider style={{ margin: '8px 0' }} />
                    <Row justify="space-between">
                      <Title level={4} style={{ margin: 0 }}>Grand Total:</Title>
                      <Title level={4} style={{ margin: 0, color: '#667eea' }}>
                        ₹{calculations.grandTotal.toFixed(2)}
                      </Title>
                    </Row>
                  </Space>
                </div>
              )}
            />

            <Divider>Additional Information</Divider>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Notes" name="notes">
                  <TextArea rows={3} placeholder="Add any notes for the customer" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Terms & Conditions" name="termsAndConditions">
                  <TextArea rows={3} placeholder="Payment terms, delivery terms, etc." />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginTop: 24 }}>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                  size="large"
                  disabled={invoiceItems.length === 0}
                >
                  Create Invoice
                </Button>
                <Button
                  onClick={() => navigate('/invoices')}
                  size="large"
                >
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </Layout>
  );
}

export default CreateInvoice;
