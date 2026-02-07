import React, { useState, useEffect } from 'react';
import {
    Eye,
    Users,
    FileText,
    Send,
    BarChart3,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuditTab from './admin/AuditTab';
import StaffManagementTab from './admin/StaffManagementTab';
import TaskDefinitionTab from './admin/TaskDefinitionTab';
import TaskAssignmentTab from './admin/TaskAssignmentTab';
import ReportsTab from './admin/ReportsTab';
import { supabase, Role, User, TaskDefinition, Assignment, Routine } from '../lib/supabase';

type TabType = 'audit' | 'staff' | 'tasks' | 'assign' | 'reports';

const AdminDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('audit');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Data states
    const [roles, setRoles] = useState<Role[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [taskDefinitions, setTaskDefinitions] = useState<TaskDefinition[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch all data
    const fetchData = async () => {
        try {
            setLoading(true);
            const [rolesRes, usersRes, tasksRes, assignmentsRes, routinesRes] = await Promise.all([
                supabase.from('roles').select('*').order('name'),
                supabase.from('users').select('*, role:roles(*)').order('name'),
                supabase.from('task_definitions').select('*').order('created_at', { ascending: false }),
                // Optimize: Fetch only latest 100 items to speed up load
                supabase.from('assignments').select('*, task:task_definitions(*), user:users(*)').order('assigned_at', { ascending: false }).limit(100),
                supabase.from('routines').select('*, task:task_definitions(*), user:users(*)').order('created_at', { ascending: false }).limit(100)
            ]);

            if (rolesRes.data) setRoles(rolesRes.data);
            if (usersRes.data) setUsers(usersRes.data);
            if (tasksRes.data) setTaskDefinitions(tasksRes.data);
            if (assignmentsRes.data) setAssignments(assignmentsRes.data);
            if (routinesRes.data) setRoutines(routinesRes.data);

            if (routinesRes.data) setRoutines(routinesRes.data);

        } catch (error) {
            console.error('Error fetching data:', error);
            // Even in error, we let the mocks above populate if data was null
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Setup real-time subscriptions
        const channel = supabase
            .channel('admin-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'roles' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_definitions' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'routines' }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const tabs = [
        { id: 'audit' as TabType, name: 'مراقبة المهام', icon: Eye },
        { id: 'staff' as TabType, name: 'الموظفين والأدوار', icon: Users },
        { id: 'tasks' as TabType, name: 'تعريف المهام', icon: FileText },
        { id: 'assign' as TabType, name: 'إسناد المهام', icon: Send },
        { id: 'reports' as TabType, name: 'التقارير', icon: BarChart3 },
    ];

    // Optimized rendering: Show content immediately, update in background
    const renderContent = () => {
        // Show a subtle loading indicator only on initial load if data is empty
        if (loading && users.length === 0 && roles.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
                    <p className="text-gray-500">جاري بدء النظام...</p>
                </div>
            );
        }

        const props = {
            roles,
            users,
            taskDefinitions,
            assignments,
            routines,
            refetch: fetchData,
            currentUser: user!,
        };

        switch (activeTab) {
            case 'audit':
                return <AuditTab {...props} />;
            case 'staff':
                return <StaffManagementTab {...props} />;
            case 'tasks':
                return <TaskDefinitionTab {...props} />;
            case 'assign':
                return <TaskAssignmentTab {...props} />;
            case 'reports':
                return <ReportsTab {...props} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-l border-gray-200 flex flex-col`}>
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="font-black text-xl text-gray-900">توصيل ون</h2>
                            <p className="text-xs text-gray-500">لوحة الإدارة</p>
                        </div>
                    </div>
                    <div className="glass rounded-xl p-3">
                        <p className="text-sm text-gray-600 mb-1">مرحباً،</p>
                        <p className="font-bold text-gray-900">{user?.name}</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${isActive
                                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{tab.name}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-semibold"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Top Bar */}
                <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                    <h1 className="text-2xl font-black text-gray-900">
                        {tabs.find(t => t.id === activeTab)?.name}
                    </h1>
                    <div className="w-10"></div>
                </header>

                {/* Content Area */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
