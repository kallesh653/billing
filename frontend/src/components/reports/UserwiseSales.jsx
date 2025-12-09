import { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Button, Space, Row, Col, Statistic, message, Tag } from 'antd';
import { UserOutlined, CrownOutlined, CalendarOutlined, TrophyOutlined } from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';
import moment from 'moment';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const { RangePicker } = DatePicker;

const UserwiseSales = () => {
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

      const { data: response } = await api.get('/reports/userwise-sales', { params });
      setData(response.report || []);
    } catch (error) {
      message.error('Failed to load user-wise sales report');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Rank',
      key: 'rank',
      render: (_, __, index) => {
        const medals = ['🥇', '🥈', '🥉'];
        return index < 3 ? <span style={{ fontSize: 20 }}>{medals[index]}</span> : index + 1;
      },
      width: 80,
      align: 'center'
    },
    {
      title: 'User Name',
      dataIndex: 'userName',
      key: 'userName',
      render: (name, __, index) => (
        <Space>
          <UserOutlined style={{ color: index === 0 ? '#FFD700' : '#667eea' }} />
          <strong style={{ fontSize: 16 }}>{name}</strong>
          {index === 0 && <CrownOutlined style={{ color: '#FFD700' }} />}
        </Space>
      )
    },
    {
      title: 'Total Bills',
      dataIndex: 'totalBills',
      key: 'totalBills',
      render: (bills) => <Tag color="blue" style={{ fontSize: 14 }}>{bills}</Tag>,
      sorter: (a, b) => a.totalBills - b.totalBills,
      align: 'center',
      width: 130
    },
    {
      title: 'Total Sales',
      dataIndex: 'totalSales',
      key: 'totalSales',
      render: (sales) => <strong style={{ color: '#52c41a', fontSize: 16 }}>₹{sales?.toFixed(2) || '0.00'}</strong>,
      sorter: (a, b) => a.totalSales - b.totalSales,
      align: 'right',
      width: 180
    },
    {
      title: 'Average per Bill',
      key: 'avgBill',
      render: (_, record) => {
        const avg = record.totalBills > 0 ? record.totalSales / record.totalBills : 0;
        return `₹${avg.toFixed(2)}`;
      },
      align: 'right',
      width: 150
    }
  ];

  const totalBills = data.reduce((sum, user) => sum + user.totalBills, 0);
  const totalSales = data.reduce((sum, user) => sum + user.totalSales, 0);

  // Chart data
  const chartData = data.map(user => ({
    name: user.userName,
    value: user.totalSales
  }));

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0'];

  return (
    <Layout>
      <div>
        <h1 style={{ marginBottom: 24, fontSize: 28, fontWeight: 600 }}>
          <UserOutlined /> User-wise Sales Report
        </h1>
        <p style={{ marginTop: -15, marginBottom: 24, color: '#666' }}>
          Compare performance of all users/cashiers
        </p>

        {/* Summary Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card className="stat-card gradient-primary">
              <Statistic
                title={<span style={{ color: 'white' }}>Total Users</span>}
                value={data.length}
                prefix={<UserOutlined />}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card gradient-success">
              <Statistic
                title={<span style={{ color: 'white' }}>Total Bills</span>}
                value={totalBills}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card gradient-warning">
              <Statistic
                title={<span style={{ color: 'white' }}>Total Sales</span>}
                value={totalSales}
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
              Reset
            </Button>
          </Space>
        </Card>

        {/* Sales Distribution Chart */}
        {chartData.length > 0 && (
          <Card title="Sales Distribution by User" style={{ marginBottom: 16 }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Users Table */}
        <Card title={`Performance Leaderboard (${data.length} users)`}>
          <Table
            dataSource={data}
            columns={columns}
            rowKey="_id"
            loading={loading}
            pagination={false}
          />
        </Card>
      </div>
    </Layout>
  );
};

export default UserwiseSales;
