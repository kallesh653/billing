import { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Button, Space, Row, Col, Statistic, message, Divider } from 'antd';
import { DollarCircleOutlined, CalendarOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';
import moment from 'moment';

const { RangePicker } = DatePicker;

const ProfitReport = () => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({});
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

      const { data: response } = await api.get('/reports/profit', { params });
      setData(response.report || []);
      setSummary(response.summary || {});
    } catch (error) {
      message.error('Failed to load profit report');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (name) => <div style={{ fontWeight: 600, fontSize: 15 }}>{name}</div>
    },
    {
      title: 'Qty Sold',
      dataIndex: 'quantitySold',
      key: 'quantitySold',
      align: 'center',
      width: 100
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue) => `₹${revenue.toFixed(2)}`,
      sorter: (a, b) => a.revenue - b.revenue,
      align: 'right',
      width: 130
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost) => `₹${cost.toFixed(2)}`,
      align: 'right',
      width: 130
    },
    {
      title: 'Profit',
      dataIndex: 'profit',
      key: 'profit',
      render: (profit) => (
        <strong style={{ color: profit > 0 ? '#52c41a' : '#ff4d4f', fontSize: 15 }}>
          ₹{profit.toFixed(2)}
        </strong>
      ),
      sorter: (a, b) => a.profit - b.profit,
      align: 'right',
      width: 130
    },
    {
      title: 'Margin %',
      dataIndex: 'profitPercent',
      key: 'profitPercent',
      render: (percent) => (
        <span style={{ fontWeight: 600, color: parseFloat(percent) > 20 ? '#52c41a' : '#fa8c16' }}>
          {percent}%
        </span>
      ),
      sorter: (a, b) => parseFloat(a.profitPercent) - parseFloat(b.profitPercent),
      align: 'center',
      width: 100
    }
  ];

  return (
    <Layout>
      <div>
        <h1 style={{ marginBottom: 24, fontSize: 28, fontWeight: 600 }}>
          <DollarCircleOutlined /> Profit Report
        </h1>
        <p style={{ marginTop: -15, marginBottom: 24, color: '#666' }}>
          Profitability analysis with margin breakdown
        </p>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card gradient-success">
              <Statistic
                title={<span style={{ color: 'white' }}>Total Revenue</span>}
                value={summary.totalRevenue}
                prefix="₹"
                precision={2}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card gradient-danger">
              <Statistic
                title={<span style={{ color: 'white' }}>Total Cost</span>}
                value={summary.totalCost}
                prefix="₹"
                precision={2}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card gradient-primary">
              <Statistic
                title={<span style={{ color: 'white' }}>Total Profit</span>}
                value={summary.totalProfit}
                prefix="₹"
                precision={2}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card gradient-warning">
              <Statistic
                title={<span style={{ color: 'white' }}>Profit Margin</span>}
                value={summary.profitPercent}
                suffix="%"
                precision={2}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
        </Row>

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

        <Card title={`Item-wise Profit Analysis (${data.length} items)`}>
          <Table
            dataSource={data}
            columns={columns}
            rowKey="itemName"
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        </Card>
      </div>
    </Layout>
  );
};

export default ProfitReport;
