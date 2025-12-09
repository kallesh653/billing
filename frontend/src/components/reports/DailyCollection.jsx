import { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Button, Space, Row, Col, Statistic, Tag, message } from 'antd';
import { WalletOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';
import moment from 'moment';

const { RangePicker } = DatePicker;

const DailyCollection = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([moment().subtract(15, 'days'), moment()]);

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

      const { data: response } = await api.get('/reports/daily-collection', { params });
      setData(response.report || []);
    } catch (error) {
      message.error('Failed to load daily collection report');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{moment(date).format('DD MMM YYYY')}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{moment(date).format('dddd')}</div>
        </div>
      ),
      width: 150
    },
    {
      title: 'Total Bills',
      dataIndex: 'totalBills',
      key: 'totalBills',
      render: (count) => <Tag color="blue" style={{ fontSize: 14 }}>{count}</Tag>,
      align: 'center',
      width: 100
    },
    {
      title: 'Cash',
      dataIndex: 'cash',
      key: 'cash',
      render: (amount) => amount > 0 ? <Tag color="green">₹{amount.toFixed(2)}</Tag> : '-',
      align: 'right',
      width: 130
    },
    {
      title: 'UPI',
      dataIndex: 'upi',
      key: 'upi',
      render: (amount) => amount > 0 ? <Tag color="blue">₹{amount.toFixed(2)}</Tag> : '-',
      align: 'right',
      width: 130
    },
    {
      title: 'Card',
      dataIndex: 'card',
      key: 'card',
      render: (amount) => amount > 0 ? <Tag color="purple">₹{amount.toFixed(2)}</Tag> : '-',
      align: 'right',
      width: 130
    },
    {
      title: 'Mixed',
      dataIndex: 'mixed',
      key: 'mixed',
      render: (amount) => amount > 0 ? <Tag color="orange">₹{amount.toFixed(2)}</Tag> : '-',
      align: 'right',
      width: 130
    },
    {
      title: 'Total Collection',
      dataIndex: 'totalSales',
      key: 'totalSales',
      render: (amount) => <strong style={{ color: '#52c41a', fontSize: 16 }}>₹{amount.toFixed(2)}</strong>,
      align: 'right',
      width: 160,
      fixed: 'right'
    }
  ];

  const totalBills = data.reduce((sum, day) => sum + day.totalBills, 0);
  const totalCollection = data.reduce((sum, day) => sum + day.totalSales, 0);
  const totalCash = data.reduce((sum, day) => sum + day.cash, 0);
  const totalUPI = data.reduce((sum, day) => sum + day.upi, 0);
  const totalCard = data.reduce((sum, day) => sum + day.card, 0);
  const totalMixed = data.reduce((sum, day) => sum + day.mixed, 0);

  return (
    <Layout>
      <div>
        <h1 style={{ marginBottom: 24, fontSize: 28, fontWeight: 600 }}>
          <WalletOutlined /> Daily Collection Report
        </h1>
        <p style={{ marginTop: -15, marginBottom: 24, color: '#666' }}>
          Day-wise sales collection with payment mode breakdown
        </p>

        {/* Summary Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <Statistic
                title={<span style={{ color: 'white' }}>Total Collection</span>}
                value={totalCollection}
                prefix="₹"
                precision={2}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #52c41a 0%, #95de64 100%)' }}>
              <Statistic
                title={<span style={{ color: 'white' }}>Cash</span>}
                value={totalCash}
                prefix="₹"
                precision={2}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #1890ff 0%, #69c0ff 100%)' }}>
              <Statistic
                title={<span style={{ color: 'white' }}>UPI</span>}
                value={totalUPI}
                prefix="₹"
                precision={2}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #722ed1 0%, #b37feb 100%)' }}>
              <Statistic
                title={<span style={{ color: 'white' }}>Card</span>}
                value={totalCard}
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
                setDateRange([moment().subtract(15, 'days'), moment()]);
                setTimeout(fetchReport, 100);
              }}
            >
              Last 15 Days
            </Button>
            <Button
              size="large"
              onClick={() => {
                setDateRange([moment().startOf('month'), moment()]);
                setTimeout(fetchReport, 100);
              }}
            >
              This Month
            </Button>
          </Space>
        </Card>

        {/* Daily Collection Table */}
        <Card
          title={`Daily Collection (${data.length} days)`}
          extra={
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#999' }}>Total Bills</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#1890ff' }}>{totalBills}</div>
            </div>
          }
        >
          <Table
            dataSource={data}
            columns={columns}
            rowKey="date"
            loading={loading}
            pagination={{ pageSize: 20 }}
            scroll={{ x: 900 }}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 600 }}>
                  <Table.Summary.Cell index={0}>
                    <strong>Total</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="center">
                    <Tag color="blue" style={{ fontSize: 14 }}>{totalBills}</Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <Tag color="green">₹{totalCash.toFixed(2)}</Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <Tag color="blue">₹{totalUPI.toFixed(2)}</Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <Tag color="purple">₹{totalCard.toFixed(2)}</Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <Tag color="orange">₹{totalMixed.toFixed(2)}</Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="right">
                    <strong style={{ color: '#52c41a', fontSize: 16 }}>₹{totalCollection.toFixed(2)}</strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Card>
      </div>
    </Layout>
  );
};

export default DailyCollection;
