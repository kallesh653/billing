import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Space,
  message,
  List,
  Modal,
  Typography,
  Row,
  Col,
  Divider,
  Upload
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  GlobalOutlined,
  PictureOutlined
} from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Title, Text } = Typography;

function HomepageManager() {
  const [form] = Form.useForm();
  const [slideForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [homepageData, setHomepageData] = useState(null);
  const [slideModalVisible, setSlideModalVisible] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);

  useEffect(() => {
    fetchHomepageData();
  }, []);

  const fetchHomepageData = async () => {
    try {
      const response = await api.get('/company-profile');
      if (response.data.success) {
        setHomepageData(response.data.data.homepage || {});
        form.setFieldsValue(response.data.data.homepage || {});
      }
    } catch (error) {
      message.error('Failed to fetch homepage data');
    }
  };

  const handleUpdateHeroSection = async (values) => {
    try {
      setLoading(true);
      const response = await api.put('/company-profile/homepage', {
        heroTitle: values.heroTitle,
        heroSubtitle: values.heroSubtitle
      });

      if (response.data.success) {
        message.success('Hero section updated successfully');
        fetchHomepageData();
      }
    } catch (error) {
      message.error('Failed to update hero section');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAboutSection = async (values) => {
    try {
      setLoading(true);
      const response = await api.put('/company-profile/homepage', {
        aboutUs: values.aboutUs,
        mission: values.mission,
        vision: values.vision
      });

      if (response.data.success) {
        message.success('About section updated successfully');
        fetchHomepageData();
      }
    } catch (error) {
      message.error('Failed to update about section');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlide = () => {
    setEditingSlide(null);
    slideForm.resetFields();
    setSlideModalVisible(true);
  };

  const handleEditSlide = (slide, index) => {
    setEditingSlide({ ...slide, index });
    slideForm.setFieldsValue(slide);
    setSlideModalVisible(true);
  };

  const handleSaveSlide = async (values) => {
    try {
      setLoading(true);
      const currentSlides = homepageData?.slides || [];

      let updatedSlides;
      if (editingSlide && editingSlide.index !== undefined) {
        // Edit existing slide
        updatedSlides = [...currentSlides];
        updatedSlides[editingSlide.index] = values;
      } else {
        // Add new slide
        updatedSlides = [...currentSlides, values];
      }

      const response = await api.put('/company-profile/homepage', {
        slides: updatedSlides
      });

      if (response.data.success) {
        message.success(editingSlide ? 'Slide updated successfully' : 'Slide added successfully');
        setSlideModalVisible(false);
        fetchHomepageData();
      }
    } catch (error) {
      message.error('Failed to save slide');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlide = async (index) => {
    try {
      const currentSlides = homepageData?.slides || [];
      const updatedSlides = currentSlides.filter((_, i) => i !== index);

      const response = await api.put('/company-profile/homepage', {
        slides: updatedSlides
      });

      if (response.data.success) {
        message.success('Slide deleted successfully');
        fetchHomepageData();
      }
    } catch (error) {
      message.error('Failed to delete slide');
    }
  };

  const gradientOptions = [
    { value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', label: 'Purple Gradient' },
    { value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', label: 'Pink Gradient' },
    { value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', label: 'Blue Gradient' },
    { value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', label: 'Green Gradient' },
    { value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', label: 'Sunset Gradient' },
    { value: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', label: 'Ocean Gradient' }
  ];

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <GlobalOutlined style={{ fontSize: 24, color: '#667eea' }} />
              <span>Homepage Management</span>
            </div>
          }
        >
          <Tabs defaultActiveKey="1">
            {/* Hero Section Tab */}
            <TabPane tab="Hero Section" key="1">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdateHeroSection}
                initialValues={homepageData}
              >
                <Title level={4}>Hero Section Content</Title>
                <Text type="secondary">
                  This content appears in the main banner of your homepage
                </Text>
                <Divider />

                <Form.Item
                  label="Hero Title"
                  name="heroTitle"
                  rules={[{ required: true, message: 'Please enter hero title' }]}
                >
                  <Input
                    size="large"
                    placeholder="Manage Your Business with Ease"
                    maxLength={100}
                  />
                </Form.Item>

                <Form.Item
                  label="Hero Subtitle"
                  name="heroSubtitle"
                  rules={[{ required: true, message: 'Please enter hero subtitle' }]}
                >
                  <TextArea
                    rows={3}
                    placeholder="Complete business management solution with sales, purchases, inventory, and professional invoicing"
                    maxLength={300}
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={loading}
                    size="large"
                  >
                    Save Hero Section
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>

            {/* Carousel Slides Tab */}
            <TabPane tab="Carousel Slides" key="2">
              <div style={{ marginBottom: 16 }}>
                <Row justify="space-between" align="middle">
                  <Col>
                    <Title level={4} style={{ margin: 0 }}>Manage Carousel Slides</Title>
                    <Text type="secondary">Add, edit, or remove slides from the homepage carousel</Text>
                  </Col>
                  <Col>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAddSlide}
                      size="large"
                    >
                      Add New Slide
                    </Button>
                  </Col>
                </Row>
              </div>
              <Divider />

              <List
                dataSource={homepageData?.slides || []}
                locale={{ emptyText: 'No slides added yet. Click "Add New Slide" to create one.' }}
                renderItem={(slide, index) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEditSlide(slide, index)}
                      >
                        Edit
                      </Button>,
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          Modal.confirm({
                            title: 'Delete Slide',
                            content: 'Are you sure you want to delete this slide?',
                            onOk: () => handleDeleteSlide(index)
                          });
                        }}
                      >
                        Delete
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 60,
                            height: 60,
                            background: slide.image || '#667eea',
                            borderRadius: 8
                          }}
                        />
                      }
                      title={slide.title}
                      description={slide.subtitle}
                    />
                  </List.Item>
                )}
              />
            </TabPane>

            {/* About Section Tab */}
            <TabPane tab="About Section" key="3">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdateAboutSection}
                initialValues={homepageData}
              >
                <Title level={4}>About Us Section</Title>
                <Text type="secondary">
                  Tell visitors about your company, mission, and vision
                </Text>
                <Divider />

                <Form.Item
                  label="About Us"
                  name="aboutUs"
                  tooltip="Describe what your company does"
                >
                  <TextArea
                    rows={5}
                    placeholder="We are a leading provider of business management solutions..."
                    maxLength={1000}
                  />
                </Form.Item>

                <Form.Item
                  label="Mission Statement"
                  name="mission"
                  tooltip="Your company's mission"
                >
                  <TextArea
                    rows={3}
                    placeholder="Our mission is to empower businesses with innovative tools..."
                    maxLength={500}
                  />
                </Form.Item>

                <Form.Item
                  label="Vision Statement"
                  name="vision"
                  tooltip="Your company's vision for the future"
                >
                  <TextArea
                    rows={3}
                    placeholder="Our vision is to become the #1 business management platform..."
                    maxLength={500}
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={loading}
                    size="large"
                  >
                    Save About Section
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>

            {/* SEO Settings Tab */}
            <TabPane tab="SEO & Meta" key="4">
              <Title level={4}>SEO Settings</Title>
              <Text type="secondary">
                Optimize your homepage for search engines
              </Text>
              <Divider />

              <Form layout="vertical">
                <Form.Item
                  label="Meta Title"
                  name="metaTitle"
                  tooltip="Title that appears in search results"
                >
                  <Input
                    placeholder="Company Management System - Business Solution"
                    maxLength={60}
                  />
                </Form.Item>

                <Form.Item
                  label="Meta Description"
                  name="metaDescription"
                  tooltip="Description that appears in search results"
                >
                  <TextArea
                    rows={3}
                    placeholder="Professional business management software with invoicing, inventory, and sales tracking"
                    maxLength={160}
                  />
                </Form.Item>

                <Form.Item
                  label="Meta Keywords"
                  name="metaKeywords"
                  tooltip="Comma-separated keywords"
                >
                  <Input placeholder="business management, invoicing, inventory, sales, CRM" />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" icon={<SaveOutlined />} size="large">
                    Save SEO Settings
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>
          </Tabs>
        </Card>

        {/* Slide Modal */}
        <Modal
          title={editingSlide ? 'Edit Slide' : 'Add New Slide'}
          open={slideModalVisible}
          onCancel={() => setSlideModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={slideForm}
            layout="vertical"
            onFinish={handleSaveSlide}
          >
            <Form.Item
              label="Slide Title"
              name="title"
              rules={[{ required: true, message: 'Please enter slide title' }]}
            >
              <Input
                placeholder="Transform Your Business"
                size="large"
                maxLength={100}
              />
            </Form.Item>

            <Form.Item
              label="Slide Subtitle"
              name="subtitle"
              rules={[{ required: true, message: 'Please enter slide subtitle' }]}
            >
              <TextArea
                rows={3}
                placeholder="Complete business management solution for modern enterprises"
                maxLength={200}
              />
            </Form.Item>

            <Form.Item
              label="Background Gradient"
              name="image"
              rules={[{ required: true, message: 'Please select a background' }]}
            >
              <Input.Group>
                <Row gutter={[8, 8]}>
                  {gradientOptions.map((gradient, index) => (
                    <Col span={12} key={index}>
                      <div
                        onClick={() => slideForm.setFieldsValue({ image: gradient.value })}
                        style={{
                          height: 80,
                          background: gradient.value,
                          borderRadius: 8,
                          cursor: 'pointer',
                          border: slideForm.getFieldValue('image') === gradient.value ? '3px solid #667eea' : '2px solid #e8e8e8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: 12,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {gradient.label}
                      </div>
                    </Col>
                  ))}
                </Row>
              </Input.Group>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                >
                  {editingSlide ? 'Update Slide' : 'Add Slide'}
                </Button>
                <Button onClick={() => setSlideModalVisible(false)}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
}

export default HomepageManager;
