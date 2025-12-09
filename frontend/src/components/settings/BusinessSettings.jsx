import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  message,
  Row,
  Col,
  Divider,
  Space,
  Tabs,
  Alert,
  Upload,
  Image
} from 'antd';
import {
  ShopOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  PrinterOutlined,
  SettingOutlined,
  SaveOutlined,
  NumberOutlined,
  UploadOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';

const BusinessSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logo, setLogo] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/settings');
      form.setFieldsValue(data.settings);
      if (data.settings?.logo) {
        setLogo(data.settings.logo);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }
    const isLt500K = file.size / 1024 < 500;
    if (!isLt500K) {
      message.error('Image must be smaller than 500KB!');
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setLogo(e.target.result);
      message.success('Logo uploaded successfully');
    };
    reader.readAsDataURL(file);
    return false;
  };

  const removeLogo = () => {
    setLogo('');
    message.info('Logo removed');
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const dataToSend = { ...values, logo };
      await api.put('/settings', dataToSend);
      message.success('Settings updated successfully');
      fetchSettings();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const items = [
    {
      key: 'business',
      label: (
        <Space>
          <ShopOutlined />
          Business Info
        </Space>
      ),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Alert
              message="Business Information"
              description="Configure your shop details that appear on bills and reports"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="shopName"
              label="Shop Name"
              rules={[{ required: true, message: 'Please enter shop name' }]}
            >
              <Input
                prefix={<ShopOutlined />}
                placeholder="Enter shop name"
                size="large"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="shopMobile"
              label="Shop Mobile"
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="Enter mobile number"
                size="large"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="shopEmail"
              label="Shop Email"
            >
              <Input
                prefix={<MailOutlined />}
                type="email"
                placeholder="Enter email address"
                size="large"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="gstNumber"
              label="GST Number"
            >
              <Input
                placeholder="Enter GST number"
                size="large"
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              name="shopAddress"
              label="Shop Address"
            >
              <Input.TextArea
                prefix={<EnvironmentOutlined />}
                placeholder="Enter complete address"
                rows={3}
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: 'billing',
      label: (
        <Space>
          <NumberOutlined />
          Billing Settings
        </Space>
      ),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Alert
              message="Bill Number Configuration"
              description="Control bill numbering format and starting number"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="billPrefix"
              label="Bill Prefix"
              tooltip="Prefix for bill numbers (e.g., BILL, INV)"
            >
              <Input
                prefix={<FileTextOutlined />}
                placeholder="BILL"
                size="large"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="billStartNumber"
              label="Starting Bill Number"
              tooltip="Bill numbering will start from this number"
            >
              <InputNumber
                min={1}
                style={{ width: '100%' }}
                size="large"
                placeholder="1"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="currentBillNo"
              label="Current Bill Number"
              tooltip="Last used bill number (auto-incremented)"
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                size="large"
                disabled
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Divider />
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="gstEnabled"
              label="Enable GST"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Enabled"
                unCheckedChildren="Disabled"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="defaultGstPercent"
              label="Default GST %"
              dependencies={['gstEnabled']}
            >
              <InputNumber
                min={0}
                max={100}
                style={{ width: '100%' }}
                size="large"
                placeholder="5"
                suffix="%"
              />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: 'printer',
      label: (
        <Space>
          <PrinterOutlined />
          Printer Settings
        </Space>
      ),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Alert
              message="Thermal Printer Configuration"
              description="Configure your thermal printer for bill printing"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name={['thermalPrinterSettings', 'printerName']}
              label="Printer Name"
            >
              <Input
                prefix={<PrinterOutlined />}
                placeholder="ThermalPrinter"
                size="large"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name={['thermalPrinterSettings', 'paperWidth']}
              label="Paper Width (mm)"
            >
              <InputNumber
                min={40}
                max={80}
                style={{ width: '100%' }}
                size="large"
                placeholder="48"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name={['thermalPrinterSettings', 'enableLogo']}
              label="Enable Logo on Bills"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Enabled"
                unCheckedChildren="Disabled"
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item label="Shop Logo">
              <Space direction="vertical" style={{ width: '100%' }}>
                {logo ? (
                  <div style={{ marginBottom: 16 }}>
                    <Image
                      src={logo}
                      alt="Shop Logo"
                      style={{ maxWidth: 200, maxHeight: 100, objectFit: 'contain' }}
                      preview={false}
                    />
                    <div style={{ marginTop: 8 }}>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={removeLogo}
                        size="small"
                      >
                        Remove Logo
                      </Button>
                    </div>
                  </div>
                ) : null}
                <Upload
                  beforeUpload={handleLogoUpload}
                  showUploadList={false}
                  accept="image/*"
                >
                  <Button icon={<UploadOutlined />}>
                    {logo ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                </Upload>
                <div style={{ color: '#999', fontSize: 12 }}>
                  Recommended: PNG or JPG, max 500KB, 200x100px
                </div>
              </Space>
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              name={['thermalPrinterSettings', 'footerText']}
              label="Footer Text"
            >
              <Input.TextArea
                placeholder="Thank You! Visit Again"
                rows={2}
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: 'permissions',
      label: (
        <Space>
          <SettingOutlined />
          Permissions
        </Space>
      ),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Alert
              message="Default User Permissions"
              description="Configure default permissions for cashier users"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name={['defaultPermissions', 'userCanEditPrice']}
              label="Can Edit Price"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Allowed"
                unCheckedChildren="Not Allowed"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name={['defaultPermissions', 'userCanGiveDiscount']}
              label="Can Give Discount"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Allowed"
                unCheckedChildren="Not Allowed"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name={['defaultPermissions', 'maxUserDiscount']}
              label="Max Discount %"
              dependencies={[['defaultPermissions', 'userCanGiveDiscount']]}
            >
              <InputNumber
                min={0}
                max={100}
                style={{ width: '100%' }}
                size="large"
                placeholder="10"
                suffix="%"
              />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          Business Settings
        </h1>
        <p style={{ color: '#666', fontSize: 14 }}>
          Configure your business information, billing, and printer settings
        </p>
      </div>

      <Card loading={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            billPrefix: 'BILL',
            billStartNumber: 1,
            currentBillNo: 0,
            gstEnabled: false,
            defaultGstPercent: 5,
            thermalPrinterSettings: {
              printerName: 'ThermalPrinter',
              paperWidth: 48,
              enableLogo: false,
              footerText: 'Thank You! Visit Again',
            },
            defaultPermissions: {
              userCanEditPrice: false,
              userCanGiveDiscount: true,
              maxUserDiscount: 10,
            },
          }}
        >
          <Tabs
            defaultActiveKey="business"
            items={items}
            tabPosition="top"
            type="card"
          />

          <Divider />

          <Row justify="end">
            <Col>
              <Space>
                <Button size="large" onClick={() => form.resetFields()}>
                  Reset
                </Button>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={saving}
                  icon={<SaveOutlined />}
                >
                  Save Settings
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>
    </Layout>
  );
};

export default BusinessSettings;
