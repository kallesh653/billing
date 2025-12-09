import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  DatePicker,
  Button,
  Space,
  Row,
  Col,
  Statistic,
  Tag,
  message,
  Select,
  Input,
  Dropdown
} from 'antd';
import {
  DollarOutlined,
  FileTextOutlined,
  CalendarOutlined,
  BarChartOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FilterOutlined
} from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';
import moment from 'moment';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { exportSalesReportToExcel, exportSalesReportToPDF } from '../../utils/exportUtils';

const { RangePicker } = DatePicker;

const SalesReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [settings, setSettings] = useState({});
  const [summary, setSummary] = useState({
    count: 0,
    totalSales: 0,
    totalDiscount: 0,
    totalGST: 0,
    cashSales: 0,
    upiSales: 0,
    cardSales: 0
  });

  // Filter states
  const [selectedPaymentMode, setSelectedPaymentMode] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchReport();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings(data.settings || {});
    } catch (error) {
      // Settings load failed - will use defaults
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = { limit: 1000 };
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      const { data: response } = await api.get('/bills', { params });

      let billsData = response.bills || [];

      // Filter only completed bills for sales report
      billsData = billsData.filter(b => b.status === 'Completed');

      // Apply frontend filters
      if (selectedPaymentMode) {
        billsData = billsData.filter(b => b.paymentMode === selectedPaymentMode);
      }
      if (selectedStatus) {
        billsData = billsData.filter(b => b.status === selectedStatus);
      }
      if (searchText) {
        billsData = billsData.filter(b =>
          b.billNo?.toString().includes(searchText) ||
          b.customerName?.toLowerCase().includes(searchText.toLowerCase()) ||
          b.customerMobile?.includes(searchText) ||
          b.userName?.toLowerCase().includes(searchText.toLowerCase())
        );
      }

      setData(billsData);

      // Calculate comprehensive summary
      const totalSales = billsData.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
      const totalDiscount = billsData.reduce((sum, b) => sum + (b.discountAmount || 0), 0);
      const totalGST = billsData.reduce((sum, b) => sum + (b.gstAmount || 0), 0);
      const cashSales = billsData.filter(b => b.paymentMode === 'Cash').reduce((sum, b) => sum + (b.grandTotal || 0), 0);
      const upiSales = billsData.filter(b => b.paymentMode === 'UPI').reduce((sum, b) => sum + (b.grandTotal || 0), 0);
      const cardSales = billsData.filter(b => b.paymentMode === 'Card').reduce((sum, b) => sum + (b.grandTotal || 0), 0);

      setSummary({
        count: billsData.length,
        totalSales,
        totalDiscount,
        totalGST,
        cashSales,
        upiSales,
        cardSales
      });
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to load sales report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (data.length === 0) {
      message.warning('No data to export');
      return;
    }
    const success = exportSalesReportToExcel(data, settings);
    if (success) {
      message.success('Excel file downloaded successfully');
    } else {
      message.error('Failed to export Excel');
    }
  };

  const handleExportPDF = () => {
    if (data.length === 0) {
      message.warning('No data to export');
      return;
    }
    const success = exportSalesReportToPDF(data, dateRange, summary, settings);
    if (success) {
      message.success('PDF file downloaded successfully');
    } else {
      message.error('Failed to export PDF');
    }
  };

  const resetFilters = () => {
    setDateRange(null);
    setSelectedPaymentMode(null);
    setSelectedStatus(null);
    setSearchText('');
    setTimeout(fetchReport, 100);
  };

  const exportMenu = {
    items: [
      {
        key: 'excel',
        label: 'Export to Excel',
        icon: <FileExcelOutlined />,
        onClick: handleExportExcel
      },
      {
        key: 'pdf',
        label: 'Export to PDF',
        icon: <FilePdfOutlined />,
        onClick: handleExportPDF
      }
    ]
  };

  const columns = [
    {
      title: 'Bill No',
      dataIndex: 'billNo',
      key: 'billNo',
      render: (no) => <Tag color="blue" style={{ fontSize: 13 }}>{no}</Tag>,
      width: 100,
      fixed: 'left'
    },
    {
      title: 'Date & Time',
      dataIndex: 'billDate',
      key: 'billDate',
      render: (date) => (
        <div>
          <div>{moment(date).format('DD MMM YYYY')}</div>
          <div style={{ fontSize: 11, color: '#999' }}>{moment(date).format('hh:mm A')}</div>
        </div>
      ),
      width: 130
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name || 'Walk-in'}</div>
          {record.customerMobile && (
            <div style={{ fontSize: 11, color: '#999' }}>{record.customerMobile}</div>
          )}
        </div>
      ),
      width: 150
    },
    {
      title: 'User',
      dataIndex: 'userName',
      key: 'userName',
      render: (name) => <Tag color="purple">{name}</Tag>,
      width: 100
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items) => items?.length || 0,
      align: 'center',
      width: 60
    },
    {
      title: 'Subtotal',
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: (amount) => <span style={{ fontWeight: 500 }}>₹{amount?.toFixed(2) || '0.00'}</span>,
      align: 'right',
      width: 110
    },
    {
      title: 'Discount',
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      render: (amount) => amount > 0 ? (
        <Tag color="red" style={{ fontSize: 11 }}>-₹{amount.toFixed(2)}</Tag>
      ) : '-',
      align: 'right',
      width: 90
    },
    {
      title: 'GST',
      dataIndex: 'gstAmount',
      key: 'gstAmount',
      render: (amount) => amount > 0 ? (
        <span style={{ color: '#52c41a', fontWeight: 500 }}>₹{amount.toFixed(2)}</span>
      ) : '-',
      align: 'right',
      width: 90
    },
    {
      title: 'Grand Total',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      render: (amount) => (
        <strong style={{ color: '#667eea', fontSize: 15 }}>₹{amount?.toFixed(2) || '0.00'}</strong>
      ),
      align: 'right',
      width: 120
    },
    {
      title: 'Payment',
      dataIndex: 'paymentMode',
      key: 'paymentMode',
      render: (mode) => {
        const colors = { Cash: 'green', UPI: 'blue', Card: 'purple', Mixed: 'orange' };
        return <Tag color={colors[mode] || 'default'}>{mode}</Tag>;
      },
      width: 90
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Completed' ? 'success' : 'error'}>{status}</Tag>
      ),
      width: 100
    }
  ];

  // Prepare chart data
  const chartData = data.reduce((acc, bill) => {
    const date = moment(bill.billDate).format('DD MMM');
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.amount += bill.grandTotal;
      existing.bills += 1;
    } else {
      acc.push({ date, amount: bill.grandTotal, bills: 1 });
    }
    return acc;
  }, []);

  // Payment mode breakdown
  const paymentData = [
    { name: 'Cash', value: summary.cashSales },
    { name: 'UPI', value: summary.upiSales },
    { name: 'Card', value: summary.cardSales }
  ].filter(item => item.value > 0);

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8, fontSize: 28, fontWeight: 600 }}>
          <BarChartOutlined /> Sales Report & Analysis
        </h1>
        <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
          Comprehensive sales analysis with advanced filters and export options
        </p>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card gradient-primary" style={{ borderRadius: 8 }}>
            <Statistic
              title={<span style={{ color: 'white', fontSize: 13 }}>Total Bills</span>}
              value={summary.count}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: 'white', fontSize: 26 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={5}>
          <Card className="stat-card gradient-success" style={{ borderRadius: 8 }}>
            <Statistic
              title={<span style={{ color: 'white', fontSize: 13 }}>Total Sales</span>}
              value={summary.totalSales}
              prefix="₹"
              precision={2}
              valueStyle={{ color: 'white', fontSize: 26 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={5}>
          <Card className="stat-card gradient-warning" style={{ borderRadius: 8 }}>
            <Statistic
              title={<span style={{ color: 'white', fontSize: 13 }}>Average Bill</span>}
              value={summary.count > 0 ? summary.totalSales / summary.count : 0}
              prefix="₹"
              precision={2}
              valueStyle={{ color: 'white', fontSize: 26 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={5}>
          <Card className="stat-card gradient-info" style={{ borderRadius: 8 }}>
            <Statistic
              title={<span style={{ color: 'white', fontSize: 13 }}>Total Discount</span>}
              value={summary.totalDiscount}
              prefix="₹"
              precision={2}
              valueStyle={{ color: 'white', fontSize: 26 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={5}>
          <Card className="stat-card gradient-danger" style={{ borderRadius: 8 }}>
            <Statistic
              title={<span style={{ color: 'white', fontSize: 13 }}>Total GST</span>}
              value={summary.totalGST}
              prefix="₹"
              precision={2}
              valueStyle={{ color: 'white', fontSize: 26 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters Section */}
      <Card
        title={<span><FilterOutlined /> Filters</span>}
        style={{ marginBottom: 16, borderRadius: 8 }}
        extra={
          <Space>
            <Dropdown menu={exportMenu} placement="bottomRight">
              <Button type="primary" icon={<DownloadOutlined />}>
                Export
              </Button>
            </Dropdown>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              <span style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>Date Range</span>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                format="DD MMM YYYY"
                size="large"
                style={{ width: '100%' }}
              />
            </Space>
          </Col>

          <Col xs={24} sm={12} md={8} lg={5}>
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              <span style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>Payment Mode</span>
              <Select
                placeholder="All Modes"
                size="large"
                style={{ width: '100%' }}
                value={selectedPaymentMode}
                onChange={setSelectedPaymentMode}
                allowClear
              >
                <Select.Option value="Cash">Cash</Select.Option>
                <Select.Option value="UPI">UPI</Select.Option>
                <Select.Option value="Card">Card</Select.Option>
                <Select.Option value="Mixed">Mixed</Select.Option>
              </Select>
            </Space>
          </Col>

          <Col xs={24} sm={12} md={8} lg={5}>
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              <span style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>Status</span>
              <Select
                placeholder="All Status"
                size="large"
                style={{ width: '100%' }}
                value={selectedStatus}
                onChange={setSelectedStatus}
                allowClear
              >
                <Select.Option value="Completed">Completed</Select.Option>
                <Select.Option value="Cancelled">Cancelled</Select.Option>
              </Select>
            </Space>
          </Col>

          <Col xs={24} sm={12} md={8} lg={5}>
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              <span style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>Search</span>
              <Input
                placeholder="Bill No, Customer, User..."
                size="large"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Space>
          </Col>

          <Col xs={24} sm={24} md={8} lg={6} style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                size="large"
                onClick={fetchReport}
                loading={loading}
                block
              >
                Search
              </Button>
              <Button
                icon={<ReloadOutlined />}
                size="large"
                onClick={resetFilters}
                block
              >
                Reset
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Sales Trend Chart */}
      {chartData.length > 0 && (
        <Card title={<span style={{ fontSize: 16, fontWeight: 600 }}>Sales Trend</span>} style={{ marginBottom: 16, borderRadius: 8 }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                formatter={(value) => `₹${value.toFixed(2)}`}
                contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8 }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#667eea"
                strokeWidth={3}
                dot={{ fill: '#667eea', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Payment Mode Breakdown */}
      {paymentData.length > 0 && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 8, background: '#f0fdf4' }}>
              <Statistic
                title="Cash Sales"
                value={summary.cashSales}
                prefix="₹"
                precision={2}
                valueStyle={{ color: '#16a34a', fontSize: 22 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 8, background: '#eff6ff' }}>
              <Statistic
                title="UPI Sales"
                value={summary.upiSales}
                prefix="₹"
                precision={2}
                valueStyle={{ color: '#2563eb', fontSize: 22 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ borderRadius: 8, background: '#faf5ff' }}>
              <Statistic
                title="Card Sales"
                value={summary.cardSales}
                prefix="₹"
                precision={2}
                valueStyle={{ color: '#9333ea', fontSize: 22 }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Bills Table - Tally Style */}
      <Card
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>Sales Voucher Entries ({data.length} bills)</span>}
        style={{ borderRadius: 8 }}
      >
        <Table
          dataSource={data}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} bills`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          scroll={{ x: 1400 }}
          size="middle"
          bordered
          summary={(pageData) => {
            const totalAmount = pageData.reduce((sum, record) => sum + (record.grandTotal || 0), 0);
            const totalDiscount = pageData.reduce((sum, record) => sum + (record.discountAmount || 0), 0);
            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5} align="right">
                    Page Total:
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    -
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    {totalDiscount > 0 && <Tag color="red">-₹{totalDiscount.toFixed(2)}</Tag>}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    -
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <strong style={{ color: '#1e40af', fontSize: 15 }}>₹{totalAmount.toFixed(2)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} colSpan={2} />
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>
    </Layout>
  );
};

export default SalesReport;
