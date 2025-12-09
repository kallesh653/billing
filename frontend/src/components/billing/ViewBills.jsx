import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, DatePicker, Space, Input, Modal, Descriptions, Divider, Row, Col, Statistic, Badge, Avatar, message } from 'antd';
import { SearchOutlined, EyeOutlined, FileTextOutlined, CalendarOutlined, UserOutlined, DollarOutlined, PrinterOutlined } from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';
import moment from 'moment';
import { printThermalBill } from '../../utils/exportUtils';

const { RangePicker } = DatePicker;

const ViewBills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [selectedBill, setSelectedBill] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    fetchBills();
    fetchSettings();
  }, [pagination.current]);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings(data.settings || {});
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const fetchBills = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize
      };

      if (searchText) params.search = searchText;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      const { data } = await api.get('/bills', { params });
      setBills(data.bills);
      setPagination({ ...pagination, total: data.count });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewBillDetails = async (billId) => {
    try {
      console.log('Fetching bill details for ID:', billId);
      const { data } = await api.get(`/bills/${billId}`);
      console.log('Bill data received:', data);
      setSelectedBill(data.bill);
      setModalVisible(true);
    } catch (error) {
      console.error('Error fetching bill details:', error);
      message.error('Failed to load bill details. Please try again.');
    }
  };

  const handlePrintBill = () => {
    if (selectedBill) {
      try {
        printThermalBill(selectedBill, settings);
        message.success('Print window opened successfully');
      } catch (error) {
        console.error('Print error:', error);
        message.error('Failed to open print window');
      }
    }
  };

  const columns = [
    {
      title: 'Bill No',
      dataIndex: 'billNo',
      key: 'billNo',
      width: 120,
      render: (no) => (
        <Tag color="blue" style={{ fontSize: 14, fontWeight: 600, padding: '4px 12px' }}>
          #{no}
        </Tag>
      ),
      fixed: 'left'
    },
    {
      title: 'Date & Time',
      dataIndex: 'billDate',
      key: 'billDate',
      width: 180,
      render: (date) => (
        <div>
          <div style={{ fontWeight: 600, color: '#262626' }}>
            {moment(date).format('DD MMM YYYY')}
          </div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            {moment(date).format('hh:mm A')}
          </div>
        </div>
      )
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 200,
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            <Avatar size="small" style={{ background: '#667eea', marginRight: 8 }}>
              {name ? name[0].toUpperCase() : 'W'}
            </Avatar>
            {name || 'Walk-in Customer'}
          </div>
          {record.customerMobile && (
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
              📱 {record.customerMobile}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'User',
      dataIndex: 'userName',
      key: 'userName',
      width: 130,
      render: (name) => (
        <Tag color="purple" icon={<UserOutlined />} style={{ fontSize: 13 }}>
          {name}
        </Tag>
      )
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      width: 80,
      align: 'center',
      render: (items) => (
        <Badge
          count={items?.length || 0}
          style={{ backgroundColor: '#667eea' }}
          showZero
        />
      )
    },
    {
      title: 'Amount',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      width: 130,
      render: (amount) => (
        <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 16, color: '#52c41a' }}>
          ₹{amount.toFixed(2)}
        </div>
      ),
      sorter: (a, b) => a.grandTotal - b.grandTotal
    },
    {
      title: 'Payment',
      dataIndex: 'paymentMode',
      key: 'paymentMode',
      width: 110,
      render: (mode) => {
        const colors = { Cash: 'green', UPI: 'blue', Card: 'purple', Mixed: 'orange' };
        const icons = { Cash: '💵', UPI: '📱', Card: '💳', Mixed: '💰' };
        return (
          <Tag color={colors[mode] || 'default'} style={{ fontSize: 13 }}>
            {icons[mode]} {mode}
          </Tag>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => (
        <Tag
          color={status === 'Completed' ? 'success' : status === 'Cancelled' ? 'error' : 'warning'}
          style={{ fontSize: 13, fontWeight: 500 }}
        >
          {status === 'Completed' ? '✓ ' : status === 'Cancelled' ? '✗ ' : '⏳ '}
          {status}
        </Tag>
      ),
      filters: [
        { text: 'Completed', value: 'Completed' },
        { text: 'Cancelled', value: 'Cancelled' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="middle"
          onClick={() => viewBillDetails(record._id)}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none'
          }}
        >
          View
        </Button>
      )
    }
  ];

  const totalAmount = bills.reduce((sum, bill) => sum + (bill.status === 'Completed' ? bill.grandTotal : 0), 0);
  const completedBills = bills.filter(bill => bill.status === 'Completed').length;

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8, fontSize: 28, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12 }}>
          <FileTextOutlined style={{ color: '#667eea' }} />
          View Bills
        </h1>
        <p style={{ marginTop: -5, color: '#666' }}>
          Complete bill history with advanced search and filters
        </p>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Statistic
              title={<span style={{ color: 'white' }}>Total Bills</span>}
              value={pagination.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #52c41a 0%, #95de64 100%)' }}>
            <Statistic
              title={<span style={{ color: 'white' }}>Completed</span>}
              value={completedBills}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #faad14 0%, #ffd666 100%)' }}>
            <Statistic
              title={<span style={{ color: 'white' }}>Total Amount</span>}
              value={totalAmount}
              prefix="₹"
              precision={2}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 20, flexWrap: 'wrap' }} size="middle">
          <RangePicker
            size="large"
            value={dateRange}
            onChange={setDateRange}
            format="DD MMM YYYY"
            style={{ width: 280 }}
            placeholder={['Start Date', 'End Date']}
          />
          <Input
            placeholder="Search by Bill No or Customer..."
            prefix={<SearchOutlined />}
            size="large"
            style={{ width: 280 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={fetchBills}
            allowClear
          />
          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            onClick={fetchBills}
            style={{ fontWeight: 600 }}
          >
            Search
          </Button>
          <Button
            size="large"
            onClick={() => {
              setSearchText('');
              setDateRange(null);
              setTimeout(fetchBills, 100);
            }}
          >
            Reset
          </Button>
        </Space>

        <Table
          dataSource={bills}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} bills`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
            }
          }}
          scroll={{ x: 1200 }}
          size="middle"
          bordered
        />
      </Card>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FileTextOutlined style={{ fontSize: 24, color: '#667eea' }} />
            <span>Bill Details</span>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" size="large" onClick={() => setModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="print"
            type="primary"
            size="large"
            icon={<PrinterOutlined />}
            onClick={handlePrintBill}
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
          >
            Print Bill
          </Button>
        ]}
        width={700}
      >
        {selectedBill && (
          <div>
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="Bill Number" span={1}>
                <Tag color="blue" style={{ fontSize: 16, padding: '4px 12px' }}>#{selectedBill.billNo}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Date & Time" span={1}>
                {moment(selectedBill.billDate).format('DD MMM YYYY, hh:mm A')}
              </Descriptions.Item>
              <Descriptions.Item label="Customer Name" span={1}>
                {selectedBill.customerName || 'Walk-in Customer'}
              </Descriptions.Item>
              <Descriptions.Item label="Mobile" span={1}>
                {selectedBill.customerMobile || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Billed By" span={1}>
                <Tag color="purple">{selectedBill.userName}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Payment Mode" span={1}>
                <Tag color="green">{selectedBill.paymentMode}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <Tag color={selectedBill.status === 'Completed' ? 'success' : 'error'}>
                  {selectedBill.status}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Items</Divider>

            <Table
              dataSource={selectedBill.items}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Item Name',
                  dataIndex: 'itemName',
                  key: 'itemName',
                  render: (name, record) => (
                    <div>
                      <div style={{ fontWeight: 600 }}>{name}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>{record.subCodeName}</div>
                    </div>
                  )
                },
                {
                  title: 'Qty',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  align: 'center',
                  width: 80
                },
                {
                  title: 'Price',
                  dataIndex: 'price',
                  key: 'price',
                  width: 100,
                  render: (price) => `₹${price.toFixed(2)}`
                },
                {
                  title: 'Total',
                  dataIndex: 'itemTotal',
                  key: 'itemTotal',
                  width: 120,
                  render: (total) => <strong style={{ color: '#52c41a' }}>₹{total.toFixed(2)}</strong>,
                  align: 'right'
                }
              ]}
            />

            <Divider />

            <div style={{ background: '#f5f7fa', padding: 20, borderRadius: 8 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ color: '#8c8c8c' }}>Subtotal:</span>
                    <span style={{ float: 'right', fontWeight: 600 }}>₹{selectedBill.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedBill.discountAmount > 0 && (
                    <div style={{ marginBottom: 12, color: '#ff4d4f' }}>
                      <span>Discount ({selectedBill.discountPercent}%):</span>
                      <span style={{ float: 'right', fontWeight: 600 }}>-₹{selectedBill.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                </Col>
                <Col span={12}>
                  <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 14, marginBottom: 4 }}>Grand Total</div>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>₹{selectedBill.grandTotal.toFixed(2)}</div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default ViewBills;
