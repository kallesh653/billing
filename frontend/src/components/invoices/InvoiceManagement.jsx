import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  message,
  Input,
  Select,
  DatePicker,
  Modal,
  Descriptions,
  Row,
  Col,
  Statistic,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  FilePdfOutlined,
  DeleteOutlined,
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Layout from '../common/Layout';
import api from '../../services/api';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { Search } = Input;

function InvoiceManagement() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    paymentStatus: '',
    dateRange: null
  });
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, [pagination.current, filters]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: filters.search,
        paymentStatus: filters.paymentStatus
      };

      if (filters.dateRange) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      const response = await api.get('/invoices', { params });
      if (response.data.success) {
        setInvoices(response.data.data);
        setPagination({
          ...pagination,
          total: response.data.pagination.total
        });
      }
    } catch (error) {
      message.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/invoices/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
    try {
      message.loading({ content: 'Generating PDF...', key: 'pdf' });
      const response = await api.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      message.success({ content: 'PDF downloaded successfully!', key: 'pdf' });
    } catch (error) {
      message.error({ content: 'Failed to generate PDF', key: 'pdf' });
    }
  };

  const handleViewInvoice = async (invoiceId) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}`);
      if (response.data.success) {
        setSelectedInvoice(response.data.data);
        setViewModalVisible(true);
      }
    } catch (error) {
      message.error('Failed to fetch invoice details');
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    try {
      const response = await api.delete(`/invoices/${invoiceId}`);
      if (response.data.success) {
        message.success('Invoice deleted successfully');
        fetchInvoices();
        fetchStats();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to delete invoice');
    }
  };

  const getPaymentStatusTag = (status) => {
    const statusConfig = {
      'Paid': { color: 'success', icon: <CheckCircleOutlined /> },
      'Unpaid': { color: 'error', icon: <ExclamationCircleOutlined /> },
      'Partially Paid': { color: 'warning', icon: <ClockCircleOutlined /> },
      'Overdue': { color: 'red', icon: <ExclamationCircleOutlined /> }
    };
    const config = statusConfig[status] || {};
    return <Tag color={config.color} icon={config.icon}>{status}</Tag>;
  };

  const columns = [
    {
      title: 'Invoice No',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 150,
      render: (text) => <strong style={{ color: '#667eea' }}>{text}</strong>
    },
    {
      title: 'Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      width: 120,
      render: (date) => moment(date).format('DD MMM YYYY')
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'customerName'],
      key: 'customer',
      render: (text, record) => (
        <div>
          <div><strong>{text}</strong></div>
          {record.customer?.companyName && (
            <div style={{ fontSize: 12, color: '#666' }}>{record.customer.companyName}</div>
          )}
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'invoiceType',
      key: 'invoiceType',
      width: 140,
      render: (type) => <Tag color="blue">{type}</Tag>
    },
    {
      title: 'Amount',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      width: 120,
      align: 'right',
      render: (amount) => <strong>₹{amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
    },
    {
      title: 'Paid',
      dataIndex: 'amountPaid',
      key: 'amountPaid',
      width: 120,
      align: 'right',
      render: (amount) => <span style={{ color: '#52c41a' }}>₹{amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
    },
    {
      title: 'Balance',
      key: 'balance',
      width: 120,
      align: 'right',
      render: (_, record) => {
        const balance = record.grandTotal - record.amountPaid;
        return <span style={{ color: balance > 0 ? '#ff4d4f' : '#52c41a' }}>₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>;
      }
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 150,
      render: (status) => getPaymentStatusTag(status)
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewInvoice(record._id)}
          >
            View
          </Button>
          <Button
            type="link"
            size="small"
            icon={<FilePdfOutlined />}
            onClick={() => handleDownloadPDF(record._id, record.invoiceNumber)}
            style={{ color: '#ff4d4f' }}
          >
            PDF
          </Button>
          <Popconfirm
            title="Delete Invoice"
            description="Are you sure you want to delete this invoice?"
            onConfirm={() => handleDeleteInvoice(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Invoices"
                value={stats.totalInvoices || 0}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#667eea' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Amount"
                value={stats.totalAmount || 0}
                prefix="₹"
                precision={2}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Paid Amount"
                value={stats.paidAmount || 0}
                prefix="₹"
                precision={2}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Pending Amount"
                value={stats.pendingAmount || 0}
                prefix="₹"
                precision={2}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Main Card */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileTextOutlined style={{ fontSize: 20 }} />
              <span>Invoice Management</span>
            </div>
          }
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/invoices/create')}
              size="large"
            >
              Create Invoice
            </Button>
          }
        >
          {/* Filters */}
          <Space style={{ marginBottom: 16, width: '100%' }} wrap>
            <Search
              placeholder="Search by invoice number or customer"
              allowClear
              style={{ width: 300 }}
              onSearch={(value) => setFilters({ ...filters, search: value })}
            />
            <Select
              placeholder="Payment Status"
              allowClear
              style={{ width: 180 }}
              onChange={(value) => setFilters({ ...filters, paymentStatus: value })}
            >
              <Select.Option value="Paid">Paid</Select.Option>
              <Select.Option value="Unpaid">Unpaid</Select.Option>
              <Select.Option value="Partially Paid">Partially Paid</Select.Option>
              <Select.Option value="Overdue">Overdue</Select.Option>
            </Select>
            <RangePicker
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            />
          </Space>

          {/* Table */}
          <Table
            columns={columns}
            dataSource={invoices}
            loading={loading}
            rowKey="_id"
            scroll={{ x: 1400 }}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} invoices`,
              onChange: (page, pageSize) => {
                setPagination({ ...pagination, current: page, pageSize });
              }
            }}
          />
        </Card>

        {/* View Invoice Modal */}
        <Modal
          title={`Invoice Details - ${selectedInvoice?.invoiceNumber}`}
          open={viewModalVisible}
          onCancel={() => setViewModalVisible(false)}
          width={900}
          footer={[
            <Button key="close" onClick={() => setViewModalVisible(false)}>
              Close
            </Button>,
            <Button
              key="pdf"
              type="primary"
              icon={<FilePdfOutlined />}
              onClick={() => {
                handleDownloadPDF(selectedInvoice._id, selectedInvoice.invoiceNumber);
                setViewModalVisible(false);
              }}
            >
              Download PDF
            </Button>
          ]}
        >
          {selectedInvoice && (
            <div>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Invoice Number" span={1}>
                  <strong>{selectedInvoice.invoiceNumber}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Invoice Date" span={1}>
                  {moment(selectedInvoice.invoiceDate).format('DD MMM YYYY')}
                </Descriptions.Item>
                <Descriptions.Item label="Customer Name" span={2}>
                  {selectedInvoice.customer?.customerName}
                  {selectedInvoice.customer?.companyName && ` (${selectedInvoice.customer?.companyName})`}
                </Descriptions.Item>
                <Descriptions.Item label="Customer Mobile" span={1}>
                  {selectedInvoice.customer?.mobile}
                </Descriptions.Item>
                <Descriptions.Item label="Customer Email" span={1}>
                  {selectedInvoice.customer?.email || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Invoice Type" span={1}>
                  <Tag color="blue">{selectedInvoice.invoiceType}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Payment Status" span={1}>
                  {getPaymentStatusTag(selectedInvoice.paymentStatus)}
                </Descriptions.Item>
              </Descriptions>

              <h3 style={{ marginTop: 24, marginBottom: 16 }}>Invoice Items</h3>
              <Table
                dataSource={selectedInvoice.items}
                pagination={false}
                size="small"
                rowKey={(record, index) => index}
                columns={[
                  {
                    title: 'Item',
                    dataIndex: 'itemName',
                    key: 'itemName'
                  },
                  {
                    title: 'HSN',
                    dataIndex: 'hsnCode',
                    key: 'hsnCode',
                    width: 100
                  },
                  {
                    title: 'Qty',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    width: 80,
                    align: 'center'
                  },
                  {
                    title: 'Rate',
                    dataIndex: 'rate',
                    key: 'rate',
                    width: 100,
                    align: 'right',
                    render: (rate) => `₹${rate.toFixed(2)}`
                  },
                  {
                    title: 'Tax %',
                    dataIndex: 'taxRate',
                    key: 'taxRate',
                    width: 80,
                    align: 'center',
                    render: (rate) => `${rate}%`
                  },
                  {
                    title: 'Amount',
                    dataIndex: 'totalAmount',
                    key: 'totalAmount',
                    width: 120,
                    align: 'right',
                    render: (amount) => <strong>₹{amount.toFixed(2)}</strong>
                  }
                ]}
              />

              <Row gutter={16} style={{ marginTop: 24 }}>
                <Col span={12}>
                  <Card size="small" title="Payment Summary">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Subtotal">
                        ₹{selectedInvoice.subtotal?.toFixed(2)}
                      </Descriptions.Item>
                      {selectedInvoice.totalCGST > 0 && (
                        <Descriptions.Item label="CGST">
                          ₹{selectedInvoice.totalCGST?.toFixed(2)}
                        </Descriptions.Item>
                      )}
                      {selectedInvoice.totalSGST > 0 && (
                        <Descriptions.Item label="SGST">
                          ₹{selectedInvoice.totalSGST?.toFixed(2)}
                        </Descriptions.Item>
                      )}
                      {selectedInvoice.totalIGST > 0 && (
                        <Descriptions.Item label="IGST">
                          ₹{selectedInvoice.totalIGST?.toFixed(2)}
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label={<strong>Grand Total</strong>}>
                        <strong style={{ fontSize: 16, color: '#667eea' }}>
                          ₹{selectedInvoice.grandTotal?.toFixed(2)}
                        </strong>
                      </Descriptions.Item>
                      <Descriptions.Item label="Amount Paid">
                        <span style={{ color: '#52c41a' }}>₹{selectedInvoice.amountPaid?.toFixed(2)}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label={<strong>Balance</strong>}>
                        <strong style={{ color: '#ff4d4f' }}>
                          ₹{(selectedInvoice.grandTotal - selectedInvoice.amountPaid)?.toFixed(2)}
                        </strong>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="Amount in Words">
                    <p style={{ fontStyle: 'italic' }}>{selectedInvoice.amountInWords}</p>
                  </Card>
                  {selectedInvoice.notes && (
                    <Card size="small" title="Notes" style={{ marginTop: 8 }}>
                      <p>{selectedInvoice.notes}</p>
                    </Card>
                  )}
                </Col>
              </Row>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}

export default InvoiceManagement;
