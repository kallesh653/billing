import { useState, useEffect } from 'react';
import {
  Card, Row, Col, Select, Button, Table, InputNumber, message, Modal, Input, Radio, Divider, Space, Tag, Badge, Statistic, Avatar, Tooltip, Empty
} from 'antd';
import { PlusOutlined, DeleteOutlined, PrinterOutlined, ClearOutlined, ShoppingCartOutlined, SearchOutlined, FireOutlined, TagsOutlined } from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';
import moment from 'moment';
import { printThermalBill } from '../../utils/exportUtils';

const TakeOrder = () => {
  const [mainCodes, setMainCodes] = useState([]);
  const [subCodes, setSubCodes] = useState([]);
  const [filteredSubCodes, setFilteredSubCodes] = useState([]);
  const [selectedMainCode, setSelectedMainCode] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [billPreview, setBillPreview] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [settings, setSettings] = useState({});

  useEffect(() => {
    fetchMainCodes();
    fetchSubCodes();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings(data.settings || {});
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const fetchMainCodes = async () => {
    try {
      const { data } = await api.get('/maincodes?isActive=true');
      setMainCodes(data.mainCodes);
    } catch (error) {
      message.error('Failed to load main codes');
    }
  };

  const fetchSubCodes = async () => {
    try {
      const { data } = await api.get('/subcodes?isActive=true');
      setSubCodes(data.subCodes);
    } catch (error) {
      message.error('Failed to load sub codes');
    }
  };

  const handleMainCodeChange = (value) => {
    setSelectedMainCode(value);
    setSearchText('');
    const filtered = subCodes.filter((sc) => sc.mainCode._id === value);
    setFilteredSubCodes(filtered);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      if (selectedMainCode) {
        const filtered = subCodes.filter((sc) => sc.mainCode._id === selectedMainCode);
        setFilteredSubCodes(filtered);
      } else {
        setFilteredSubCodes([]);
      }
      return;
    }

    let filtered = selectedMainCode
      ? subCodes.filter((sc) => sc.mainCode._id === selectedMainCode)
      : subCodes;

    filtered = filtered.filter(sc =>
      sc.name.toLowerCase().includes(value.toLowerCase()) ||
      sc.subCode.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredSubCodes(filtered);
  };

  const addToCart = (subCode) => {
    const existingItem = cartItems.find((item) => item._id === subCode._id);

    if (existingItem) {
      // Only check stock if stock tracking is enabled
      if (subCode.currentStock !== undefined && subCode.currentStock !== null && existingItem.quantity >= subCode.currentStock) {
        message.warning('Maximum available stock reached');
        return;
      }
      updateQuantity(subCode._id, existingItem.quantity + 1);
      message.success(`Quantity increased for ${subCode.name}`);
      return;
    }

    // Only check stock if stock tracking is enabled
    if (subCode.currentStock !== undefined && subCode.currentStock !== null && subCode.currentStock <= 0) {
      message.error('Out of stock!');
      return;
    }

    const newItem = {
      ...subCode,
      quantity: 1,
      itemTotal: subCode.price
    };

    setCartItems([...cartItems, newItem]);
    message.success({
      content: `${subCode.name} added to cart`,
      icon: <ShoppingCartOutlined style={{ color: '#52c41a' }} />
    });
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) return;

    const item = cartItems.find((i) => i._id === id);
    // Only check stock if stock tracking is enabled
    if (item.currentStock !== undefined && item.currentStock !== null && item.currentStock < quantity) {
      message.error(`Only ${item.currentStock} units available in stock`);
      return;
    }

    setCartItems(
      cartItems.map((item) =>
        item._id === id
          ? { ...item, quantity, itemTotal: item.price * quantity }
          : item
      )
    );
  };

  const removeFromCart = (id) => {
    setCartItems(cartItems.filter((item) => item._id !== id));
    message.info('Item removed from cart');
  };

  const clearCart = () => {
    Modal.confirm({
      title: 'Clear Cart?',
      content: 'Are you sure you want to clear all items from the cart?',
      okText: 'Yes, Clear',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: () => {
        setCartItems([]);
        setCustomerName('');
        setCustomerMobile('');
        setDiscount(0);
        setPaymentMode('Cash');
        setSelectedMainCode(null);
        setFilteredSubCodes([]);
        setSearchText('');
        message.success('Cart cleared');
      }
    });
  };

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.itemTotal, 0);
    const discountAmount = (subtotal * discount) / 100;
    const afterDiscount = subtotal - discountAmount;

    // Calculate GST if enabled in settings
    const gstEnabled = settings.gstEnabled || false;
    const gstPercent = settings.defaultGstPercent || 0;
    const gstAmount = gstEnabled ? (afterDiscount * gstPercent) / 100 : 0;

    const total = afterDiscount + gstAmount;
    const grandTotal = Math.round(total);
    const roundOff = grandTotal - total;

    return { subtotal, discountAmount, gstAmount, gstPercent, gstEnabled, total, grandTotal, roundOff };
  };

  const generateBill = async () => {
    if (cartItems.length === 0) {
      message.error('Please add items to cart');
      return;
    }

    setLoading(true);

    const { subtotal, discountAmount, gstAmount, gstPercent, grandTotal, roundOff } = calculateTotals();

    const billData = {
      customerName: customerName || 'Walk-in Customer',
      customerMobile,
      items: cartItems.map((item) => ({
        mainCode: item.mainCode._id,
        mainCodeName: item.mainCode.name,
        subCode: item._id,
        subCodeName: item.subCode,
        itemName: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        itemTotal: item.itemTotal,
        costPrice: item.costPrice || 0
      })),
      subtotal,
      discountPercent: discount,
      discountAmount,
      gstPercent,
      gstAmount,
      totalAmount: grandTotal - roundOff,
      roundOff,
      grandTotal,
      paymentMode,
      paymentDetails: {
        cash: paymentMode === 'Cash' ? grandTotal : 0,
        upi: paymentMode === 'UPI' ? grandTotal : 0,
        card: paymentMode === 'Card' ? grandTotal : 0
      }
    };

    try {
      const { data } = await api.post('/bills', billData);
      message.success({
        content: `Bill #${data.bill.billNo} created successfully!`,
        duration: 3,
        icon: <PrinterOutlined style={{ color: '#52c41a' }} />
      });
      setBillPreview(data.bill);
      clearCartAfterBill();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to create bill');
    } finally {
      setLoading(false);
    }
  };

  const clearCartAfterBill = () => {
    setCartItems([]);
    setCustomerName('');
    setCustomerMobile('');
    setDiscount(0);
    setPaymentMode('Cash');
  };

  const { subtotal, discountAmount, gstAmount, gstEnabled, gstPercent, grandTotal } = calculateTotals();

  const cartColumns = [
    {
      title: 'Item',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            <Tag color="purple" size="small">{record.subCode}</Tag>
          </div>
        </div>
      )
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => <span style={{ fontWeight: 600, color: '#667eea' }}>₹{price.toFixed(2)}</span>,
      width: 100
    },
    {
      title: 'Qty',
      key: 'quantity',
      render: (_, record) => (
        <InputNumber
          min={1}
          max={record.currentStock !== undefined && record.currentStock !== null ? record.currentStock : undefined}
          value={record.quantity}
          onChange={(value) => updateQuantity(record._id, value)}
          size="small"
          style={{ width: 60 }}
        />
      ),
      width: 80
    },
    {
      title: 'Total',
      dataIndex: 'itemTotal',
      key: 'itemTotal',
      render: (total) => <strong style={{ color: '#52c41a', fontSize: 15 }}>₹{total.toFixed(2)}</strong>,
      width: 100
    },
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <Tooltip title="Remove">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => removeFromCart(record._id)}
            size="small"
          />
        </Tooltip>
      ),
      width: 50
    }
  ];

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8, fontSize: 28, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShoppingCartOutlined style={{ color: '#667eea' }} />
          Dine-In Order
        </h1>
        <p style={{ marginTop: -5, marginBottom: 16, color: '#666' }}>
          Fast and easy dine-in billing interface with real-time cart
        </p>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <Statistic
                title={<span style={{ color: 'white' }}>Items in Cart</span>}
                value={cartItems.length}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #52c41a 0%, #95de64 100%)' }}>
              <Statistic
                title={<span style={{ color: 'white' }}>Total Amount</span>}
                value={grandTotal}
                prefix="₹"
                precision={2}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #faad14 0%, #ffd666 100%)' }}>
              <Statistic
                title={<span style={{ color: 'white' }}>Total Items</span>}
                value={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <TagsOutlined />
                <span>Select Items</span>
              </Space>
            }
            extra={
              <Badge count={filteredSubCodes.length} showZero color="#667eea" />
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Select
                placeholder="🏷️ Select Category (Main Code)"
                style={{ width: '100%' }}
                size="large"
                onChange={handleMainCodeChange}
                value={selectedMainCode}
                showSearch
                allowClear
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {mainCodes.map((mc) => (
                  <Select.Option key={mc._id} value={mc._id}>
                    <Tag color="blue">{mc.code}</Tag> {mc.name}
                  </Select.Option>
                ))}
              </Select>

              <Input
                placeholder="🔍 Search items by name or code..."
                prefix={<SearchOutlined />}
                size="large"
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
            </Space>

            <Divider style={{ marginTop: 16, marginBottom: 16 }} />

            <div style={{ maxHeight: 450, overflowY: 'auto' }}>
              {filteredSubCodes.length === 0 ? (
                <Empty
                  description={selectedMainCode ? "No items found" : "Select a category to view items"}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Row gutter={[12, 12]}>
                  {filteredSubCodes.map((sc) => (
                    <Col xs={12} sm={8} md={6} key={sc._id}>
                      <Card
                        hoverable
                        size="small"
                        onClick={() => addToCart(sc)}
                        style={{
                          textAlign: 'center',
                          cursor: 'pointer',
                          borderColor: (sc.currentStock !== undefined && sc.currentStock !== null)
                            ? (sc.currentStock <= 0 ? '#ff4d4f' : sc.currentStock <= sc.minStockAlert ? '#faad14' : '#d9d9d9')
                            : '#d9d9d9',
                          borderWidth: 2,
                          position: 'relative',
                          transition: 'all 0.3s ease',
                        }}
                        className="item-card"
                      >
                        {sc.currentStock !== undefined && sc.currentStock !== null && sc.currentStock <= sc.minStockAlert && sc.currentStock > 0 && (
                          <div style={{ position: 'absolute', top: 5, right: 5 }}>
                            <Tooltip title="Low Stock">
                              <FireOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
                            </Tooltip>
                          </div>
                        )}
                        <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
                          {sc.name}
                        </div>
                        <div style={{ color: '#667eea', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                          ₹{sc.price}
                        </div>
                        {sc.currentStock !== undefined && sc.currentStock !== null ? (
                          <Tag color={sc.currentStock <= 0 ? 'red' : sc.currentStock <= sc.minStockAlert ? 'orange' : 'green'} size="small">
                            Stock: {sc.currentStock}
                          </Tag>
                        ) : (
                          <Tag color="blue" size="small">
                            Unlimited Stock
                          </Tag>
                        )}
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          </Card>

          <Card
            title={
              <Space>
                <ShoppingCartOutlined />
                <span>Cart Items</span>
                <Badge count={cartItems.length} showZero />
              </Space>
            }
            style={{ marginTop: 16 }}
            extra={
              cartItems.length > 0 && (
                <Button
                  danger
                  icon={<ClearOutlined />}
                  onClick={clearCart}
                  size="small"
                >
                  Clear All
                </Button>
              )
            }
          >
            <Table
              dataSource={cartItems}
              columns={cartColumns}
              rowKey="_id"
              pagination={false}
              size="small"
              locale={{ emptyText: 'No items in cart. Start adding items!' }}
              scroll={{ y: 300 }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title="Customer & Payment"
            style={{ position: 'sticky', top: 24 }}
            headStyle={{ background: '#f0f2f5' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Customer Name</label>
                <Input
                  placeholder="Enter customer name (Optional)"
                  size="large"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  prefix={<Avatar size="small" style={{ background: '#667eea' }}>C</Avatar>}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Mobile Number</label>
                <Input
                  placeholder="Enter mobile number (Optional)"
                  size="large"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  maxLength={10}
                />
              </div>

              <Divider>Payment Mode</Divider>

              <Radio.Group
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                style={{ width: '100%' }}
                size="large"
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Radio.Button value="Cash" style={{ width: '100%', textAlign: 'left', height: 'auto', padding: 12 }}>
                    <Space>
                      <span style={{ fontSize: 20 }}>💵</span>
                      <span style={{ fontWeight: 500 }}>Cash Payment</span>
                    </Space>
                  </Radio.Button>
                  <Radio.Button value="UPI" style={{ width: '100%', textAlign: 'left', height: 'auto', padding: 12 }}>
                    <Space>
                      <span style={{ fontSize: 20 }}>📱</span>
                      <span style={{ fontWeight: 500 }}>UPI Payment</span>
                    </Space>
                  </Radio.Button>
                  <Radio.Button value="Card" style={{ width: '100%', textAlign: 'left', height: 'auto', padding: 12 }}>
                    <Space>
                      <span style={{ fontSize: 20 }}>💳</span>
                      <span style={{ fontWeight: 500 }}>Card Payment</span>
                    </Space>
                  </Radio.Button>
                </Space>
              </Radio.Group>

              <Divider>Bill Summary</Divider>

              <div style={{ background: '#f5f7fa', padding: 16, borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 15 }}>
                  <span>Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>₹{subtotal.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                  <span>Discount:</span>
                  <InputNumber
                    min={0}
                    max={100}
                    value={discount}
                    onChange={setDiscount}
                    formatter={(value) => `${value}%`}
                    parser={(value) => value.replace('%', '')}
                    style={{ width: 90 }}
                  />
                </div>

                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#ff4d4f', fontWeight: 500 }}>
                    <span>Discount Amount:</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                {gstEnabled && gstAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#52c41a', fontWeight: 500 }}>
                    <span>GST ({gstPercent}%):</span>
                    <span>+₹{gstAmount.toFixed(2)}</span>
                  </div>
                )}

                <Divider style={{ margin: '12px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, fontWeight: 700, color: '#667eea' }}>
                  <span>Grand Total:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <Button
                type="primary"
                size="large"
                block
                icon={<PrinterOutlined />}
                onClick={generateBill}
                loading={loading}
                disabled={cartItems.length === 0}
                style={{
                  height: 56,
                  fontSize: 18,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                }}
              >
                Generate Bill
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }}>✅</div>
            <div>Bill Generated Successfully</div>
          </div>
        }
        open={!!billPreview}
        onCancel={() => setBillPreview(null)}
        footer={[
          <Button key="close" size="large" onClick={() => setBillPreview(null)}>
            Close
          </Button>,
          <Button key="print" type="primary" size="large" icon={<PrinterOutlined />} onClick={() => printThermalBill(billPreview, settings)}>
            Print Bill
          </Button>
        ]}
        width={450}
      >
        {billPreview && (
          <div style={{ padding: '20px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: '2px dashed #d9d9d9' }}>
              <h2 style={{ margin: 0, fontSize: 24 }}>{settings.shopName || 'Juicy'}</h2>
              {settings.shopAddress && <div style={{ color: '#666', fontSize: 12 }}>{settings.shopAddress}</div>}
              {settings.shopMobile && <div style={{ color: '#666', fontSize: 12 }}>Contact: {settings.shopMobile}</div>}
              <div style={{ fontSize: 20, fontWeight: 600, color: '#667eea', marginTop: 8 }}>
                Bill #{billPreview.billNo}
              </div>
              <div style={{ color: '#999', marginTop: 4 }}>
                {moment(billPreview.billDate).format('DD MMM YYYY, hh:mm A')}
              </div>
              {billPreview.customerName && billPreview.customerName !== 'Walk-in Customer' && (
                <div style={{ marginTop: 8, fontWeight: 500 }}>
                  Customer: {billPreview.customerName}
                  {billPreview.customerMobile && ` • ${billPreview.customerMobile}`}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              {billPreview.items.map((item, index) => (
                <div key={index} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.itemName}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                    <span>{item.quantity} × ₹{item.price}</span>
                    <span style={{ fontWeight: 600, color: '#000' }}>₹{item.itemTotal.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <Divider style={{ margin: '20px 0' }} />

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Subtotal:</span>
                <span>₹{billPreview.subtotal.toFixed(2)}</span>
              </div>
              {billPreview.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#ff4d4f' }}>
                  <span>Discount ({billPreview.discountPercent}%):</span>
                  <span>-₹{billPreview.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {billPreview.gstAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#52c41a' }}>
                  <span>GST ({billPreview.gstPercent || settings.defaultGstPercent}%):</span>
                  <span>+₹{billPreview.gstAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '2px solid #000', fontSize: 18, fontWeight: 700 }}>
                <span>Grand Total:</span>
                <span>₹{billPreview.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                {billPreview.paymentMode}
              </Tag>
            </div>

            <div style={{ textAlign: 'center', marginTop: 20, color: '#999', fontSize: 12 }}>
              Thank you for your purchase!
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default TakeOrder;
