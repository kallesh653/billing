import { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Button, Space, Row, Col, Statistic, Tag, message } from 'antd';
import { ShoppingOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';
import moment from 'moment';

const { RangePicker } = DatePicker;

const PurchaseSummary = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([moment().subtract(30, 'days'), moment()]);
  const [summary, setSummary] = useState({ count: 0, totalAmount: 0, totalPending: 0 });

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      const { data: response } = await api.get('/reports/purchase-summary', { params });
      setData(response.purchases || []);
      setSummary({
        count: response.count,
        totalAmount: response.totalAmount,
        totalPending: response.totalPending
      });
    } catch (error) {
      message.error('Failed to load purchase summary');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Purchase No',
      dataIndex: 'purchaseNo',
      key: 'purchaseNo',
      render: (no) => <Tag color="purple">{no}</Tag>,
      width: 130
    },
    {
      title: 'Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      render: (date) => moment(date).format('DD MMM YYYY'),
      width: 120
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          {record.supplierMobile && (
            <div style={{ fontSize: 12, color: '#999' }}>{record.supplierMobile}</div>
          )}
        </div>
      )
    },
    {
      title: 'Invoice No',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
      width: 120
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items) => items?.length || 0,
      align: 'center',
      width: 80
    },
    {
      title: 'Invoice Amount',
      dataIndex: 'invoiceAmount',
      key: 'invoiceAmount',
      render: (amount) => `₹${amount?.toFixed(2) || '0.00'}`,
      align: 'right',
      width: 130
    },
    {
      title: 'Paid',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      render: (amount) => <Tag color="green">₹{amount?.toFixed(2) || '0.00'}</Tag>,
      align: 'right',
      width: 120
    },
    {
      title: 'Pending',
      dataIndex: 'pendingAmount',
      key: 'pendingAmount',
      render: (amount) => (
        <Tag color={amount > 0 ? 'red' : 'default'}>₹{amount?.toFixed(2) || '0.00'}</Tag>
      ),
      align: 'right',
      width: 120
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.pendingAmount === 0 ? 'success' : 'warning'}>
          {record.pendingAmount === 0 ? 'Paid' : 'Pending'}
        </Tag>
      ),
      width: 100
    }
  ];

  return (
    <Layout>
      <div>
        <h1 style={{ marginBottom: 24, fontSize: 28, fontWeight: 600 }}>
          <ShoppingOutlined /> Purchase Summary
        </h1>
        <p style={{ marginTop: -15, marginBottom: 24, color: '#666' }}>
          Complete purchase analysis with payment status
        </p>

        {/* Summary Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card className="stat-card gradient-primary">
              <Statistic
                title={<span style={{ color: 'white' }}>Total Purchases</span>}
                value={summary.count}
                prefix={<ShoppingOutlined />}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card gradient-success">
              <Statistic
                title={<span style={{ color: 'white' }}>Total Amount</span>}
                value={summary.totalAmount}
                prefix="₹"
                precision={2}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card gradient-danger">
              <Statistic
                title={<span style={{ color: 'white' }}>Total Pending</span>}
                value={summary.totalPending}
                prefix="₹"
                precision={2}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: 16 }}>
          <Space size="large" wrap>
            <Space direction="vertical" size={0}>
              <span style={{ fontSize: 12, color: '#999' }}>Date Range</span>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                format="DD MMM YYYY"
                size="large"
                style={{ width: 300 }}
              />
            </Space>
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              size="large"
              onClick={fetchReport}
              loading={loading}
            >
              Apply Filter
            </Button>
            <Button
              size="large"
              onClick={() => {
                setDateRange([moment().subtract(30, 'days'), moment()]);
                setTimeout(fetchReport, 100);
              }}
            >
              Last 30 Days
            </Button>
          </Space>
        </Card>

        {/* Purchase Table */}
        <Card title={`Purchase Details (${data.length} purchases)`}>
          <Table
            dataSource={data}
            columns={columns}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 20 }}
            scroll={{ x: 1100 }}
          />
        </Card>
      </div>
    </Layout>
  );
};

export default PurchaseSummary;
