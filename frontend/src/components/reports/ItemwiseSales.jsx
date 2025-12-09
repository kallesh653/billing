import { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Button, Space, Row, Col, Statistic, message } from 'antd';
import { ShoppingOutlined, TrophyOutlined, CalendarOutlined, RiseOutlined } from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';
import moment from 'moment';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const { RangePicker } = DatePicker;

const ItemwiseSales = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([moment().subtract(30, 'days'), moment()]);

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

      const { data: response } = await api.get('/reports/itemwise-sales', { params });
      setData(response.report || []);
    } catch (error) {
      message.error('Failed to load item-wise sales report');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '#',
      key: 'index',
      render: (_, __, index) => index + 1,
      width: 60
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.subCodeName}</div>
        </div>
      )
    },
    {
      title: 'Quantity Sold',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty) => <span style={{ fontWeight: 600, fontSize: 16, color: '#1890ff' }}>{qty}</span>,
      sorter: (a, b) => a.quantity - b.quantity,
      align: 'center',
      width: 150
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => <strong style={{ color: '#52c41a' }}>₹{amount?.toFixed(2) || '0.00'}</strong>,
      sorter: (a, b) => a.totalAmount - b.totalAmount,
      align: 'right',
      width: 150
    },
    {
      title: 'Profit',
      dataIndex: 'profit',
      key: 'profit',
      render: (profit) => (
        <strong style={{ color: profit > 0 ? '#52c41a' : '#ff4d4f' }}>
          ₹{profit?.toFixed(2) || '0.00'}
        </strong>
      ),
      sorter: (a, b) => a.profit - b.profit,
      align: 'right',
      width: 130
    }
  ];

  const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = data.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalProfit = data.reduce((sum, item) => sum + item.profit, 0);

  // Top 10 items for chart
  const chartData = [...data]
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10)
    .map(item => ({
      name: item.subCodeName,
      amount: item.totalAmount
    }));

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#a8edea', '#fed6e3'];

  return (
    <Layout>
      <div>
        <h1 style={{ marginBottom: 24, fontSize: 28, fontWeight: 600 }}>
          <ShoppingOutlined /> Item-wise Sales Report
        </h1>
        <p style={{ marginTop: -15, marginBottom: 24, color: '#666' }}>
          Analyze sales performance of individual items
        </p>

        {/* Summary Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card className="stat-card gradient-primary">
              <Statistic
                title={<span style={{ color: 'white' }}>Total Items</span>}
                value={data.length}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card gradient-success">
              <Statistic
                title={<span style={{ color: 'white' }}>Total Quantity Sold</span>}
                value={totalQuantity}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card gradient-warning">
              <Statistic
                title={<span style={{ color: 'white' }}>Total Revenue</span>}
                value={totalAmount}
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
              Reset to Last 30 Days
            </Button>
          </Space>
        </Card>

        {/* Top Items Chart */}
        {chartData.length > 0 && (
          <Card title="Top 10 Best Selling Items" style={{ marginBottom: 16 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Items Table */}
        <Card
          title={`Item Sales Details (${data.length} items)`}
          extra={
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#999' }}>Total Profit</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }}>₹{totalProfit.toFixed(2)}</div>
            </div>
          }
        >
          <Table
            dataSource={data}
            columns={columns}
            rowKey="subCodeName"
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        </Card>
      </div>
    </Layout>
  );
};

export default ItemwiseSales;
