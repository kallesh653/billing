import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Badge,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  InputNumber,
  Input,
  Select,
  message,
  Tabs,
  Alert
} from 'antd';
import {
  StockOutlined,
  WarningOutlined,
  PlusOutlined,
  MinusOutlined,
  HistoryOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  InboxOutlined
} from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';
import moment from 'moment';

const { TextArea } = Input;
const { TabPane } = Tabs;

const StockView = () => {
  const [items, setItems] = useState([]);
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [adjustModal, setAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    totalStockValue: 0,
    outOfStock: 0
  });

  useEffect(() => {
    fetchStockData();
    fetchStockLedger();
  }, []);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/subcodes');
      const rawItems = data.subCodes || data.data || [];
      const stockItems = rawItems.map(item => ({
        ...item,
        subName: item.name,
        mainCodeName: item.mainCode?.name || '',
        minStockLevel: item.minStockAlert ?? 0,
        purchasePrice: item.costPrice ?? 0,
        salePrice: item.price ?? 0
      }));

      // Calculate statistics
      const totalItems = stockItems.length;
      const lowStockItems = stockItems.filter(item =>
        item.currentStock !== undefined && item.currentStock !== null && item.currentStock <= item.minStockLevel
      ).length;
      const outOfStock = stockItems.filter(item => item.currentStock === 0).length;
      const totalStockValue = stockItems.reduce((sum, item) =>
        sum + ((item.currentStock || 0) * (item.purchasePrice || 0)), 0
      );

      setStats({
        totalItems,
        lowStockItems,
        totalStockValue,
        outOfStock
      });

      setItems(stockItems);
    } catch (error) {
      message.error('Failed to load stock data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockLedger = async () => {
    setLedgerLoading(true);
    try {
      const { data } = await api.get('/reports/stock-ledger');
      setLedgerData(data.ledger || []);
    } catch (error) {
      console.error('Failed to load stock ledger:', error);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleAdjustStock = (item) => {
    setSelectedItem(item);
    form.setFieldsValue({
      adjustmentType: 'add',
      quantity: 0,
      remarks: ''
    });
    setAdjustModal(true);
  };

  const handleSubmitAdjustment = async (values) => {
    try {
      const operation = values.adjustmentType === 'add' ? 'add'
        : values.adjustmentType === 'remove' ? 'subtract'
        : values.adjustmentType;

      await api.put(`/subcodes/${selectedItem._id}/stock`, {
        quantity: values.quantity,
        operation,
        remarks: values.remarks || 'Stock adjustment'
      });

      message.success('Stock adjusted successfully');
      setAdjustModal(false);
      form.resetFields();
      fetchStockData();
      fetchStockLedger();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to adjust stock');
    }
  };

  const getStockStatus = (item) => {
    if (item.currentStock === 0) {
      return { color: 'red', text: 'Out of Stock', icon: '🚫' };
    }
    if (item.minStockLevel !== undefined && item.minStockLevel !== null && item.currentStock <= item.minStockLevel) {
      return { color: 'orange', text: 'Low Stock', icon: '⚠️' };
    }
    // Optional maxStockLevel support
    if (item.maxStockLevel !== undefined && item.maxStockLevel !== null && item.currentStock > item.maxStockLevel) {
      return { color: 'blue', text: 'Overstock', icon: '📦' };
    }
    return { color: 'green', text: 'In Stock', icon: '✓' };
  };

  const stockColumns = [
    {
      title: 'Item Code',
      dataIndex: 'subCode',
      key: 'subCode',
      width: 120,
      render: (code) => (
        <Tag color="purple" style={{ fontSize: 13, fontWeight: 600 }}>
          {code}
        </Tag>
      )
    },
    {
      title: 'Item Name',
      dataIndex: 'subName',
      key: 'subName',
      width: 250,
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            {record.mainCodeName}
          </div>
        </div>
      )
    },
    {
      title: 'Current Stock',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 130,
      align: 'center',
      sorter: (a, b) => a.currentStock - b.currentStock,
      render: (stock, record) => {
        const status = getStockStatus(record);
        return (
          <div>
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              color: status.color === 'red' ? '#ff4d4f' :
                     status.color === 'orange' ? '#fa8c16' :
                     status.color === 'blue' ? '#1890ff' : '#52c41a'
            }}>
              {stock} {record.unit}
            </div>
          </div>
        );
      }
    },
    {
      title: 'Min / Max',
      key: 'stockLevels',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <div>
          <div style={{ fontSize: 12 }}>
            <span style={{ color: '#ff4d4f' }}>Min: {record.minStockLevel}</span>
          </div>
          <div style={{ fontSize: 12 }}>
            <span style={{ color: '#52c41a' }}>Max: {record.maxStockLevel}</span>
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      width: 130,
      align: 'center',
      filters: [
        { text: 'Out of Stock', value: 'out' },
        { text: 'Low Stock', value: 'low' },
        { text: 'In Stock', value: 'normal' },
        { text: 'Overstock', value: 'over' }
      ],
      onFilter: (value, record) => {
        if (value === 'out') return record.currentStock === 0;
        if (value === 'low') return record.currentStock > 0 && record.currentStock <= record.minStockLevel;
        if (value === 'over') return record.currentStock > record.maxStockLevel;
        return record.currentStock > record.minStockLevel && record.currentStock <= record.maxStockLevel;
      },
      render: (_, record) => {
        const status = getStockStatus(record);
        return (
          <Tag color={status.color} style={{ fontSize: 13 }}>
            {status.icon} {status.text}
          </Tag>
        );
      }
    },
    {
      title: 'Purchase Price',
      dataIndex: 'purchasePrice',
      key: 'purchasePrice',
      width: 120,
      align: 'right',
      render: (price) => (
        <span style={{ fontWeight: 600 }}>₹{price?.toFixed(2) || '0.00'}</span>
      )
    },
    {
      title: 'Sale Price',
      dataIndex: 'salePrice',
      key: 'salePrice',
      width: 120,
      align: 'right',
      render: (price) => (
        <span style={{ fontWeight: 600, color: '#52c41a' }}>
          ₹{price?.toFixed(2) || '0.00'}
        </span>
      )
    },
    {
      title: 'Stock Value',
      key: 'stockValue',
      width: 130,
      align: 'right',
      sorter: (a, b) => (a.currentStock * a.purchasePrice) - (b.currentStock * b.purchasePrice),
      render: (_, record) => {
        const value = record.currentStock * (record.purchasePrice || 0);
        return (
          <span style={{ fontWeight: 700, fontSize: 14, color: '#1890ff' }}>
            ₹{value.toFixed(2)}
          </span>
        );
      }
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => handleAdjustStock(record)}
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
        >
          Adjust
        </Button>
      )
    }
  ];

  const ledgerColumns = [
    {
      title: 'Date',
      dataIndex: 'transactionDate',
      key: 'transactionDate',
      width: 150,
      render: (date) => moment(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Item',
      dataIndex: 'itemName',
      key: 'itemName',
      width: 200
    },
    {
      title: 'Type',
      dataIndex: 'transactionType',
      key: 'transactionType',
      width: 120,
      render: (type) => {
        const colors = {
          Purchase: 'green',
          Sale: 'blue',
          Adjustment: 'orange',
          Return: 'red'
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      }
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
      render: (qty, record) => (
        <span style={{
          color: record.transactionType === 'Sale' ? '#ff4d4f' : '#52c41a',
          fontWeight: 600
        }}>
          {record.transactionType === 'Sale' ? '-' : '+'}{Math.abs(qty)}
        </span>
      )
    },
    {
      title: 'Balance',
      dataIndex: 'balanceQty',
      key: 'balanceQty',
      width: 100,
      align: 'center',
      render: (qty) => <strong>{qty}</strong>
    },
    {
      title: 'Reference',
      dataIndex: 'referenceNo',
      key: 'referenceNo',
      width: 150
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 200
    }
  ];

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 8
        }}>
          <StockOutlined /> Stock Management
        </h1>
        <p style={{ color: '#8c8c8c', fontSize: 14 }}>
          Monitor and manage inventory levels, stock adjustments, and stock ledger
        </p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
          }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Total Items</span>}
              value={stats.totalItems}
              prefix={<InboxOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{
            background: 'linear-gradient(135deg, #fa8c16 0%, #fa541c 100%)',
            boxShadow: '0 4px 12px rgba(250, 140, 22, 0.3)'
          }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Low Stock Alerts</span>}
              value={stats.lowStockItems}
              prefix={<WarningOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{
            background: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
            boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)'
          }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Out of Stock</span>}
              value={stats.outOfStock}
              prefix={<ShoppingCartOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{
            background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
            boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)'
          }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Total Stock Value</span>}
              value={stats.totalStockValue}
              precision={2}
              valueStyle={{ color: 'white', fontWeight: 700 }}
              prefix="₹"
            />
          </Card>
        </Col>
      </Row>

      {stats.lowStockItems > 0 && (
        <Alert
          message="Low Stock Alert"
          description={`${stats.lowStockItems} items are running low on stock. Please reorder soon!`}
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
          closable
        />
      )}

      <Tabs defaultActiveKey="1" size="large">
        <TabPane
          tab={
            <span>
              <StockOutlined /> Current Stock
            </span>
          }
          key="1"
        >
          <Card
            title={
              <Space>
                <InboxOutlined style={{ fontSize: 20, color: '#667eea' }} />
                <span>Stock Levels</span>
              </Space>
            }
            extra={
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchStockData}
                loading={loading}
              >
                Refresh
              </Button>
            }
          >
            <Table
              dataSource={items}
              columns={stockColumns}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} items`,
                pageSizeOptions: ['10', '20', '50', '100']
              }}
              scroll={{ x: 1400 }}
              size="middle"
              bordered
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <HistoryOutlined /> Stock Ledger
            </span>
          }
          key="2"
        >
          <Card
            title={
              <Space>
                <HistoryOutlined style={{ fontSize: 20, color: '#667eea' }} />
                <span>Stock Movement History</span>
              </Space>
            }
            extra={
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchStockLedger}
                loading={ledgerLoading}
              >
                Refresh
              </Button>
            }
          >
            <Table
              dataSource={ledgerData}
              columns={ledgerColumns}
              rowKey="_id"
              loading={ledgerLoading}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} transactions`,
                pageSizeOptions: ['10', '20', '50', '100']
              }}
              scroll={{ x: 1200 }}
              size="middle"
              bordered
            />
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <StockOutlined style={{ fontSize: 24, color: '#667eea' }} />
            <span>Adjust Stock - {selectedItem?.subName}</span>
          </div>
        }
        open={adjustModal}
        onCancel={() => {
          setAdjustModal(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <div style={{
          padding: '16px',
          background: '#f5f5f5',
          borderRadius: 8,
          marginBottom: 16
        }}>
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>Current Stock</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1890ff' }}>
                {selectedItem?.currentStock} {selectedItem?.unit}
              </div>
            </Col>
            <Col span={12}>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>Min Level</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#ff4d4f' }}>
                {selectedItem?.minStockLevel} {selectedItem?.unit}
              </div>
            </Col>
          </Row>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitAdjustment}
        >
          <Form.Item
            name="adjustmentType"
            label="Adjustment Type"
            rules={[{ required: true, message: 'Please select adjustment type' }]}
          >
            <Select size="large">
              <Select.Option value="add">
                <PlusOutlined /> Add Stock
              </Select.Option>
              <Select.Option value="remove">
                <MinusOutlined /> Remove Stock
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[
              { required: true, message: 'Please enter quantity' },
              { type: 'number', min: 1, message: 'Quantity must be greater than 0' }
            ]}
          >
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              min={1}
              placeholder="Enter quantity"
              addonAfter={selectedItem?.unit}
            />
          </Form.Item>

          <Form.Item
            name="remarks"
            label="Remarks"
          >
            <TextArea
              rows={3}
              placeholder="Enter reason for adjustment (optional)"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setAdjustModal(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                Adjust Stock
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default StockView;
