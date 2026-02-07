import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, User, CheckCircle } from 'lucide-react';
import { Assignment, User as UserType } from '../../lib/supabase';

interface Props {
    assignments: Assignment[];
    users: UserType[];
}

const ReportsTab: React.FC<Props> = ({ assignments, users }) => {
    const [activeView, setActiveView] = useState<'performance' | 'deficiency'>('performance');

    // Calculate performance metrics
    const performanceData = useMemo(() => {
        const employees = users.filter(u => u.user_type === 'user');

        return employees.map(employee => {
            const employeeAssignments = assignments.filter(a => a.user_id === employee.id);
            const total = employeeAssignments.length;
            const completed = employeeAssignments.filter(a => a.status === 'done').length;
            const deficient = employeeAssignments.filter(a => a.status === 'deficient').length;
            const pending = employeeAssignments.filter(a => a.status === 'pending').length;
            const rejected = employeeAssignments.filter(a => a.status === 'rejected').length;

            const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

            return {
                employee,
                total,
                completed,
                deficient,
                pending,
                rejected,
                completionRate,
            };
        });
    }, [assignments, users]);

    // Calculate deficiency records
    const deficiencyRecords = useMemo(() => {
        return assignments.filter(a => a.status === 'deficient');
    }, [assignments]);

    const getCompletionRateColor = (rate: number) => {
        if (rate >= 80) return 'bg-green-500';
        if (rate >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getCompletionRateBadge = (rate: number) => {
        if (rate >= 80) return 'bg-green-100 text-green-700';
        if (rate >= 50) return 'bg-yellow-100 text-yellow-700';
        return 'bg-red-100 text-red-700';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* View Tabs */}
            <div className="glass rounded-2xl p-2 flex gap-2">
                <button
                    onClick={() => setActiveView('performance')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${activeView === 'performance'
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    <TrendingUp className="w-5 h-5" />
                    إحصائيات الأداء
                </button>
                <button
                    onClick={() => setActiveView('deficiency')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${activeView === 'deficiency'
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    <AlertTriangle className="w-5 h-5" />
                    سجل القصور
                </button>
            </div>

            {/* Performance View */}
            {activeView === 'performance' && (
                <div className="space-y-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="glass rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-2">
                                <BarChart3 className="w-8 h-8 text-primary" />
                                <span className="text-3xl font-black text-gray-900">{assignments.length}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-600">إجمالي المهام</p>
                        </div>
                        <div className="glass rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-2">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                                <span className="text-3xl font-black text-green-600">
                                    {assignments.filter(a => a.status === 'done').length}
                                </span>
                            </div>
                            <p className="text-sm font-semibold text-gray-600">المهام المكتملة</p>
                        </div>
                        <div className="glass rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-2">
                                <AlertTriangle className="w-8 h-8 text-orange-600" />
                                <span className="text-3xl font-black text-orange-600">
                                    {assignments.filter(a => a.status === 'deficient').length}
                                </span>
                            </div>
                            <p className="text-sm font-semibold text-gray-600">حالات القصور</p>
                        </div>
                    </div>

                    {/* Employee Performance */}
                    <div className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">أداء الموظفين</h3>
                        <div className="space-y-4">
                            {performanceData.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">لا توجد بيانات للعرض</p>
                            ) : (
                                performanceData.map(data => (
                                    <div key={data.employee.id} className="p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
                                                    <User className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{data.employee.name}</h4>
                                                    {data.employee.role && (
                                                        <p className="text-sm text-gray-600">{data.employee.role.name}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`px-4 py-2 rounded-full text-sm font-black ${getCompletionRateBadge(data.completionRate)}`}>
                                                {data.completionRate}%
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-3">
                                            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${getCompletionRateColor(data.completionRate)} transition-all duration-500`}
                                                    style={{ width: `${data.completionRate}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-4 gap-2 text-center">
                                            <div className="p-2 bg-white rounded-lg">
                                                <p className="text-lg font-bold text-gray-900">{data.total}</p>
                                                <p className="text-xs text-gray-500">الإجمالي</p>
                                            </div>
                                            <div className="p-2 bg-white rounded-lg">
                                                <p className="text-lg font-bold text-green-600">{data.completed}</p>
                                                <p className="text-xs text-gray-500">مكتمل</p>
                                            </div>
                                            <div className="p-2 bg-white rounded-lg">
                                                <p className="text-lg font-bold text-yellow-600">{data.pending}</p>
                                                <p className="text-xs text-gray-500">معلق</p>
                                            </div>
                                            <div className="p-2 bg-white rounded-lg">
                                                <p className="text-lg font-bold text-red-600">{data.rejected}</p>
                                                <p className="text-xs text-gray-500">مرفوض</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Deficiency View */}
            {activeView === 'deficiency' && (
                <div className="glass rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">سجل القصور</h3>
                    <div className="space-y-3">
                        {deficiencyRecords.length === 0 ? (
                            <div className="text-center py-12">
                                <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-semibold">لا توجد حالات قصور مسجلة</p>
                                <p className="text-sm text-gray-400 mt-2">جميع المهام تسير على ما يرام 🎉</p>
                            </div>
                        ) : (
                            deficiencyRecords.map(record => (
                                <div key={record.id} className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900">{record.task?.title}</h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                الموظف: <span className="font-semibold">{record.user?.name}</span>
                                            </p>
                                            {record.admin_notes && (
                                                <div className="mt-3 p-3 bg-white rounded-lg">
                                                    <p className="text-xs font-semibold text-orange-900 mb-1">ملاحظات القصور:</p>
                                                    <p className="text-sm text-orange-700">{record.admin_notes}</p>
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-500 mt-2">
                                                {new Date(record.assigned_at).toLocaleDateString('ar-EG', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsTab;
