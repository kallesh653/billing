import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Row, Col, Typography, Space, Statistic, Carousel } from 'antd';
import {
  LoginOutlined,
  RocketOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { Title, Paragraph, Text } = Typography;

function Homepage() {
  const navigate = useNavigate();
  const [companyInfo, setCompanyInfo] = useState(null);
  const carouselRef = useRef(null);

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const response = await api.get('/company-profile/public');
      if (response.data.success) {
        setCompanyInfo(response.data.data);
      }
    } catch (error) {
      console.log('Company info not available');
    }
  };

  const carouselSlides = companyInfo?.homepage?.slides || [
    {
      title: 'Transform Your Business',
      subtitle: 'Complete business management solution for modern enterprises',
      image: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: 'Professional Invoicing',
      subtitle: 'Create beautiful invoices in seconds with our advanced PDF generation',
      image: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      title: 'Real-time Inventory',
      subtitle: 'Track your stock levels and get instant alerts on low inventory',
      image: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ];

  const features = [
    {
      icon: <ShoppingCartOutlined style={{ fontSize: 40, color: '#667eea' }} />,
      title: 'Sales Management',
      description: 'Complete sales tracking with professional invoicing and real-time inventory updates'
    },
    {
      icon: <FileTextOutlined style={{ fontSize: 40, color: '#764ba2' }} />,
      title: 'Professional Invoicing',
      description: 'Generate beautiful, customizable invoices with PDF export and email delivery'
    },
    {
      icon: <DollarOutlined style={{ fontSize: 40, color: '#f093fb' }} />,
      title: 'Purchase Tracking',
      description: 'Manage suppliers, track purchases, and maintain complete purchase history'
    },
    {
      icon: <TeamOutlined style={{ fontSize: 40, color: '#667eea' }} />,
      title: 'Customer Management',
      description: 'Maintain detailed customer records with credit limits and outstanding tracking'
    },
    {
      icon: <ThunderboltOutlined style={{ fontSize: 40, color: '#764ba2' }} />,
      title: 'Real-time Inventory',
      description: 'Track stock levels, get low stock alerts, and manage inventory effortlessly'
    },
    {
      icon: <SafetyOutlined style={{ fontSize: 40, color: '#f093fb' }} />,
      title: 'Secure & Reliable',
      description: 'Role-based access control with data encryption and regular backups'
    }
  ];

  const stats = [
    { title: 'Fast Setup', value: '5', suffix: 'min', icon: <RocketOutlined /> },
    { title: 'User Friendly', value: '100', suffix: '%', icon: <CheckCircleOutlined /> },
    { title: 'Support', value: '24/7', icon: <SafetyOutlined /> }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      {/* Navbar */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '16px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            background: 'white',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: 20,
            color: '#667eea'
          }}>
            {companyInfo?.companyName?.charAt(0) || 'C'}
          </div>
          <Text style={{ color: 'white', fontSize: 24, fontWeight: 700 }}>
            {companyInfo?.companyName || 'Company Management System'}
          </Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<LoginOutlined />}
          onClick={() => navigate('/login')}
          style={{
            background: 'white',
            color: '#667eea',
            border: 'none',
            fontWeight: 600,
            height: 44,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          Login / Sign Up
        </Button>
      </div>

      {/* Image Carousel Slider */}
      <div style={{ position: 'relative' }}>
        <Carousel
          ref={carouselRef}
          autoplay
          autoplaySpeed={5000}
          effect="fade"
          dots={{ className: 'custom-carousel-dots' }}
        >
          {carouselSlides.map((slide, index) => (
            <div key={index}>
              <div style={{
                height: '500px',
                background: slide.image || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Animated background pattern */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)',
                  animation: 'pulse 3s ease-in-out infinite'
                }} />

                <div style={{
                  textAlign: 'center',
                  color: 'white',
                  zIndex: 1,
                  maxWidth: 900,
                  padding: '0 24px'
                }}>
                  <Title level={1} style={{
                    color: 'white',
                    fontSize: 56,
                    marginBottom: 24,
                    fontWeight: 700,
                    textShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}>
                    {slide.title}
                  </Title>
                  <Paragraph style={{
                    color: 'rgba(255,255,255,0.95)',
                    fontSize: 22,
                    marginBottom: 40,
                    textShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    {slide.subtitle}
                  </Paragraph>
                  <Space size="large">
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => navigate('/login')}
                      style={{
                        background: 'white',
                        color: '#667eea',
                        border: 'none',
                        height: 50,
                        fontSize: 18,
                        fontWeight: 600,
                        paddingLeft: 40,
                        paddingRight: 40,
                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                      }}
                    >
                      Get Started Free
                    </Button>
                    <Button
                      size="large"
                      onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: '2px solid white',
                        height: 50,
                        fontSize: 18,
                        fontWeight: 600,
                        paddingLeft: 40,
                        paddingRight: 40
                      }}
                    >
                      Learn More
                    </Button>
                  </Space>
                </div>
              </div>
            </div>
          ))}
        </Carousel>

        {/* Custom carousel navigation arrows */}
        <Button
          onClick={() => carouselRef.current?.prev()}
          icon={<LeftOutlined />}
          size="large"
          style={{
            position: 'absolute',
            left: 24,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            background: 'rgba(255,255,255,0.9)',
            border: 'none',
            width: 50,
            height: 50,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        />
        <Button
          onClick={() => carouselRef.current?.next()}
          icon={<RightOutlined />}
          size="large"
          style={{
            position: 'absolute',
            right: 24,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            background: 'rgba(255,255,255,0.9)',
            border: 'none',
            width: 50,
            height: 50,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        />
      </div>

      {/* Custom carousel styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .custom-carousel-dots li button {
          background: rgba(255, 255, 255, 0.5) !important;
          width: 12px !important;
          height: 12px !important;
          border-radius: 50% !important;
        }

        .custom-carousel-dots li.slick-active button {
          background: white !important;
          width: 40px !important;
          border-radius: 6px !important;
        }
      `}</style>

      {/* Stats Section */}
      <div style={{
        background: 'white',
        padding: '40px 48px',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
      }}>
        <Row gutter={[32, 32]} justify="center">
          {stats.map((stat, index) => (
            <Col key={index} xs={24} sm={8} md={8}>
              <Card
                bordered={false}
                style={{
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
                  borderRadius: 12
                }}
              >
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  suffix={stat.suffix}
                  prefix={stat.icon}
                  valueStyle={{ color: '#667eea', fontSize: 32, fontWeight: 700 }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Features Section */}
      <div id="features" style={{ padding: '80px 48px', background: '#f5f7fa' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <Title level={2} style={{ fontSize: 42, marginBottom: 16 }}>
              Powerful Features
            </Title>
            <Paragraph style={{ fontSize: 18, color: '#666', maxWidth: 600, margin: '0 auto' }}>
              Everything you need to run your business efficiently and professionally
            </Paragraph>
          </div>

          <Row gutter={[32, 32]}>
            {features.map((feature, index) => (
              <Col key={index} xs={24} sm={12} md={8}>
                <Card
                  bordered={false}
                  hoverable
                  style={{
                    height: '100%',
                    borderRadius: 16,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease'
                  }}
                  bodyStyle={{ padding: 32 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(102,126,234,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      marginBottom: 20,
                      padding: 20,
                      background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                      borderRadius: 12,
                      display: 'inline-block'
                    }}>
                      {feature.icon}
                    </div>
                    <Title level={4} style={{ marginBottom: 12 }}>
                      {feature.title}
                    </Title>
                    <Paragraph style={{ color: '#666', margin: 0 }}>
                      {feature.description}
                    </Paragraph>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* About Section */}
      {companyInfo?.homepage?.aboutUs && (
        <div style={{ padding: '80px 48px', background: 'white' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Row gutter={[48, 48]} align="middle">
              <Col xs={24} md={12}>
                <Title level={2} style={{ fontSize: 42, marginBottom: 24 }}>
                  About Us
                </Title>
                <Paragraph style={{ fontSize: 16, color: '#666', lineHeight: 1.8 }}>
                  {companyInfo.homepage.aboutUs}
                </Paragraph>
                {companyInfo.homepage.mission && (
                  <>
                    <Title level={4} style={{ marginTop: 32, marginBottom: 12 }}>
                      Our Mission
                    </Title>
                    <Paragraph style={{ fontSize: 16, color: '#666', lineHeight: 1.8 }}>
                      {companyInfo.homepage.mission}
                    </Paragraph>
                  </>
                )}
              </Col>
              <Col xs={24} md={12}>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 16,
                  padding: 60,
                  textAlign: 'center',
                  color: 'white'
                }}>
                  <RocketOutlined style={{ fontSize: 80, marginBottom: 20 }} />
                  <Title level={3} style={{ color: 'white', marginBottom: 12 }}>
                    Ready to Get Started?
                  </Title>
                  <Paragraph style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 24 }}>
                    Join thousands of businesses managing their operations efficiently
                  </Paragraph>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => navigate('/login')}
                    style={{
                      background: 'white',
                      color: '#667eea',
                      border: 'none',
                      height: 50,
                      fontSize: 16,
                      fontWeight: 600,
                      paddingLeft: 32,
                      paddingRight: 32
                    }}
                  >
                    Start Free Trial
                  </Button>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '80px 48px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Title level={2} style={{ color: 'white', fontSize: 42, marginBottom: 24 }}>
            Transform Your Business Today
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18, marginBottom: 40 }}>
            Start managing your sales, inventory, and customers with our powerful platform
          </Paragraph>
          <Button
            type="primary"
            size="large"
            icon={<LoginOutlined />}
            onClick={() => navigate('/login')}
            style={{
              background: 'white',
              color: '#667eea',
              border: 'none',
              height: 56,
              fontSize: 18,
              fontWeight: 600,
              paddingLeft: 48,
              paddingRight: 48,
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
            }}
          >
            Get Started Now
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        background: '#1a1a2e',
        padding: '40px 48px',
        color: 'white'
      }}>
        <Row gutter={[32, 32]}>
          <Col xs={24} md={8}>
            <Title level={4} style={{ color: 'white', marginBottom: 16 }}>
              {companyInfo?.companyName || 'Company Management System'}
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.7)' }}>
              {companyInfo?.tagline || 'Your complete business management solution'}
            </Paragraph>
          </Col>
          <Col xs={24} md={8}>
            <Title level={5} style={{ color: 'white', marginBottom: 16 }}>
              Contact
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              Email: {companyInfo?.email || 'info@company.com'}<br />
              Phone: {companyInfo?.phone || '+91 1234567890'}
            </Paragraph>
          </Col>
          <Col xs={24} md={8}>
            <Title level={5} style={{ color: 'white', marginBottom: 16 }}>
              Quick Links
            </Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a onClick={() => navigate('/login')} style={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                Login
              </a>
              <a onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} style={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                Features
              </a>
            </div>
          </Col>
        </Row>
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          marginTop: 32,
          paddingTop: 24,
          textAlign: 'center',
          color: 'rgba(255,255,255,0.5)'
        }}>
          © 2025 {companyInfo?.companyName || 'Company Management System'}. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default Homepage;
