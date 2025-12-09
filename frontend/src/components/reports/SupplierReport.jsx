import { useState, useEffect } from 'react';
import { Card, Table, Tag, message, Statistic, Row, Col } from 'antd';
import { UserOutlined, DollarOutlined, WarningOutlined } from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';

const SupplierReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data: response } = await api.get('/reports/supplier');
      setData(response.report || []);
    } catch (error) {
      message.error('Failed to load supplier report');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Supplier Name',
      dataIndex: 'supplierName',
      key: 'supplierName',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{name}</div>
          {record.mobile && (
            <div style={{ fontSize: 12, color: '#999' }}>{record.mobile}</div>
          )}
        </div>
      )
    },
    {
      title: 'Total Purchased',
      dataIndex: 'totalPurchased',
      key: 'totalPurchased',
      render: (amount) => <strong style={{ color: '#1890ff' }}>₹{amount.toFixed(2)}</strong>,
      sorter: (a, b) => a.totalPurchased - b.totalPurchased,
      align: 'right',
      width: 160
    },
    {
      title: 'Pending Amount',
      dataIndex: 'totalPending',
      key: 'totalPending',
      render: (amount) => (
        <Tag color={amount > 0 ? 'red' : 'green'} style={{ fontSize: 14 }}>
          ₹{amount.toFixed(2)}
        </Tag>
      ),
      sorter: (a, b) => a.totalPending - b.totalPending,
      align: 'right',
      width: 150
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.totalPending === 0 ? 'success' : 'warning'}>
          {record.totalPending === 0 ? 'Clear' : 'Pending'}
        </Tag>
      ),
      filters: [
        { text: 'Clear', value: false },
        { text: 'Pending', value: true }
      ],
      onFilter: (value, record) => value ? record.totalPending > 0 : record.totalPending === 0,
      width: 100
    }
  ];

  const totalPurchased = data.reduce((sum, supplier) => sum + supplier.totalPurchased, 0);
  const totalPending = data.reduce((sum, supplier) => sum + supplier.totalPending, 0);
  const suppliersWithPending = data.filter(s => s.totalPending > 0).length;

  return (
    <Layout>
      <div>
        <h1 style={{ marginBottom: 24, fontSize: 28, fontWeight: 600 }}>
          <UserOutlined /> Supplier Report
        </h1>
        <p style={{ marginTop: -15, marginBottom: 24, color: '#666' }}>
          Supplier-wise purchase and payment analysis
        </p>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card gradient-primary">
              <Statistic
                title={<span style={{ color: 'white' }}>Total Suppliers</span>}
                value={data.length}
                prefix={<UserOutlined />}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card gradient-success">
              <Statistic
                title={<span style={{ color: 'white' }}>Total Purchased</span>}
                value={totalPurchased}
                prefix="₹"
                precision={2}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card gradient-danger">
              <Statistic
                title={<span style={{ color: 'white' }}>Total Pending</span>}
                value={totalPending}
                prefix="₹"
                precision={2}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card gradient-warning">
              <Statistic
                title={<span style={{ color: 'white' }}>Suppliers with Dues</span>}
                value={suppliersWithPending}
                prefix={<WarningOutlined />}
                valueStyle={{ color: 'white' }}
              />
            </Card>
          </Col>
        </Row>

        <Card title={`Supplier Details (${data.length} suppliers)`}>
          <Table
            dataSource={data}
            columns={columns}
            rowKey="supplierName"
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        </Card>
      </div>
    </Layout>
  );
};

export default SupplierReport;
