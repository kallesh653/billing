import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  DatePicker,
  Button,
  Space,
  Row,
  Col,
  Tag,
  message,
  Statistic,
  Modal,
  Select,
  Input,
  Dropdown
} from 'antd';
import {
  FileTextOutlined,
  CalendarOutlined,
  EyeOutlined,
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
import { exportPurchaseReportToExcel, exportPurchaseReportToPDF } from '../../utils/exportUtils';

const { RangePicker } = DatePicker;

const ViewPurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [summary, setSummary] = useState({ count: 0, totalAmount: 0, totalPending: 0 });
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);

  // Filter states
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchSuppliers();
    fetchPurchases();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data } = await api.get('/suppliers');
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error('Failed to load suppliers');
    }
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      if (selectedSupplier) params.supplier = selectedSupplier;
      if (selectedPaymentStatus) params.paymentStatus = selectedPaymentStatus;

      console.log('Fetching purchases with params:', params);
      const { data } = await api.get('/purchases', { params });
      console.log('Purchase API Response:', data);

      let purchasesData = data.purchases || [];
      console.log('Purchases data:', purchasesData.length, purchasesData);

      // Apply search filter on frontend
      if (searchText) {
        purchasesData = purchasesData.filter(p =>
          p.purchaseNo?.toLowerCase().includes(searchText.toLowerCase()) ||
          p.invoiceNo?.toLowerCase().includes(searchText.toLowerCase()) ||
          p.supplierName?.toLowerCase().includes(searchText.toLowerCase()) ||
          p.supplierMobile?.includes(searchText)
        );
      }

      setPurchases(purchasesData);

      // Calculate summary
      const total = purchasesData.reduce((sum, p) => sum + (p.invoiceAmount || 0), 0);
      const pending = purchasesData.reduce((sum, p) => sum + (p.pendingAmount || 0), 0);
      const gst = purchasesData.reduce((sum, p) => sum + (p.gstAmount || 0), 0);

      setSummary({
        count: purchasesData.length,
        totalAmount: total,
        totalPending: pending,
        totalGst: gst
      });
    } catch (error) {
      console.error('Purchase report error:', error);
      console.error('Error response:', error.response);
      message.error(error.response?.data?.message || 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (purchaseId) => {
    try {
      const { data } = await api.get(`/purchases/${purchaseId}`);
      setSelectedPurchase(data.purchase);
      setDetailsModal(true);
    } catch (error) {
      message.error('Failed to load purchase details');
    }
  };

  const handleExportExcel = () => {
    if (purchases.length === 0) {
      message.warning('No data to export');
      return;
    }
    const success = exportPurchaseReportToExcel(purchases);
    if (success) {
      message.success('Excel file downloaded successfully');
    } else {
      message.error('Failed to export Excel');
    }
  };

  const handleExportPDF = () => {
    if (purchases.length === 0) {
      message.warning('No data to export');
      return;
    }
    const success = exportPurchaseReportToPDF(purchases, dateRange, summary);
    if (success) {
      message.success('PDF file downloaded successfully');
    } else {
      message.error('Failed to export PDF');
    }
  };

  const resetFilters = () => {
    setDateRange(null);
    setSelectedSupplier(null);
    setSelectedPaymentStatus(null);
    setSearchText('');
    setTimeout(fetchPurchases, 100);
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
      title: 'Purchase No',
      dataIndex: 'purchaseNo',
      key: 'purchaseNo',
      render: (no) => <Tag color="blue" style={{ fontSize: 13 }}>{no}</Tag>,
      width: 140,
      fixed: 'left'
    },
    {
      title: 'Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      render: (date) => moment(date).format('DD MMM YYYY'),
      width: 110
    },
    {
      title: 'Invoice No',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
      width: 120
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName',
      width: 180,
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          {record.supplierMobile && (
            <div style={{ fontSize: 11, color: '#999' }}>{record.supplierMobile}</div>
          )}
        </div>
      )
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items) => items?.length || 0,
      align: 'center',
      width: 70
    },
    {
      title: 'Invoice Amt',
      dataIndex: 'invoiceAmount',
      key: 'invoiceAmount',
      render: (amount) => (
        <span style={{ fontWeight: 500 }}>₹{amount?.toFixed(2) || '0.00'}</span>
      ),
      align: 'right',
      width: 120
    },
    {
      title: 'GST',
      dataIndex: 'gstAmount',
      key: 'gstAmount',
      render: (amount, record) => (
        record.isLocalPurchase ? (
          <Tag color="orange" style={{ fontSize: 11 }}>No GST</Tag>
        ) : (
          <span style={{ color: '#52c41a', fontWeight: 500 }}>
            ₹{amount?.toFixed(2) || '0.00'}
          </span>
        )
      ),
      align: 'right',
      width: 100
    },
    {
      title: 'Paid',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      render: (amount) => (
        <span style={{ color: '#1890ff', fontWeight: 500 }}>₹{amount?.toFixed(2) || '0.00'}</span>
      ),
      align: 'right',
      width: 110
    },
    {
      title: 'Pending',
      dataIndex: 'pendingAmount',
      key: 'pendingAmount',
      render: (amount) => (
        <span style={{ color: amount > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>
          ₹{amount?.toFixed(2) || '0.00'}
        </span>
      ),
      align: 'right',
      width: 110
    },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => {
        const colors = { Paid: 'success', Partial: 'warning', Pending: 'error' };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      },
      width: 100
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => viewDetails(record._id)}
          style={{ padding: 0 }}
        >
          View
        </Button>
      ),
      width: 80,
      fixed: 'right'
    }
  ];

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8, fontSize: 28, fontWeight: 600 }}>
          <FileTextOutlined /> Purchase Register
        </h1>
        <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
          Complete purchase history with advanced filters and export options
        </p>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card gradient-primary" style={{ borderRadius: 8 }}>
            <Statistic
              title={<span style={{ color: 'white', fontSize: 13 }}>Total Purchases</span>}
              value={summary.count}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: 'white', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card gradient-success" style={{ borderRadius: 8 }}>
            <Statistic
              title={<span style={{ color: 'white', fontSize: 13 }}>Total Amount</span>}
              value={summary.totalAmount}
              prefix="₹"
              precision={2}
              valueStyle={{ color: 'white', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card gradient-warning" style={{ borderRadius: 8 }}>
            <Statistic
              title={<span style={{ color: 'white', fontSize: 13 }}>Total GST</span>}
              value={summary.totalGst || 0}
              prefix="₹"
              precision={2}
              valueStyle={{ color: 'white', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card gradient-danger" style={{ borderRadius: 8 }}>
            <Statistic
              title={<span style={{ color: 'white', fontSize: 13 }}>Total Pending</span>}
              value={summary.totalPending}
              prefix="₹"
              precision={2}
              valueStyle={{ color: 'white', fontSize: 28 }}
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
              <span style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>Supplier</span>
              <Select
                placeholder="All Suppliers"
                size="large"
                style={{ width: '100%' }}
                value={selectedSupplier}
                onChange={setSelectedSupplier}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {suppliers.map(s => (
                  <Select.Option key={s._id} value={s._id}>
                    {s.supplierName}
                  </Select.Option>
                ))}
              </Select>
            </Space>
          </Col>

          <Col xs={24} sm={12} md={8} lg={5}>
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              <span style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>Payment Status</span>
              <Select
                placeholder="All Status"
                size="large"
                style={{ width: '100%' }}
                value={selectedPaymentStatus}
                onChange={setSelectedPaymentStatus}
                allowClear
              >
                <Select.Option value="Paid">Paid</Select.Option>
                <Select.Option value="Partial">Partial</Select.Option>
                <Select.Option value="Pending">Pending</Select.Option>
              </Select>
            </Space>
          </Col>

          <Col xs={24} sm={12} md={8} lg={5}>
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              <span style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>Search</span>
              <Input
                placeholder="Purchase No, Invoice, Supplier..."
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
                onClick={fetchPurchases}
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

      {/* Purchases Table - Tally Style */}
      <Card
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>Purchase Entries ({purchases.length} records)</span>}
        style={{ borderRadius: 8 }}
      >
        <Table
          dataSource={purchases}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} purchases`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          scroll={{ x: 1400 }}
          size="middle"
          bordered
        />
      </Card>

      {/* Purchase Details Modal */}
      <Modal
        title={
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            <FileTextOutlined /> Purchase Details - {selectedPurchase?.purchaseNo || ''}
          </div>
        }
        open={detailsModal}
        onCancel={() => setDetailsModal(false)}
        footer={null}
        width={900}
      >
        {selectedPurchase && (
          <div>
            <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div><strong>Supplier:</strong> {selectedPurchase.supplierName}</div>
                  {selectedPurchase.supplierMobile && (
                    <div><strong>Mobile:</strong> {selectedPurchase.supplierMobile}</div>
                  )}
                </Col>
                <Col span={12}>
                  <div><strong>Invoice No:</strong> {selectedPurchase.invoiceNo}</div>
                  <div><strong>Invoice Date:</strong> {moment(selectedPurchase.invoiceDate).format('DD MMM YYYY')}</div>
                </Col>
                <Col span={12}>
                  <div>
                    <strong>Payment Status:</strong>{' '}
                    <Tag color={selectedPurchase.paymentStatus === 'Paid' ? 'success' : 'warning'}>
                      {selectedPurchase.paymentStatus}
                    </Tag>
                  </div>
                </Col>
                <Col span={12}>
                  <div>
                    <strong>Purchase Type:</strong>{' '}
                    <Tag color={selectedPurchase.isLocalPurchase ? 'orange' : 'blue'}>
                      {selectedPurchase.isLocalPurchase ? 'Local (No GST)' : 'Regular'}
                    </Tag>
                  </div>
                </Col>
              </Row>
            </Card>

            <Table
              dataSource={selectedPurchase.items}
              pagination={false}
              size="small"
              bordered
              columns={[
                {
                  title: 'Item Name',
                  dataIndex: 'itemName',
                  key: 'itemName',
                  render: (name, rec) => (
                    <div>
                      <div style={{ fontWeight: 500 }}>{name}</div>
                      {rec.description && <div style={{ fontSize: 11, color: '#999' }}>{rec.description}</div>}
                    </div>
                  )
                },
                {
                  title: 'Type',
                  dataIndex: 'itemType',
                  key: 'itemType',
                  width: 130,
                  render: (type) => <Tag color="blue">{type || 'Raw Material'}</Tag>
                },
                {
                  title: 'Quantity',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  width: 100,
                  align: 'right',
                  render: (qty, rec) => `${qty} ${rec.unit}`
                },
                {
                  title: 'Rate',
                  dataIndex: 'rate',
                  key: 'rate',
                  width: 100,
                  align: 'right',
                  render: (r) => `₹${r.toFixed(2)}`
                },
                {
                  title: 'Total',
                  dataIndex: 'total',
                  key: 'total',
                  width: 120,
                  align: 'right',
                  render: (t) => <strong>₹{t.toFixed(2)}</strong>
                }
              ]}
            />

            <Card size="small" style={{ marginTop: 16, background: '#f0f2f5' }}>
              <Row gutter={[24, 8]}>
                <Col span={12}>
                  <div style={{ marginBottom: 8, fontSize: 15 }}>
                    <strong>Invoice Amount:</strong>
                    <span style={{ float: 'right', fontWeight: 600 }}>
                      ₹{selectedPurchase.invoiceAmount.toFixed(2)}
                    </span>
                  </div>
                  {selectedPurchase.gstAmount > 0 && (
                    <>
                      {selectedPurchase.cgst > 0 && (
                        <div style={{ marginBottom: 6 }}>
                          <strong>CGST:</strong>
                          <span style={{ float: 'right' }}>₹{selectedPurchase.cgst.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedPurchase.sgst > 0 && (
                        <div style={{ marginBottom: 6 }}>
                          <strong>SGST:</strong>
                          <span style={{ float: 'right' }}>₹{selectedPurchase.sgst.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedPurchase.igst > 0 && (
                        <div style={{ marginBottom: 6 }}>
                          <strong>IGST:</strong>
                          <span style={{ float: 'right' }}>₹{selectedPurchase.igst.toFixed(2)}</span>
                        </div>
                      )}
                      <div style={{ marginBottom: 6, color: '#52c41a' }}>
                        <strong>Total GST:</strong>
                        <span style={{ float: 'right', fontWeight: 600 }}>
                          ₹{selectedPurchase.gstAmount.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: 8, color: '#1890ff', fontSize: 15 }}>
                    <strong>Paid Amount:</strong>
                    <span style={{ float: 'right', fontWeight: 600 }}>
                      ₹{selectedPurchase.paidAmount.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ marginBottom: 8, color: '#ff4d4f', fontSize: 15 }}>
                    <strong>Pending Amount:</strong>
                    <span style={{ float: 'right', fontWeight: 600 }}>
                      ₹{selectedPurchase.pendingAmount.toFixed(2)}
                    </span>
                  </div>
                </Col>
              </Row>
              {selectedPurchase.remarks && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #d9d9d9' }}>
                  <strong>Remarks:</strong> {selectedPurchase.remarks}
                </div>
              )}
            </Card>
          </div>
        )}
      </Modal>

    </Layout>
  );
};

export default ViewPurchases;
