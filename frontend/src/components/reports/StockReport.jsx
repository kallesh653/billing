import { useState, useEffect } from 'react';
import { Card, Table, Input, Tag, message, Statistic, Row, Col } from 'antd';
import { InboxOutlined, SearchOutlined, WarningOutlined } from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';

const StockReport = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data: response } = await api.get('/reports/stock');
      setData(response.report || []);
      setFilteredData(response.report || []);
    } catch (error) {
      message.error('Failed to load stock report');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    const filtered = data.filter(item =>
      item.itemName.toLowerCase().includes(value.toLowerCase()) ||
      item.subCode.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const columns = [
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.subCode} • {record.mainCode}
          </div>
        </div>
      )
    },
    {
      title: 'Current Stock',
      dataIndex: 'currentStock',
      key: 'currentStock',
      render: (stock, record) => (
        <span style={{
          fontWeight: 600,
          fontSize: 18,
          color: stock <= record.minStockAlert ? '#ff4d4f' : '#52c41a'
        }}>
          {stock} {record.unit}
        </span>
      ),
      sorter: (a, b) => a.currentStock - b.currentStock,
      align: 'center',
      width: 150
    },
    {
      title: 'Min Alert',
      dataIndex: 'minStockAlert',
      key: 'minStockAlert',
      render: (min, record) => `${min} ${record.unit}`,
      align: 'center',
      width: 100
    },
    {
      title: 'Status',
      dataIndex: 'isLowStock',
      key: 'isLowStock',
      render: (isLow) => (
        <Tag color={isLow ? 'error' : 'success'} icon={isLow ? <WarningOutlined /> : null}>
          {isLow ? 'Low Stock' : 'In Stock'}
        </Tag>
      ),
      filters: [
        { text: 'Low Stock', value: true },
        { text: 'In Stock', value: false }
      ],
      onFilter: (value, record) => record.isLowStock === value,
      width: 120
    },
    {
      title: 'Stock Value',
      dataIndex: 'value',
      key: 'value',
      render: (value) => `₹${value.toFixed(2)}`,
      sorter: (a, b) => a.value - b.value,
      align: 'right',
      width: 130
    }
  ];

  const totalItems = filteredData.length;
  const lowStockItems = filteredData.filter(item => item.isLowStock).length;
  const totalValue = filteredData.reduce((sum, item) => sum + item.value, 0);
  const outOfStock = filteredData.filter(item => item.currentStock === 0).length;

  return (
    <Layout>
      <div>
        <h1 style={{ marginBottom: 24, fontSize: 28, fontWeight: 600 }}>
          <InboxOutlined /> Stock Report
        </h1>
        <p style={{ marginTop: -15, marginBottom: 24, color: '#666' }}>
          Real-time inventory status with low stock alerts
        </p>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card gradient-primary">
              <Statistic
                title={<span style={{ color: 'white' }}>Total Items</span>}
                value={totalItems}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card gradient-danger">
              <Statistic
                title={<span style={{ color: 'white' }}>Low Stock</span>}
                value={lowStockItems}
                prefix={<WarningOutlined />}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card gradient-warning">
              <Statistic
                title={<span style={{ color: 'white' }}>Out of Stock</span>}
                value={outOfStock}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card gradient-success">
              <Statistic
                title={<span style={{ color: 'white' }}>Total Value</span>}
                value={totalValue}
                prefix="₹"
                precision={2}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
        </Row>

        <Card
          title={`Stock Details (${filteredData.length} items)`}
          extra={
            <Input
              placeholder="Search items..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
          }
        >
          <Table
            dataSource={filteredData}
            columns={columns}
            rowKey="subCode"
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        </Card>
      </div>
    </Layout>
  );
};

export default StockReport;
