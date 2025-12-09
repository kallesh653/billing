import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Upload,
  message,
  Row,
  Col,
  Switch,
  Select,
  InputNumber,
  ColorPicker,
  Divider
} from 'antd';
import {
  UploadOutlined,
  SaveOutlined,
  BankOutlined,
  SettingOutlined,
  FileTextOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

function CompanyProfile() {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [companyForm] = Form.useForm();
  const [invoiceForm] = Form.useForm();
  const [taxForm] = Form.useForm();
  const [bankForm] = Form.useForm();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/company-profile');
      if (response.data.success) {
        const data = response.data.data;
        setProfileData(data);

        // Set form values
        companyForm.setFieldsValue(data);
        invoiceForm.setFieldsValue(data.invoiceSettings || {});
        taxForm.setFieldsValue(data.taxSettings || {});
        bankForm.setFieldsValue(data.bankDetails || {});
      }
    } catch (error) {
      message.error('Failed to fetch company profile');
    }
  };

  const handleCompanyUpdate = async (values) => {
    setLoading(true);
    try {
      const response = await api.put('/company-profile', values);
      if (response.data.success) {
        message.success('Company profile updated successfully');
        fetchProfile();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update profile');
    }
    setLoading(false);
  };

  const handleInvoiceSettingsUpdate = async (values) => {
    setLoading(true);
    try {
      const response = await api.put('/company-profile/invoice-settings', values);
      if (response.data.success) {
        message.success('Invoice settings updated successfully');
        fetchProfile();
      }
    } catch (error) {
      message.error('Failed to update invoice settings');
    }
    setLoading(false);
  };

  const handleTaxSettingsUpdate = async (values) => {
    setLoading(true);
    try {
      const response = await api.put('/company-profile/tax-settings', values);
      if (response.data.success) {
        message.success('Tax settings updated successfully');
        fetchProfile();
      }
    } catch (error) {
      message.error('Failed to update tax settings');
    }
    setLoading(false);
  };

  const handleBankDetailsUpdate = async (values) => {
    setLoading(true);
    try {
      const response = await api.put('/company-profile', { bankDetails: values });
      if (response.data.success) {
        message.success('Bank details updated successfully');
        fetchProfile();
      }
    } catch (error) {
      message.error('Failed to update bank details');
    }
    setLoading(false);
  };

  const handleLogoUpload = async (info) => {
    if (info.file.status === 'done') {
      message.success('Logo uploaded successfully');
      fetchProfile();
    } else if (info.file.status === 'error') {
      message.error('Logo upload failed');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '24px' }}>Company Profile & Settings</h2>

      <Card>
        <Tabs defaultActiveKey="1" type="card">
          {/* Company Information Tab */}
          <TabPane
            tab={
              <span>
                <BankOutlined />
                Company Information
              </span>
            }
            key="1"
          >
            <Form
              form={companyForm}
              layout="vertical"
              onFinish={handleCompanyUpdate}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="companyName"
                    label="Company Name"
                    rules={[{ required: true, message: 'Please enter company name' }]}
                  >
                    <Input placeholder="Company Name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="tagline" label="Tagline">
                    <Input placeholder="Company Tagline" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="email" label="Email">
                    <Input type="email" placeholder="Email" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="phone" label="Phone">
                    <Input placeholder="Phone Number" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="alternatePhone" label="Alternate Phone">
                    <Input placeholder="Alternate Phone" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="website" label="Website">
                    <Input placeholder="Website URL" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="gstNumber" label="GST Number">
                    <Input placeholder="GST Number" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="panNumber" label="PAN Number">
                    <Input placeholder="PAN Number" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="cinNumber" label="CIN Number">
                <Input placeholder="CIN Number" />
              </Form.Item>

              <Divider>Address</Divider>

              <Form.Item name={['address', 'addressLine1']} label="Address Line 1">
                <Input placeholder="Address Line 1" />
              </Form.Item>

              <Form.Item name={['address', 'addressLine2']} label="Address Line 2">
                <Input placeholder="Address Line 2" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name={['address', 'city']} label="City">
                    <Input placeholder="City" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name={['address', 'state']} label="State">
                    <Input placeholder="State" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name={['address', 'pincode']} label="Pincode">
                    <Input placeholder="Pincode" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider>Branding Colors</Divider>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name={['branding', 'primaryColor']} label="Primary Color">
                    <Input type="color" defaultValue="#667eea" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name={['branding', 'secondaryColor']} label="Secondary Color">
                    <Input type="color" defaultValue="#764ba2" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name={['branding', 'accentColor']} label="Accent Color">
                    <Input type="color" defaultValue="#f093fb" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  Save Company Information
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* Invoice Settings Tab */}
          <TabPane
            tab={
              <span>
                <FileTextOutlined />
                Invoice Settings
              </span>
            }
            key="2"
          >
            <Form
              form={invoiceForm}
              layout="vertical"
              onFinish={handleInvoiceSettingsUpdate}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="defaultPrefix" label="Invoice Prefix" initialValue="INV">
                    <Input placeholder="INV" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="defaultTemplate" label="Default Template" initialValue="Classic">
                    <Select>
                      <Option value="Classic">Classic</Option>
                      <Option value="Modern">Modern</Option>
                      <Option value="Minimal">Minimal</Option>
                      <Option value="Professional">Professional</Option>
                      <Option value="Colorful">Colorful</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Divider>Display Options</Divider>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="showLogo" label="Show Logo" valuePropName="checked" initialValue={true}>
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="showGST" label="Show GST" valuePropName="checked" initialValue={true}>
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="showBankDetails" label="Show Bank Details" valuePropName="checked" initialValue={true}>
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="showQRCode" label="Show QR Code" valuePropName="checked" initialValue={false}>
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="showSignature" label="Show Signature" valuePropName="checked" initialValue={false}>
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="showFooter" label="Show Footer" valuePropName="checked" initialValue={true}>
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="authorizedSignatory" label="Authorized Signatory Name">
                <Input placeholder="Name of authorized signatory" />
              </Form.Item>

              <Form.Item name="defaultTerms" label="Default Terms & Conditions">
                <TextArea
                  rows={4}
                  placeholder="Enter default terms and conditions for invoices"
                  defaultValue="1. Payment is due within 15 days\n2. Please make cheque payable to company name\n3. Goods once sold will not be taken back"
                />
              </Form.Item>

              <Form.Item name="defaultNotes" label="Default Notes">
                <TextArea rows={3} placeholder="Default notes for invoices" />
              </Form.Item>

              <Form.Item name="footerText" label="Footer Text">
                <Input placeholder="Footer text to appear on invoices" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  Save Invoice Settings
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* Tax Settings Tab */}
          <TabPane
            tab={
              <span>
                <SettingOutlined />
                Tax Settings
              </span>
            }
            key="3"
          >
            <Form
              form={taxForm}
              layout="vertical"
              onFinish={handleTaxSettingsUpdate}
            >
              <Form.Item name="gstEnabled" label="GST Enabled" valuePropName="checked" initialValue={true}>
                <Switch />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="defaultTaxRate" label="Default Tax Rate (%)" initialValue={18}>
                    <InputNumber style={{ width: '100%' }} min={0} max={100} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="isComposite" label="Composite Scheme" valuePropName="checked" initialValue={false}>
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="cgstRate" label="CGST Rate (%)" initialValue={9}>
                    <InputNumber style={{ width: '100%' }} min={0} max={100} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="sgstRate" label="SGST Rate (%)" initialValue={9}>
                    <InputNumber style={{ width: '100%' }} min={0} max={100} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="igstRate" label="IGST Rate (%)" initialValue={18}>
                    <InputNumber style={{ width: '100%' }} min={0} max={100} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="compositeRate" label="Composite Rate (%)" initialValue={1}>
                <InputNumber style={{ width: '100%' }} min={0} max={100} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  Save Tax Settings
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* Bank Details Tab */}
          <TabPane
            tab={
              <span>
                <BankOutlined />
                Bank Details
              </span>
            }
            key="4"
          >
            <Form
              form={bankForm}
              layout="vertical"
              onFinish={handleBankDetailsUpdate}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="bankName" label="Bank Name">
                    <Input placeholder="Bank Name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="branchName" label="Branch Name">
                    <Input placeholder="Branch Name" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="accountNumber" label="Account Number">
                    <Input placeholder="Account Number" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="accountHolderName" label="Account Holder Name">
                    <Input placeholder="Account Holder Name" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="ifscCode" label="IFSC Code">
                    <Input placeholder="IFSC Code" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="upiId" label="UPI ID">
                    <Input placeholder="UPI ID" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  Save Bank Details
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}

export default CompanyProfile;
