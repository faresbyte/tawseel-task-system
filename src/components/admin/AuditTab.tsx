import React, { useState } from 'react';
import { AlertTriangle, X, Calendar, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Assignment, supabase, User as UserType } from '../../lib/supabase';

interface Props {
    assignments: Assignment[];
    users: UserType[];
    refetch: () => void;
}

const AuditTab: React.FC<Props> = ({ assignments, users, refetch }) => {
    const [filterDate, setFilterDate] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [deficiencyNote, setDeficiencyNote] = useState('');
    const [showDeficiencyModal, setShowDeficiencyModal] = useState(false);

    // Filter assignments
    const filteredAssignments = assignments.filter(assignment => {
        let match = true;
        if (filterDate) {
            const assignmentDate = new Date(assignment.assigned_at).toISOString().split('T')[0];
            match = match && assignmentDate === filterDate;
        }
        if (filterUser) {
            match = match && assignment.user_id === filterUser;
        }
        return match;
    });

    const handleDeficiency = async () => {
        if (!selectedAssignment || !deficiencyNote.trim()) {
            alert('يرجى كتابة ملاحظة القصور');
            return;
        }

        try {
            await supabase
                .from('assignments')
                .update({
                    status: 'deficient',
                    admin_notes: deficiencyNote,
                    submitted: false, // إعادة فتح المهمة للموظف
                })
                .eq('id', selectedAssignment.id);

            setShowDeficiencyModal(false);
            setDeficiencyNote('');
            setSelectedAssignment(null);
            refetch();
            alert('تم تسجيل القصور بنجاح');
        } catch (error) {
            console.error('Error marking deficiency:', error);
            alert('حدث خطأ');
        }
    };

    const handleDelete = async (assignmentId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;

        try {
            await supabase
                .from('assignments')
                .delete()
                .eq('id', assignmentId);

            refetch();
        } catch (error) {
            console.error('Error deleting assignment:', error);
            alert('حدث خطأ في الحذف');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-700',
            done: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700',
            deficient: 'bg-orange-100 text-orange-700',
        };
        const labels = {
            pending: 'قيد الانتظار',
            done: 'مكتمل',
            rejected: 'مرفوض',
            deficient: 'قصور',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status as keyof typeof styles]}`}>
                {labels[status as keyof typeof labels]}
            </span>
        );
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'done':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'rejected':
                return <XCircle className="w-5 h-5 text-red-600" />;
            case 'deficient':
                return <AlertCircle className="w-5 h-5 text-orange-600" />;
            default:
                return <Calendar className="w-5 h-5 text-gray-600" />;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Filters */}
            <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">فلترة النتائج</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline ml-1" />
                            التاريخ
                        </label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <User className="w-4 h-4 inline ml-1" />
                            الموظف
                        </label>
                        <select
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        >
                            <option value="">الكل</option>
                            {users.filter(u => u.user_type === 'user').map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Assignments List */}
            <div className="space-y-3">
                {filteredAssignments.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-semibold">لا توجد مهام للعرض</p>
                    </div>
                ) : (
                    filteredAssignments.map(assignment => (
                        <div key={assignment.id} className="glass rounded-2xl p-6 hover:shadow-xl transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-3">
                                    {getStatusIcon(assignment.status)}
                                    <div>
                                        <h4 className="font-bold text-gray-900">{assignment.task?.title}</h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            الموظف: <span className="font-semibold">{assignment.user?.name}</span>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(assignment.assigned_at).toLocaleDateString('ar-EG', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(assignment.status)}
                                </div>
                            </div>

                            {/* Notes */}
                            {assignment.employee_notes && (
                                <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-xs font-semibold text-blue-900 mb-1">ملاحظات الموظف:</p>
                                    <p className="text-sm text-blue-700">{assignment.employee_notes}</p>
                                </div>
                            )}

                            {assignment.admin_notes && (
                                <div className="mb-3 p-3 bg-orange-50 rounded-lg">
                                    <p className="text-xs font-semibold text-orange-900 mb-1">ملاحظات المدير:</p>
                                    <p className="text-sm text-orange-700">{assignment.admin_notes}</p>
                                </div>
                            )}

                            {/* Actions */}
                            {assignment.status === 'done' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedAssignment(assignment);
                                            setShowDeficiencyModal(true);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 font-semibold"
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        تسجيل قصور
                                    </button>
                                    <button
                                        onClick={() => handleDelete(assignment.id)}
                                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Deficiency Modal */}
            {showDeficiencyModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">تسجيل قصور في المهمة</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            المهمة: <span className="font-semibold">{selectedAssignment?.task?.title}</span>
                        </p>
                        <textarea
                            value={deficiencyNote}
                            onChange={(e) => setDeficiencyNote(e.target.value)}
                            placeholder="اكتب ملاحظة القصور هنا..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                            rows={4}
                        />
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleDeficiency}
                                className="flex-1 bg-gradient-to-r from-primary to-primary-dark text-white font-bold py-3 rounded-xl hover:shadow-lg"
                            >
                                تأكيد
                            </button>
                            <button
                                onClick={() => {
                                    setShowDeficiencyModal(false);
                                    setDeficiencyNote('');
                                    setSelectedAssignment(null);
                                }}
                                className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-semibold"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditTab;
