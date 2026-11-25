/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable react-hooks/set-state-in-effect */

/* eslint-disable react-hooks/immutability */

import {
  ApartmentOutlined,
  BankOutlined,
  CloseOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  LockOutlined,
  LogoutOutlined,
  MailOutlined,
  MenuOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { HospitalTenant } from '@/types/api';
import {
  App,
  Avatar,
  Badge,
  Button,
  Drawer,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { apiClient } from '@/shared/api/client';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { ROUTES } from '@/app/routes';

const { Text } = Typography;
const { Option } = Select;

interface TenantAdmin {
  tenant_id: string;
  tenant_code: string;
  tenant_name: string;
  database_name: string;
  admin_id: string | null;
  admin_name?: string | null;
  username: string | null;
  admin_status: 'ACTIVE' | 'INACTIVE' | null;
  phone?: string | null;
  admin_role?: string | null;
}

interface Tenant {
  id: string;
  tenant_code: string;
  tenant_name: string;
  database_name: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface MasterDashboardProps {
  defaultTab?: 'tenants' | 'hospitals' | 'admins' | 'admin_users';
}

export function MasterDashboard({ defaultTab = 'tenants' }: MasterDashboardProps = {}) {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();

  useEffect(() => {
    if (!localStorage.getItem('hms_master_auth')) navigate(ROUTES.masterLogin);
  }, [navigate]);

  const [activeTab, setActiveTab] = useState<'tenants' | 'hospitals' | 'admins' | 'admin_users'>(
    defaultTab || 'tenants',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200,
  );
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  );

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      if (width < 768) {
        setIsSidebarOpen(false);
      } else if (width < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, filterStatus]);

  // Hospital Tenants state (dedicated 9-column CRUD)
  const [hospitalTenants, setHospitalTenants] = useState<HospitalTenant[]>([]);
  const [hospitalTenantsLoading, setHospitalTenantsLoading] = useState(false);
  const [isCreateTenantDrawerOpen, setIsCreateTenantDrawerOpen] = useState(false);
  const [isEditTenantDrawerOpen, setIsEditTenantDrawerOpen] = useState(false);
  const [isViewTenantDrawerOpen, setIsViewTenantDrawerOpen] = useState(false);
  const [selectedHospitalTenant, setSelectedHospitalTenant] = useState<HospitalTenant | null>(null);
  const [createTenantDrawerForm] = Form.useForm();
  const [editTenantDrawerForm] = Form.useForm();
  const [isSubmittingTenant, setIsSubmittingTenant] = useState(false);

  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [isCreateAdminDrawerOpen, setIsCreateAdminDrawerOpen] = useState(false);
  const [provisionForm] = Form.useForm();
  const [createAdminForm] = Form.useForm();
  const [editAdminForm] = Form.useForm();
  const [editTenantForm] = Form.useForm();
  const [adminUserForm] = Form.useForm();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);

  const [tenantAdmins, setTenantAdmins] = useState<TenantAdmin[]>([]);
  const [editingAdmin, setEditingAdmin] = useState<TenantAdmin | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);


  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [isAdminUserModalOpen, setIsAdminUserModalOpen] = useState(false);
  const [editingAdminUser, setEditingAdminUser] = useState<AdminUser | null>(null);
  const [auSaving, setAuSaving] = useState(false);

  const fetchAdminUsers = async () => {
    setAdminUsersLoading(true);
    try {
      const res = await apiClient.get('/master/admin-users');
      setAdminUsers(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setAdminUsersLoading(false);
    }
  };

  const openCreateAdminUser = () => {
    setEditingAdminUser(null);
    adminUserForm.resetFields();
    adminUserForm.setFieldsValue({ role: 'Viewer', status: 'ACTIVE' });
    setIsAdminUserModalOpen(true);
  };

  const openEditAdminUser = (u: AdminUser) => {
    setEditingAdminUser(u);
    adminUserForm.setFieldsValue({ name: u.name, email: u.email, role: u.role, status: u.status });
    setIsAdminUserModalOpen(true);
  };

  const handleSaveAdminUser = async (values: Record<string, any>) => {
    setAuSaving(true);
    try {
      if (editingAdminUser) {
        await apiClient.put(`/master/admin-users/${editingAdminUser.id}`, {
          name: values.name,
          email: values.email,
          role: values.role,
          status: values.status,
        });
        if (values.password?.trim().length >= 6) {
          await apiClient.put(
            `/master/admin-users/${editingAdminUser.id}/password`,
            { password: values.password }
          );
        }
      } else {
        await apiClient.post('/master/admin-users', values);
      }
      setIsAdminUserModalOpen(false);
      fetchAdminUsers();
      message.success(editingAdminUser ? 'Master user updated.' : 'Master user created.');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        message.error(err.response.data.error || 'Failed to save master user');
      } else {
        message.error('Network error');
      }
    } finally {
      setAuSaving(false);
    }
  };

  const handleDeleteAdminUser = (u: AdminUser) => {
    modal.confirm({
      title: 'Delete Master User',
      content: `Are you sure you want to remove ${u.name} (${u.email})? This cannot be undone.`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.delete(`/master/admin-users/${u.id}`);
          fetchAdminUsers();
          message.success('Master user deleted.');
        } catch {
          message.error('Failed to delete master user');
        }
      },
    });
  };

  const toggleAdminUserStatus = async (u: AdminUser) => {
    const newStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await apiClient.put(`/master/admin-users/${u.id}`, { status: newStatus });
      fetchAdminUsers();
    } catch {
      message.error('Network error');
    }
  };

  const toggleTenantAdminStatus = async (a: TenantAdmin) => {
    if (!a.admin_id) return;
    const newStatus = a.admin_status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await apiClient.put(`/master/tenant-admins/${a.admin_id}/status`, { status: newStatus });
      fetchTenantAdmins();
    } catch {
      message.error('Network error');
    }
  };

  const openCreateAdmin = () => {
    createAdminForm.resetFields();
    fetchTenants();
    fetchTenantAdmins();
    setIsCreateAdminDrawerOpen(true);
  };

  const fetchHospitalTenants = async () => {
    setHospitalTenantsLoading(true);
    try {
      const res = await apiClient.get<HospitalTenant[]>('/master/hospital-tenants');
      setHospitalTenants(res.data);
    } catch (error) {
      console.error(error);
      message.error('Failed to load hospital tenants');
    } finally {
      setHospitalTenantsLoading(false);
    }
  };

  const handleCreateHospitalTenant = async (values: Record<string, any>) => {
    setIsSubmittingTenant(true);
    try {
      await apiClient.post('/master/hospital-tenants', {
        tenant_name: values.tenant_name,
        tenant_code: values.tenant_code?.trim() || undefined,
        email: values.email?.trim() || null,
        phone: values.phone?.trim() || null,
        address_line1: values.address_line1?.trim() || null,
        address_line2: values.address_line2?.trim() || null,
        city: values.city?.trim() || null,
        state: values.state?.trim() || null,
        pincode: values.pincode?.trim() || null,
        status: values.status || 'ACTIVE',
      });
      createTenantDrawerForm.resetFields();
      setIsCreateTenantDrawerOpen(false);
      fetchHospitalTenants();
      message.success(
        values.email?.trim()
          ? 'Tenant registered successfully! Welcome email sent to ' + values.email.trim()
          : 'Tenant registered successfully!',
      );
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        message.error(err.response.data.error || 'Failed to create tenant');
      } else {
        message.error('Network error');
      }
    } finally {
      setIsSubmittingTenant(false);
    }
  };

  const handleUpdateHospitalTenant = async (values: Record<string, any>) => {
    if (!selectedHospitalTenant) return;
    setIsSubmittingTenant(true);
    try {
      await apiClient.put(`/master/hospital-tenants/${selectedHospitalTenant.id}`, {
        tenant_name: values.tenant_name,
        email: values.email?.trim() || null,
        phone: values.phone?.trim() || null,
        address_line1: values.address_line1?.trim() || null,
        address_line2: values.address_line2?.trim() || null,
        city: values.city?.trim() || null,
        state: values.state?.trim() || null,
        pincode: values.pincode?.trim() || null,
        status: values.status,
      });
      setIsEditTenantDrawerOpen(false);
      setSelectedHospitalTenant(null);
      fetchHospitalTenants();
      message.success('Tenant updated successfully!');
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        message.error(err.response.data.error || 'Failed to update tenant');
      } else {
        message.error('Network error');
      }
    } finally {
      setIsSubmittingTenant(false);
    }
  };

  const handleDeleteHospitalTenant = (tenant: HospitalTenant) => {
    modal.confirm({
      title: 'Delete Tenant',
      content: `Are you sure you want to permanently delete "${tenant.tenant_name}" (${tenant.tenant_code})? This action cannot be undone.`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.delete(`/master/hospital-tenants/${tenant.id}`);
          fetchHospitalTenants();
          message.success('Tenant deleted successfully.');
        } catch (err: any) {
          if (axios.isAxiosError(err) && err.response) {
            message.error(err.response.data.error || 'Failed to delete tenant');
          } else {
            message.error('Network error');
          }
        }
      },
    });
  };

  useEffect(() => {
    if (activeTab === 'tenants') {
      fetchHospitalTenants();
    } else if (activeTab === 'hospitals') {
      fetchTenants();
    } else if (activeTab === 'admins') {
      fetchTenantAdmins();
      fetchTenants();
    } else {
      fetchAdminUsers();
    }
    setSearchQuery('');
    setFilterStatus('ALL');
  }, [activeTab]);

  const handleLogout = () => {
    ['hms_master_auth', 'hms_master_token', 'hms_master_role', 'hms_master_name'].forEach((k) =>
      localStorage.removeItem(k),
    );
    navigate(ROUTES.masterLogin);
  };

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/master/tenants');
      setTenants(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantAdmins = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/master/tenant-admins');
      setTenantAdmins(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (values: Record<string, any>) => {
    setIsProvisioning(true);
    try {
      await apiClient.post('/master/tenants', {
        tenantName: values.tenantName,
        databaseName: values.databaseName,
        status: values.status,
      });
      provisionForm.resetFields();
      setIsProvisionModalOpen(false);
      fetchTenants();
      message.success('Hospital and Database provisioned!');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        message.error(err.response.data.error || 'Failed to create tenant');
      } else {
        message.error('Network error');
      }
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleDeleteTenant = (t: Tenant) => {
    modal.confirm({
      title: 'Delete Hospital',
      content: `Delete "${t.tenant_name}"? This will permanently drop the "${t.database_name}" database.`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.delete(`/master/tenants/${t.id}`);
          fetchTenants();
          message.success('Tenant deleted.');
        } catch (err) {
          message.error('Failed to delete tenant');
        }
      },
    });
  };

  const handleCreateAdmin = async (values: Record<string, any>) => {
    setIsCreating(true);
    try {
      await apiClient.post('/master/tenant-admins', {
        tenantId: values.tenantId,
        name: values.name,
        username: values.username,
        password: values.password,
        phone: values.phone,
        role: values.role,
        status: values.status,
      });
      createAdminForm.resetFields();
      setIsCreateAdminDrawerOpen(false);
      fetchTenantAdmins();
      message.success('Admin login created.');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        message.error(err.response.data.error || 'Failed to create admin');
      } else {
        message.error('Network error');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateAdmin = async (values: Record<string, any>) => {
    if (!editingAdmin) return;
    setIsEditing(true);
    try {
      await apiClient.put(
        `/master/tenant-admins/${editingAdmin.admin_id}`,
        {
          name: values.name,
          username: values.username,
          ...(values.password && values.password.trim().length >= 6
            ? { password: values.password }
            : {}),
          phone: values.phone,
          role: values.role,
          status: values.status,
        }
      );
      setEditingAdmin(null);
      fetchTenantAdmins();
      message.success('Admin updated.');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        message.error(err.response.data.error || 'Failed to update admin');
      } else {
        message.error('Network error');
      }
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteAdmin = (a: TenantAdmin) => {
    modal.confirm({
      title: 'Delete Admin Login',
      content: `Are you sure you want to delete the admin "${a.username}" for hospital "${a.tenant_name}"?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.delete(`/master/tenant-admins/${a.admin_id}`);
          fetchTenantAdmins();
          message.success('Admin login deleted.');
        } catch (err) {
          if (axios.isAxiosError(err) && err.response) {
            message.error(err.response.data.error || 'Failed to delete admin');
          } else {
            message.error('Network error');
          }
        }
      },
    });
  };

  const handleUpdateTenant = async (values: Record<string, any>) => {
    if (!editingTenant) return;
    setIsEditing(true);
    try {
      await apiClient.put(`/master/tenants/${editingTenant.id}`, {
        tenantName: values.tenantName,
        status: values.status,
      });
      setEditingTenant(null);
      fetchTenants();
      message.success('Hospital updated.');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        message.error(err.response.data.error || 'Failed to update tenant');
      } else {
        message.error('Network error');
      }
    } finally {
      setIsEditing(false);
    }
  };

  const hospitalOptions =
    tenants.length > 0
      ? tenants.map((t) => ({
          id: t.id,
          tenant_name: t.tenant_name,
          tenant_code: t.tenant_code,
          status: t.status,
        }))
      : Array.from(
          new Map(
            tenantAdmins.map((t) => [
              t.tenant_id,
              {
                id: t.tenant_id,
                tenant_name: t.tenant_name,
                tenant_code: t.tenant_code,
                status: 'ACTIVE' as const,
              },
            ]),
          ).values(),
        );
  const filteredHospitalTenants = hospitalTenants.filter(
    (t) =>
      (t.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tenant_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.email && t.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.phone && t.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.address && t.address.toLowerCase().includes(searchQuery.toLowerCase()))) &&
      (filterStatus === 'ALL' || t.status === filterStatus),
  );
  const filteredTenants = tenants.filter(
    (t) =>
      (t.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tenant_code.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filterStatus === 'ALL' || t.status === filterStatus),
  );
  const filteredAdmins = tenantAdmins.filter(
    (a) =>
      a.admin_id &&
      (a.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.username?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filterStatus === 'ALL' || a.admin_status === filterStatus),
  );
  const filteredAdminUsers = adminUsers.filter(
    (u) =>
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filterStatus === 'ALL' || u.status === filterStatus),
  );

  const totalItems =
    activeTab === 'tenants'
      ? filteredHospitalTenants.length
      : activeTab === 'hospitals'
        ? filteredTenants.length
        : activeTab === 'admins'
          ? filteredAdmins.length
          : filteredAdminUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const hospitalTenantColumns: ColumnsType<HospitalTenant> = [
    {
      title: 'Hospital Name',
      dataIndex: 'tenant_name',
      key: 'tenant_name',
      render: (name: string) => (
        <Space>
          <Avatar
            size={26}
            style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700, fontSize: 11 }}
          >
            {name.charAt(0).toUpperCase()}
          </Avatar>
          <Text strong style={{ fontSize: 13, color: '#0f172a' }}>
            {name}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Tenant Code',
      dataIndex: 'tenant_code',
      key: 'tenant_code',
      render: (code: string) => (
        <Tag color="cyan" style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 11 }}>
          {code}
        </Tag>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string | null) =>
        email ? (
          <a href={`mailto:${email}`} style={{ fontSize: 12, color: '#2563eb' }}>
            {email}
          </a>
        ) : (
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>—</Text>
        ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string | null) =>
        phone ? (
          <Text style={{ fontSize: 12, color: '#334155' }}>{phone}</Text>
        ) : (
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>—</Text>
        ),
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (addr: string | null) =>
        addr ? (
          <Tooltip title={addr}>
            <Text style={{ fontSize: 12, color: '#64748b' }}>{addr}</Text>
          </Tooltip>
        ) : (
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>—</Text>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: 'ACTIVE' | 'INACTIVE') => (
        <Badge
          status={status === 'ACTIVE' ? 'success' : 'error'}
          text={
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: status === 'ACTIVE' ? '#16a34a' : '#dc2626',
              }}
            >
              {status}
            </span>
          }
        />
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => (
        <Text style={{ fontSize: 11, color: '#64748b' }}>
          {new Date(v).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      ),
    },
    {
      title: 'Updated Date',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (v: string) => (
        <Text style={{ fontSize: 11, color: '#64748b' }}>
          {new Date(v).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_: any, record: HospitalTenant) => (
        <Space size={4}>
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: '#0284c7' }} />}
              onClick={() => {
                setSelectedHospitalTenant(record);
                setIsViewTenantDrawerOpen(true);
              }}
            />
          </Tooltip>
          {record.email && (
            <Tooltip title="Resend Welcome Email">
              <Button
                type="text"
                size="small"
                icon={<MailOutlined style={{ color: '#059669' }} />}
                onClick={async () => {
                  try {
                    message.loading({ content: 'Sending welcome email...', key: 'resend-mail' });
                    await apiClient.post(`/master/hospital-tenants/${record.id}/resend-welcome-email`);
                    message.success({ content: `Welcome email sent to ${record.email}`, key: 'resend-mail' });
                  } catch (err: any) {
                    message.error({
                      content: err?.response?.data?.error || 'Failed to send welcome email',
                      key: 'resend-mail',
                    });
                  }
                }}
              />
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#d97706' }} />}
              onClick={() => {
                setSelectedHospitalTenant(record);
                editTenantDrawerForm.setFieldsValue({
                  tenant_name: record.tenant_name,
                  email: record.email || '',
                  phone: record.phone || '',
                  address_line1: record.address_line1 || '',
                  address_line2: record.address_line2 || '',
                  city: record.city || '',
                  state: record.state || '',
                  pincode: record.pincode || '',
                  status: record.status,
                });
                setIsEditTenantDrawerOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDeleteHospitalTenant(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const hospitalColumns: ColumnsType<Tenant> = [
    {
      title: 'Hospital Name',
      dataIndex: 'tenant_name',
      key: 'hospital_name',
      render: (v: string) => (
        <Text strong style={{ fontSize: 13 }}>
          {v}
        </Text>
      ),
    },
    {
      title: 'Tenant Code',
      dataIndex: 'tenant_code',
      key: 'tenant_code',
      render: (v: string) => (
        <Tag color="cyan" style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 11 }}>
          {v}
        </Tag>
      ),
    },
    {
      title: 'Database',
      dataIndex: 'database_name',
      key: 'db',
      render: (v: string) => (
        <Tag
          style={{
            background: '#f1f5f9',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            fontSize: 11,
          }}
        >
          {v}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Badge
          status={v === 'ACTIVE' ? 'success' : 'error'}
          text={<span style={{ fontSize: 11, fontWeight: 600 }}>{v}</span>}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_: any, t: Tenant) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingTenant(t);
                editTenantForm.setFieldsValue({ tenantName: t.tenant_name, status: t.status });
              }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDeleteTenant(t)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const adminColumns: ColumnsType<TenantAdmin> = [
    {
      title: 'Hospital Name',
      key: 'hospital',
      render: (_: any, a: TenantAdmin) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {a.tenant_name}
          </Text>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#94a3b8' }}>
            {a.tenant_code}
          </div>
        </div>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'admin_name',
      key: 'admin_name',
      render: (v: string) => <Text style={{ fontSize: 13 }}>{v || '-'}</Text>,
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (v: string) => <Text style={{ fontSize: 13 }}>{v}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'admin_status',
      key: 'admin_status',
      render: (v: string, a: TenantAdmin) => (
        <Tag
          color={v === 'ACTIVE' ? 'green' : 'red'}
          style={{ cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
          onClick={() => toggleTenantAdminStatus(a)}
        >
          {v}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_: any, a: TenantAdmin) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingAdmin(a);
                editAdminForm.setFieldsValue({
                  name: a.admin_name,
                  username: a.username,
                  password: '',
                  phone: a.phone,
                  role: a.admin_role || 'SUPER_ADMIN',
                  status: a.admin_status || 'ACTIVE',
                });
              }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDeleteAdmin(a)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const adminUserColumns: ColumnsType<AdminUser> = [
    {
      title: 'Name',
      key: 'name',
      render: (_: any, u: AdminUser) => (
        <Space>
          <Avatar
            size={28}
            style={{ background: '#eef2ff', color: '#4f46e5', fontWeight: 700, fontSize: 11 }}
          >
            {u.name.charAt(0).toUpperCase()}
          </Avatar>
          <Text strong style={{ fontSize: 13 }}>
            {u.name}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (v: string) => <Text style={{ fontSize: 13, color: '#64748b' }}>{v}</Text>,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (v: string) => (
        <Tag color="purple" style={{ fontSize: 11, fontWeight: 600 }}>
          {v}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, u: AdminUser) => (
        <Tag
          color={u.status === 'ACTIVE' ? 'green' : 'red'}
          style={{ cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
          onClick={() => toggleAdminUserStatus(u)}
        >
          {u.status}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => (
        <Text style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(v).toLocaleDateString()}</Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_: any, u: AdminUser) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditAdminUser(u)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDeleteAdminUser(u)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const masterName = localStorage.getItem('hms_master_name') || 'Administrator';
  const masterRole = localStorage.getItem('hms_master_role') || 'Super Admin';

  const navItems = [
    { key: 'tenants' as const, icon: <ApartmentOutlined />, label: 'Tenants' },
    { key: 'hospitals' as const, icon: <BankOutlined />, label: 'Hospitals & DBs' },
    { key: 'admins' as const, icon: <LockOutlined />, label: 'Admin Logins' },
    { key: 'admin_users' as const, icon: <TeamOutlined />, label: 'Master Users' },
  ];

  const activeData =
    activeTab === 'tenants'
      ? filteredHospitalTenants
      : activeTab === 'hospitals'
        ? filteredTenants
        : activeTab === 'admins'
          ? filteredAdmins
          : filteredAdminUsers;
  const activeColumns =
    activeTab === 'tenants'
      ? (hospitalTenantColumns as any)
      : activeTab === 'hospitals'
        ? hospitalColumns
        : activeTab === 'admins'
          ? (adminColumns as any)
          : (adminUserColumns as any);
  const paginatedData = (activeData as any[]).slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const btnStyle = {
    background: '#0891b2',
    border: 'none',
    boxShadow: '0 4px 14px rgba(8,145,178,0.35)',
    fontSize: 12,
    fontWeight: 600,
  };

  const responsiveModalWidth = isMobile ? '92%' : 460;
  const responsiveDrawerWidth = isMobile ? '100%' : isTablet ? 440 : 480;
  const responsiveTenantDrawerWidth = isMobile ? '100%' : isTablet ? 460 : 520;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F8FAFC', overflow: 'hidden', position: 'relative' }}>
      {/* MOBILE BACKDROP OVERLAY */}
      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 998,
            transition: 'opacity 0.2s',
          }}
        />
      )}

      {/* SIDEBAR */}
      <aside
        style={{
          width: isMobile ? 260 : isSidebarOpen ? 256 : 80,
          background: '#fff',
          borderRight: '1px solid #e2e8f0',
          display: isMobile && !isSidebarOpen ? 'none' : 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
          transition: isMobile ? 'transform 0.25s ease' : 'width 0.25s ease',
          position: isMobile ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: isMobile ? 999 : 20,
          boxShadow: isMobile
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            : '1px 0 6px rgba(0,0,0,0.04)',
        }}
      >
        <div>
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid #f1f5f9',
              padding: '0 16px',
              justifyContent: isSidebarOpen || isMobile ? 'space-between' : 'center',
            }}
          >
            {(isSidebarOpen || isMobile) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background: '#0891b2',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  H
                </div>
                <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>HMS Master</span>
              </div>
            )}
            {isMobile ? (
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined style={{ color: '#64748b', fontSize: 16 }} />}
                onClick={() => setIsSidebarOpen(false)}
              />
            ) : (
              <Button
                type="text"
                size="small"
                icon={<MenuOutlined style={{ color: '#94a3b8' }} />}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              />
            )}
          </div>
          <div style={{ padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveTab(item.key);
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: isSidebarOpen || isMobile ? '10px 14px' : '10px 0',
                    justifyContent: isSidebarOpen || isMobile ? 'flex-start' : 'center',
                    border: 'none',
                    borderRight: isActive ? '2px solid #0891b2' : '2px solid transparent',
                    borderRadius: 0,
                    background: isActive ? '#ecfeff' : 'transparent',
                    color: isActive ? '#0891b2' : '#64748b',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    width: '100%',
                    outline: 'none',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  {(isSidebarOpen || isMobile) && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ padding: 16, borderTop: '1px solid #f1f5f9' }}>
          {isSidebarOpen || isMobile ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
                padding: '0 4px',
              }}
            >
              <Avatar
                style={{ background: '#cffafe', color: '#0891b2', fontWeight: 700, flexShrink: 0 }}
              >
                {masterName.substring(0, 2).toUpperCase()}
              </Avatar>
              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#0f172a',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {masterName}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{masterRole}</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <Tooltip title={`${masterName} (${masterRole})`}>
                <Avatar style={{ background: '#cffafe', color: '#0891b2', fontWeight: 700 }}>
                  {masterName.substring(0, 2).toUpperCase()}
                </Avatar>
              </Tooltip>
            </div>
          )}
          <Button
            type="text"
            icon={<LogoutOutlined style={{ color: '#f43f5e' }} />}
            onClick={handleLogout}
            style={{
              width: '100%',
              color: '#f43f5e',
              fontWeight: 600,
              fontSize: 13,
              justifyContent: isSidebarOpen || isMobile ? 'flex-start' : 'center',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {(isSidebarOpen || isMobile) && 'Sign Out'}
          </Button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* HEADER */}
        <header
          style={{
            background: '#fff',
            borderBottom: '1px solid #e2e8f0',
            minHeight: 56,
            padding: isMobile ? '10px 14px' : '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
            {isMobile && (
              <Button
                type="text"
                size="middle"
                icon={<MenuOutlined style={{ color: '#0f172a', fontSize: 16 }} />}
                onClick={() => setIsSidebarOpen(true)}
                style={{ padding: '4px 6px', marginLeft: -4, flexShrink: 0 }}
              />
            )}
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: isMobile ? 14 : 15, color: '#0f172a', whiteSpace: 'nowrap' }}>
              {activeTab === 'tenants'
                ? 'Tenants'
                : activeTab === 'hospitals'
                  ? 'Hospitals & DBs'
                  : activeTab === 'admins'
                    ? 'Admin Logins'
                    : 'Master Users'}
            </span>
            {!isMobile && (
              <>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <span
                  style={{
                    fontSize: 11,
                    color: '#94a3b8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {activeTab === 'tenants'
                    ? 'Manage registered hospital tenants and their information.'
                    : activeTab === 'hospitals'
                      ? 'Manage all provisioned hospital instances.'
                      : activeTab === 'admins'
                        ? 'Manage Master Admin credentials for hospitals.'
                        : 'Manage platform-level master user accounts.'}
                </span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {!isMobile && (
              <Input
                placeholder="Search..."
                prefix={<SearchOutlined style={{ color: '#94a3b8', fontSize: 13 }} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
                size="middle"
                style={{ width: isTablet ? 170 : 260, fontSize: 13 }}
              />
            )}
            {activeTab === 'tenants' && (
              <Button
                type="primary"
                size="middle"
                icon={<PlusOutlined />}
                onClick={() => {
                  createTenantDrawerForm.resetFields();
                  createTenantDrawerForm.setFieldsValue({ status: 'ACTIVE' });
                  setIsCreateTenantDrawerOpen(true);
                }}
                style={{ ...btnStyle, padding: isMobile ? '0 10px' : '0 16px' }}
              >
                {isMobile ? 'New' : 'New Tenant'}
              </Button>
            )}
            {activeTab === 'hospitals' && (
              <Button
                type="primary"
                size="middle"
                icon={<PlusOutlined />}
                onClick={() => {
                  provisionForm.resetFields();
                  provisionForm.setFieldsValue({ status: 'ACTIVE' });
                  setIsProvisionModalOpen(true);
                }}
                style={{ ...btnStyle, padding: isMobile ? '0 10px' : '0 16px' }}
              >
                {isMobile ? 'New' : 'New Hospital'}
              </Button>
            )}
            {activeTab === 'admins' && (
              <Button
                type="primary"
                size="middle"
                icon={<PlusOutlined />}
                onClick={openCreateAdmin}
                style={{ ...btnStyle, padding: isMobile ? '0 10px' : '0 16px' }}
              >
                {isMobile ? 'New' : 'New Admin'}
              </Button>
            )}
            {activeTab === 'admin_users' && (
              <Button
                type="primary"
                size="middle"
                icon={<PlusOutlined />}
                onClick={openCreateAdminUser}
                style={{ ...btnStyle, padding: isMobile ? '0 10px' : '0 16px' }}
              >
                {isMobile ? 'New' : 'New Member'}
              </Button>
            )}
          </div>
        </header>

        {/* FILTER BAR */}
        <div
          style={{
            background: '#fff',
            borderBottom: '1px solid #e2e8f0',
            padding: isMobile ? '8px 14px' : '10px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
            flexWrap: isMobile ? 'wrap' : 'nowrap',
          }}
        >
          {isMobile && (
            <div style={{ width: '100%', marginBottom: 4 }}>
              <Input
                placeholder="Search..."
                prefix={<SearchOutlined style={{ color: '#94a3b8', fontSize: 13 }} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
                size="middle"
                style={{ width: '100%', fontSize: 13 }}
              />
            </div>
          )}
          <Select
            value={filterStatus}
            onChange={(val) => setFilterStatus(val)}
            size="middle"
            style={{ width: isMobile ? 130 : 160, fontSize: 13 }}
          >
            <Option value="ALL">All Statuses</Option>
            <Option value="ACTIVE">Active</Option>
            <Option value="INACTIVE">Inactive</Option>
          </Select>
          <div style={{ flex: 1 }} />
          <Button
            type="text"
            size="middle"
            style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('ALL');
            }}
          >
            Reset
          </Button>
        </div>

        {/* TABLE */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: isMobile ? '10px 8px' : isTablet ? '16px' : '20px 24px',
            background: '#F8FAFC',
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            <Table
              columns={activeColumns}
              dataSource={paginatedData}
              rowKey={activeTab === 'admins' ? 'admin_id' : 'id'}
              loading={
                activeTab === 'tenants'
                  ? hospitalTenantsLoading
                  : activeTab === 'admin_users'
                    ? adminUsersLoading
                    : loading
              }
              size="small"
              pagination={false}
              scroll={{ x: activeTab === 'tenants' ? 980 : activeTab === 'admins' ? 760 : 700 }}
              rowSelection={{ type: 'checkbox' }}
            />
          </div>
        </div>

        {/* PAGINATION */}
        <div
          style={{
            background: '#fff',
            borderTop: '1px solid #e2e8f0',
            padding: isMobile ? '8px 12px' : '8px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: 8,
            boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.04)',
          }}
        >
          <Text style={{ fontSize: 11, color: '#94a3b8' }}>
            Showing {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
          </Text>
          <Space size={4}>
            {!isMobile && (
              <Button
                size="small"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{ fontSize: 11 }}
              >
                « First
              </Button>
            )}
            <Button
              size="small"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ fontSize: 11 }}
            >
              ‹ Prev
            </Button>
            <span style={{ fontSize: 11, color: '#64748b', padding: '0 6px' }}>
              {currentPage} / {totalPages}
            </span>
            <Button
              size="small"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              style={{ fontSize: 11 }}
            >
              Next ›
            </Button>
            {!isMobile && (
              <Button
                size="small"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
                style={{ fontSize: 11 }}
              >
                Last »
              </Button>
            )}
          </Space>
        </div>
      </main>

      {/* MODALS */}

      <Modal
        title="🏥 Provision Hospital"
        open={isProvisionModalOpen}
        onCancel={() => setIsProvisionModalOpen(false)}
        footer={null}
        width={responsiveModalWidth}
      >
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
          Create a new tenant and initialize their isolated database.
        </p>
        <Form form={provisionForm} layout="vertical" onFinish={handleCreateTenant}>
          <Form.Item label="Hospital Name" name="tenantName" rules={[{ required: true }]}>
            <Input placeholder="e.g. Cauvery Hospital" />
          </Form.Item>
          <Form.Item
            label="Database Name"
            name="databaseName"
            rules={[
              { required: true },
              { pattern: /^[a-zA-Z0-9_]+$/, message: 'Only alphanumeric and underscores allowed' },
            ]}
          >
            <Input placeholder="e.g. hms_cauvery" />
          </Form.Item>
          <Form.Item label="Status" name="status" initialValue="ACTIVE">
            <Select>
              <Option value="ACTIVE">ACTIVE</Option>
              <Option value="INACTIVE">INACTIVE</Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isProvisioning}
              style={{ ...btnStyle, height: 42, fontWeight: 700 }}
            >
              {isProvisioning ? 'Provisioning DB...' : 'Create Hospital & DB'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 18,
                boxShadow: '0 4px 12px rgba(8, 145, 178, 0.25)',
              }}
            >
              🔐
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                Create New Admin Login
              </div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>
                Assign master admin credentials to a hospital instance
              </div>
            </div>
          </div>
        }
        open={isCreateAdminDrawerOpen}
        onClose={() => setIsCreateAdminDrawerOpen(false)}
        width={responsiveDrawerWidth}
        destroyOnHidden
        styles={{
          header: { borderBottom: '1px solid #f1f5f9', padding: '16px 20px' },
          body: { padding: '24px 20px' },
          footer: { borderTop: '1px solid #f1f5f9', padding: '14px 20px' },
        }}
        footer={
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button
              onClick={() => setIsCreateAdminDrawerOpen(false)}
              style={{ borderRadius: 8, height: 38 }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={() => createAdminForm.submit()}
              loading={isCreating}
              style={{ ...btnStyle, height: 38, fontWeight: 600, padding: '0 20px', borderRadius: 8 }}
            >
              Create Admin Login
            </Button>
          </div>
        }
      >
        <Form form={createAdminForm} layout="vertical" onFinish={handleCreateAdmin}>
          <Form.Item
            label="Hospital / Tenant"
            name="tenantId"
            rules={[{ required: true, message: 'Please select a hospital' }]}
          >
            <Select
              placeholder="-- Select a hospital --"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                String(option?.children ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              style={{ width: '100%' }}
            >
              {hospitalOptions.map((h) => (
                <Option key={h.id} value={h.id}>
                  {h.tenant_name} ({h.tenant_code})
                </Option>
              ))}
            </Select>
          </Form.Item>
          {hospitalOptions.length === 0 && (
            <p style={{ color: '#f59e0b', fontSize: 12, marginTop: -8, marginBottom: 16 }}>
              No provisioned hospitals found. Please create a hospital first.
            </p>
          )}
          <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter admin name' }]}>
            <Input placeholder="e.g. John Doe" autoComplete="off" />
          </Form.Item>
          <Form.Item label="Username" name="username" rules={[{ required: true, message: 'Please enter username' }]}>
            <Input placeholder="e.g. cauvery_admin" autoComplete="off" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Please enter password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password placeholder="Enter a new password" autoComplete="new-password" />
          </Form.Item>
          <Form.Item label="Phone Number" name="phone">
            <Input placeholder="Optional: +1234567890" />
          </Form.Item>
          <Form.Item label="Role" name="role" initialValue="SUPER_ADMIN">
            <Select>
              <Option value="SUPER_ADMIN">SUPER_ADMIN</Option>
              <Option value="ADMIN">ADMIN</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Status" name="status" initialValue="ACTIVE">
            <Select>
              <Option value="ACTIVE">ACTIVE</Option>
              <Option value="INACTIVE">INACTIVE</Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        title="✏️ Edit Admin Login"
        open={!!editingAdmin}
        onCancel={() => setEditingAdmin(null)}
        footer={null}
        width={responsiveModalWidth}
      >
        {editingAdmin && (
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
            Updating credentials for{' '}
            <strong style={{ color: '#334155' }}>{editingAdmin.tenant_name}</strong>
          </p>
        )}
        <Form form={editAdminForm} layout="vertical" onFinish={handleUpdateAdmin}>
          <Form.Item label="Hospital / Tenant">
            <Input
              value={
                editingAdmin ? `${editingAdmin.tenant_name} (${editingAdmin.tenant_code})` : ''
              }
              disabled
            />
          </Form.Item>
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input placeholder="e.g. John Doe" autoComplete="off" />
          </Form.Item>
          <Form.Item label="Username" name="username" rules={[{ required: true }]}>
            <Input placeholder="e.g. admin_user" autoComplete="off" />
          </Form.Item>
          <Form.Item
            label={
              <span>
                Password{' '}
                <span style={{ color: '#94a3b8', fontWeight: 400 }}>
                  (Leave blank to keep current)
                </span>
              </span>
            }
            name="password"
          >
            <Input.Password placeholder="Leave blank to keep current" autoComplete="new-password" />
          </Form.Item>
          <Form.Item label="Phone Number" name="phone">
            <Input placeholder="Optional: +1234567890" />
          </Form.Item>
          <Form.Item label="Role" name="role">
            <Select>
              <Option value="SUPER_ADMIN">SUPER_ADMIN</Option>
              <Option value="ADMIN">ADMIN</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Status" name="status">
            <Select>
              <Option value="ACTIVE">ACTIVE</Option>
              <Option value="INACTIVE">INACTIVE</Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isEditing}
              style={{ ...btnStyle, height: 42, fontWeight: 700 }}
            >
              Update Admin Login
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit Hospital"
        open={!!editingTenant}
        onCancel={() => setEditingTenant(null)}
        footer={null}
        width={isMobile ? '92%' : 400}
      >
        <Form
          form={editTenantForm}
          layout="vertical"
          onFinish={handleUpdateTenant}
          style={{ marginTop: 16 }}
        >
          <Form.Item label="Hospital Name" name="tenantName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Status" name="status">
            <Select>
              <Option value="ACTIVE">ACTIVE</Option>
              <Option value="INACTIVE">INACTIVE</Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%' }}>
              <Button onClick={() => setEditingTenant(null)} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isEditing}
                style={{ ...btnStyle, flex: 1, fontWeight: 700 }}
              >
                Save
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingAdminUser ? '✏️ Edit Master User' : '👥 New Master User'}
        open={isAdminUserModalOpen}
        onCancel={() => setIsAdminUserModalOpen(false)}
        footer={null}
        width={responsiveModalWidth}
      >
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
          {editingAdminUser ? 'Update master user details.' : 'Create a new platform master user.'}
        </p>
        <Form form={adminUserForm} layout="vertical" onFinish={handleSaveAdminUser}>
          <Form.Item label="Full Name" name="name" rules={[{ required: true }]}>
            <Input placeholder="e.g. John Smith" />
          </Form.Item>
          <Form.Item label="Email Address" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="e.g. john@hospital.com" autoComplete="off" />
          </Form.Item>
          <Form.Item
            label={
              <span>
                Password{' '}
                {editingAdminUser && (
                  <span style={{ color: '#94a3b8', fontWeight: 400 }}>
                    (Leave blank to keep current)
                  </span>
                )}
              </span>
            }
            name="password"
            rules={editingAdminUser ? [] : [{ required: true }, { min: 6 }]}
          >
            <Input.Password placeholder="Enter a secure password" autoComplete="new-password" />
          </Form.Item>
          <Form.Item label="Role" name="role" initialValue="Viewer">
            <Select>
              <Option value="Super Admin">Super Admin</Option>
              <Option value="Admin">Admin</Option>
              <Option value="Manager">Manager</Option>
              <Option value="Viewer">Viewer</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Status" name="status" initialValue="ACTIVE">
            <Select>
              <Option value="ACTIVE">ACTIVE</Option>
              <Option value="INACTIVE">INACTIVE</Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%' }}>
              <Button onClick={() => setIsAdminUserModalOpen(false)} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={auSaving}
                style={{ ...btnStyle, flex: 1, fontWeight: 700 }}
              >
                {auSaving ? 'Saving...' : editingAdminUser ? 'Save Changes' : 'Create User'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* CREATE HOSPITAL TENANT DRAWER */}
      <Drawer
        title="🏥 Add New Tenant"
        open={isCreateTenantDrawerOpen}
        onClose={() => setIsCreateTenantDrawerOpen(false)}
        width={responsiveTenantDrawerWidth}
      >
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
          Register a new hospital tenant profile.
        </p>
        <Form form={createTenantDrawerForm} layout="vertical" onFinish={handleCreateHospitalTenant}>
          <Form.Item
            label="Hospital Name"
            name="tenant_name"
            rules={[{ required: true, message: 'Please enter hospital name' }]}
          >
            <Input placeholder="e.g. Apollo Medical Center" />
          </Form.Item>
          <Form.Item
            label="Tenant Code"
            name="tenant_code"
            tooltip="Unique code (e.g. T-APOLLO). Leave blank to auto-generate."
          >
            <Input placeholder="Auto-generated if left blank (e.g. T-A1B2C3)" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ type: 'email', message: 'Please enter a valid email address' }]}
          >
            <Input placeholder="e.g. contact@apollo.com" />
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input placeholder="e.g. +91 98765 43210" />
          </Form.Item>
          <Form.Item label="Address Line 1" name="address_line1">
            <Input placeholder="Building, Street, Flat / House No." />
          </Form.Item>
          <Form.Item label="Address Line 2" name="address_line2">
            <Input placeholder="Area, Landmark, Colony (Optional)" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <Form.Item label="City" name="city">
              <Input placeholder="City / District" />
            </Form.Item>
            <Form.Item label="State" name="state">
              <Input placeholder="State" />
            </Form.Item>
          </div>
          <Form.Item label="Pincode" name="pincode">
            <Input placeholder="Postal code / PIN (e.g. 600001)" />
          </Form.Item>
          <Form.Item label="Status" name="status" initialValue="ACTIVE">
            <Select>
              <Option value="ACTIVE">ACTIVE</Option>
              <Option value="INACTIVE">INACTIVE</Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isSubmittingTenant}
              style={{ ...btnStyle, height: 42 }}
            >
              Create Tenant
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      {/* EDIT HOSPITAL TENANT DRAWER */}
      <Drawer
        title="✏️ Edit Tenant"
        open={isEditTenantDrawerOpen}
        onClose={() => {
          setIsEditTenantDrawerOpen(false);
          setSelectedHospitalTenant(null);
        }}
        width={responsiveTenantDrawerWidth}
      >
        {selectedHospitalTenant && (
          <Form form={editTenantDrawerForm} layout="vertical" onFinish={handleUpdateHospitalTenant}>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '12px 16px',
                borderRadius: 6,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Tenant ID: <span style={{ fontFamily: 'monospace' }}>{selectedHospitalTenant.id}</span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                Tenant Code:{' '}
                <Tag color="cyan" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {selectedHospitalTenant.tenant_code}
                </Tag>
              </div>
            </div>
            <Form.Item
              label="Hospital Name"
              name="tenant_name"
              rules={[{ required: true, message: 'Please enter hospital name' }]}
            >
              <Input placeholder="Hospital name" />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              rules={[{ type: 'email', message: 'Please enter a valid email address' }]}
            >
              <Input placeholder="Hospital contact email" />
            </Form.Item>
            <Form.Item label="Phone" name="phone">
              <Input placeholder="Hospital contact phone" />
            </Form.Item>
            <Form.Item label="Address Line 1" name="address_line1">
              <Input placeholder="Building, Street, Flat / House No." />
            </Form.Item>
            <Form.Item label="Address Line 2" name="address_line2">
              <Input placeholder="Area, Landmark, Colony (Optional)" />
            </Form.Item>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              <Form.Item label="City" name="city">
                <Input placeholder="City / District" />
              </Form.Item>
              <Form.Item label="State" name="state">
                <Input placeholder="State" />
              </Form.Item>
            </div>
            <Form.Item label="Pincode" name="pincode">
              <Input placeholder="Postal code / PIN (e.g. 600001)" />
            </Form.Item>
            <Form.Item label="Status" name="status">
              <Select>
                <Option value="ACTIVE">ACTIVE</Option>
                <Option value="INACTIVE">INACTIVE</Option>
              </Select>
            </Form.Item>
            <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={isSubmittingTenant}
                style={{ ...btnStyle, height: 42 }}
              >
                Save Changes
              </Button>
            </Form.Item>
          </Form>
        )}
      </Drawer>

      {/* VIEW HOSPITAL TENANT DETAILS DRAWER */}
      <Drawer
        title="📋 Tenant Details"
        open={isViewTenantDrawerOpen}
        onClose={() => {
          setIsViewTenantDrawerOpen(false);
          setSelectedHospitalTenant(null);
        }}
        width={responsiveDrawerWidth}
      >
        {selectedHospitalTenant && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                padding: 16,
                background: '#f0fdf4',
                borderRadius: 8,
                border: '1px solid #bbf7d0',
              }}
            >
              <Text strong style={{ fontSize: 16, color: '#166534' }}>
                {selectedHospitalTenant.tenant_name}
              </Text>
              <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                <Tag color="cyan" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {selectedHospitalTenant.tenant_code}
                </Tag>
                <Tag color={selectedHospitalTenant.status === 'ACTIVE' ? 'green' : 'red'}>
                  {selectedHospitalTenant.status}
                </Tag>
              </div>
            </div>

            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>
                  Tenant ID
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text code style={{ fontSize: 12 }}>
                    {selectedHospitalTenant.id}
                  </Text>
                  <Tooltip title="Copy Tenant ID">
                    <Button
                      size="small"
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        void navigator.clipboard.writeText(selectedHospitalTenant.id);
                        message.success('Copied Tenant ID');
                      }}
                    />
                  </Tooltip>
                </div>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>
                  Hospital Name
                </Text>
                <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                  {selectedHospitalTenant.tenant_name}
                </div>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>
                  Tenant Code
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <Tag color="cyan" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {selectedHospitalTenant.tenant_code}
                  </Tag>
                  <Tooltip title="Copy Tenant Code">
                    <Button
                      size="small"
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        void navigator.clipboard.writeText(selectedHospitalTenant.tenant_code);
                        message.success('Copied Tenant Code');
                      }}
                    />
                  </Tooltip>
                </div>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>
                  Email
                </Text>
                <div style={{ marginTop: 4, fontSize: 13 }}>
                  {selectedHospitalTenant.email ? (
                    <a href={`mailto:${selectedHospitalTenant.email}`} style={{ color: '#2563eb' }}>
                      {selectedHospitalTenant.email}
                    </a>
                  ) : (
                    <Text type="secondary">—</Text>
                  )}
                </div>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>
                  Phone
                </Text>
                <div style={{ marginTop: 4, fontSize: 13 }}>
                  {selectedHospitalTenant.phone || <Text type="secondary">—</Text>}
                </div>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>
                  Address
                </Text>
                <div style={{ marginTop: 4, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {selectedHospitalTenant.address_line1 && (
                    <div style={{ fontWeight: 500, color: '#0f172a' }}>
                      {selectedHospitalTenant.address_line1}
                    </div>
                  )}
                  {selectedHospitalTenant.address_line2 && (
                    <div style={{ color: '#475569' }}>
                      {selectedHospitalTenant.address_line2}
                    </div>
                  )}
                  {(selectedHospitalTenant.city || selectedHospitalTenant.state || selectedHospitalTenant.pincode) && (
                    <div style={{ color: '#334155' }}>
                      {[selectedHospitalTenant.city, selectedHospitalTenant.state].filter(Boolean).join(', ')}
                      {selectedHospitalTenant.pincode ? ` - ${selectedHospitalTenant.pincode}` : ''}
                    </div>
                  )}
                  {!selectedHospitalTenant.address_line1 && !selectedHospitalTenant.city && (
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedHospitalTenant.address || <Text type="secondary">—</Text>}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>
                  Status
                </Text>
                <div style={{ marginTop: 4 }}>
                  <Tag color={selectedHospitalTenant.status === 'ACTIVE' ? 'green' : 'red'}>
                    {selectedHospitalTenant.status}
                  </Tag>
                </div>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>
                  Created Date
                </Text>
                <div style={{ marginTop: 4, fontSize: 13, color: '#475569' }}>
                  {new Date(selectedHospitalTenant.created_at).toLocaleString()}
                </div>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>
                  Updated Date
                </Text>
                <div style={{ marginTop: 4, fontSize: 13, color: '#475569' }}>
                  {new Date(selectedHospitalTenant.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
