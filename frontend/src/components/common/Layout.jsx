import { useState } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button, Badge, Tag, Space } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  ShopOutlined,
  AppstoreOutlined,
  InboxOutlined,
  TeamOutlined,
  SettingOutlined,
  StockOutlined,
  CrownOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const { Header, Sider, Content } = AntLayout;

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const adminMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/masters/subcodes',
      icon: <AppstoreOutlined />,
      label: 'Products',
    },
    {
      key: 'contacts',
      icon: <TeamOutlined />,
      label: 'Contacts',
      children: [
        { key: '/masters/customers', label: 'Customers' },
        { key: '/masters/suppliers', label: 'Suppliers' },
        { key: '/masters/users', label: 'Users' },
      ],
    },
    {
      key: 'sales',
      icon: <FileTextOutlined />,
      label: 'Sales & Invoices',
      children: [
        { key: '/invoices', label: 'Invoice Management' },
        { key: '/invoices/create', label: 'Create Invoice' },
        { key: '/billing/take-order', label: 'Quick Sale (POS)' },
        { key: '/billing/view-bills', label: 'View Bills' },
      ],
    },
    {
      key: 'purchase',
      icon: <InboxOutlined />,
      label: 'Purchase',
      children: [
        { key: '/purchase/add', label: 'Add Purchase' },
        { key: '/purchase/view', label: 'View Purchases' },
      ],
    },
    {
      key: '/stock',
      icon: <StockOutlined />,
      label: 'Inventory',
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
      children: [
        { key: '/reports/sales', label: 'Sales Report' },
        { key: '/reports/itemwise', label: 'Item-wise Sales' },
        { key: '/reports/userwise', label: 'User-wise Sales' },
        { key: '/reports/daily-collection', label: 'Daily Collection' },
        { key: '/reports/purchases', label: 'Purchase Summary' },
        { key: '/reports/stock', label: 'Stock Report' },
        { key: '/reports/profit', label: 'Profit Report' },
        { key: '/reports/suppliers', label: 'Supplier Report' },
      ],
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      children: [
        { key: '/settings', label: 'Business Settings' },
        { key: '/settings/company', label: 'Company Profile' },
        { key: '/settings/homepage', label: 'Homepage Manager' },
      ],
    },
  ];

  const userMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'sales',
      icon: <FileTextOutlined />,
      label: 'Sales',
      children: [
        { key: '/invoices', label: 'Invoices' },
        { key: '/invoices/create', label: 'New Invoice' },
        { key: '/billing/take-order', label: 'Quick Sale' },
        { key: '/billing/view-bills', label: 'My Bills' },
      ],
    },
    {
      key: '/reports/daily-collection',
      icon: <BarChartOutlined />,
      label: 'Daily Collection',
    },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: (
          <div style={{ padding: '8px 0' }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#262626' }}>{user?.name}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
              {user?.username}
            </div>
          </div>
        ),
        disabled: true
      },
      {
        type: 'divider'
      },
      {
        key: 'logout',
        icon: <LogoutOutlined style={{ color: '#ff4d4f' }} />,
        label: <span style={{ color: '#ff4d4f', fontWeight: 600 }}>Logout</span>,
        onClick: logout,
      },
    ],
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        style={{
          boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
          borderRight: '1px solid #f0f0f0'
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderBottom: '3px solid #5a67d8',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none'
          }} />
          <img
            src="/logo.jpeg"
            alt="Logo"
            style={{
              width: collapsed ? 28 : 36,
              height: collapsed ? 28 : 36,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              position: 'relative',
              zIndex: 1,
              borderRadius: 6,
              objectFit: 'cover'
            }}
          />
          {!collapsed && (
            <span style={{
              marginLeft: 12,
              fontSize: 20,
              fontWeight: 700,
              color: 'white',
              letterSpacing: '1px',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              position: 'relative',
              zIndex: 1
            }}>
              Company
            </span>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>

      <AntLayout>
        <Header
          style={{
            padding: '0 24px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.12)',
            borderBottom: '2px solid rgba(102, 126, 234, 0.1)',
            height: 64,
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: 18,
              width: 64,
              height: 64,
              color: '#667eea',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          />

          <Space size="large" style={{ display: 'flex', alignItems: 'center' }}>
            <Tag
              icon={user?.role === 'admin' ? <CrownOutlined /> : <TeamOutlined />}
              color={user?.role === 'admin' ? 'gold' : 'green'}
              style={{
                fontSize: 14,
                padding: '6px 16px',
                fontWeight: 600,
                borderRadius: 20,
                border: 'none',
                boxShadow: user?.role === 'admin'
                  ? '0 2px 8px rgba(250, 173, 20, 0.3)'
                  : '0 2px 8px rgba(82, 196, 26, 0.3)',
                background: user?.role === 'admin'
                  ? 'linear-gradient(135deg, #ffd666 0%, #faad14 100%)'
                  : 'linear-gradient(135deg, #95de64 0%, #52c41a 100%)',
                color: 'white',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {user?.role === 'admin' ? 'Administrator' : 'Cashier'}
            </Tag>

            <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
              <Avatar
                size={48}
                style={{
                  backgroundColor: 'transparent',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  border: '3px solid white',
                  transition: 'all 0.3s ease'
                }}
                icon={<UserOutlined style={{ fontSize: 22 }} />}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }}
              />
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: '24px',
            padding: 24,
            background: '#f0f2f5',
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
