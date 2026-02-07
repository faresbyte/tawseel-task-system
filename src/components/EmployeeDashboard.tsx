import React, { useState, useEffect } from 'react';
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    LogOut,
    Clock,
    MessageSquare,
    Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Assignment } from '../lib/supabase';

const EmployeeDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({});

    // Simplified & Optimized Fetch
    const fetchAssignments = async () => {
        if (!user) return;

        try {
            const today = new Date().toISOString().split('T')[0];

            // Parallel fetch for speed
            const [assignmentsRes, routinesRes] = await Promise.all([
                supabase
                    .from('assignments')
                    .select('*, task:task_definitions(*)')
                    .eq('user_id', user.id)
                    .gte('assigned_at', `${today}T00:00:00`)
                    .order('assigned_at', { ascending: false }),

                supabase
                    .from('routines')
                    .select('*, task:task_definitions(*)')
                    .eq('user_id', user.id)
            ]);

            const existingAssignments = assignmentsRes.data || [];
            const routines = routinesRes.data || [];

            let finalList = [...existingAssignments];

            // Handle routine generation locally (Optimistic)
            if (routines.length > 0) {
                const existingTaskIds = new Set(existingAssignments.map(a => a.task_id));
                const routinesToGenerate = routines.filter(r => !existingTaskIds.has(r.task_id));

                if (routinesToGenerate.length > 0) {
                    // Create optimistic assignments for display immediately
                    const optimisticAssignments = routinesToGenerate.map(routine => ({
                        id: `temp-${routine.id}`, // Temporary ID
                        task_id: routine.task_id,
                        user_id: user.id,
                        assigned_by: routine.created_by,
                        assigned_at: new Date().toISOString(),
                        status: 'pending',
                        submitted: false,
                        task: routine.task // Include task details for display
                    })) as Assignment[];

                    finalList = [...optimisticAssignments, ...finalList];

                    // Fire and forget: Insert into DB in background
                    const newAssignmentsDB = routinesToGenerate.map(routine => ({
                        task_id: routine.task_id,
                        user_id: user.id,
                        assigned_by: routine.created_by,
                        status: 'pending',
                        submitted: false,
                    }));

                    supabase.from('assignments').insert(newAssignmentsDB).then(() => {
                        // Optional: Silent refresh later if needed, but UI is already happy
                    });
                }
            }

            setAssignments(finalList);

        } catch (error) {
            console.error('Error fetching assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();

        // Setup real-time subscription
        const channel = supabase
            .channel('employee-assignments')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'assignments', filter: `user_id=eq.${user?.id}` },
                () => fetchAssignments()
            )
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'routines', filter: `user_id=eq.${user?.id}` },
                () => fetchAssignments()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const handleUpdateNotes = (assignmentId: string, notes: string) => {
        setEditingNotes({ ...editingNotes, [assignmentId]: notes });
    };

    const handleMarkDone = async (assignment: Assignment) => {
        if (!assignment.submitted) {
            // Optimistic Update: Reflect change immediately
            const previousAssignments = [...assignments];
            const updatedAssignments = assignments.map(a =>
                a.id === assignment.id
                    ? { ...a, status: 'done', submitted: true, completed_at: new Date().toISOString() } as Assignment
                    : a
            );
            setAssignments(updatedAssignments);

            try {
                const { error } = await supabase
                    .from('assignments')
                    .update({
                        status: 'done',
                        employee_notes: editingNotes[assignment.id] || assignment.employee_notes || '',
                        submitted: true,
                        completed_at: new Date().toISOString(),
                    })
                    .eq('id', assignment.id);

                if (error) throw error;
                // No need to refetch immediately if successful
            } catch (error) {
                console.error('Error marking task as done:', error);
                alert('حدث خطأ في الاتصال، تمت إعادة الحالة السابقة');
                setAssignments(previousAssignments); // Rollback
            }
        }
    };

    const handleReject = async (assignment: Assignment) => {
        const reason = editingNotes[assignment.id] || assignment.employee_notes;
        if (!reason || !reason.trim()) {
            alert('يرجى كتابة سبب الرفض في صندوق الملاحظات');
            return;
        }

        if (!confirm('هل أنت متأكد من رفض هذه المهمة؟')) return;

        // Optimistic Update
        const previousAssignments = [...assignments];
        const updatedAssignments = assignments.map(a =>
            a.id === assignment.id
                ? { ...a, status: 'rejected', submitted: true } as Assignment
                : a
        );
        setAssignments(updatedAssignments);

        try {
            const { error } = await supabase
                .from('assignments')
                .update({
                    status: 'rejected',
                    employee_notes: reason,
                    submitted: true,
                })
                .eq('id', assignment.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error rejecting task:', error);
            alert('حدث خطأ في الاتصال، تمت إعادة الحالة السابقة');
            setAssignments(previousAssignments); // Rollback
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
            deficient: 'قصور - يحتاج إعادة عمل',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status as keyof typeof styles]}`}>
                {labels[status as keyof typeof labels]}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900">توصيل ون</h1>
                                <p className="text-sm text-gray-500">مهامي اليومية</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-semibold"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="hidden sm:inline">خروج</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
                        <p className="text-gray-500">جاري تحميل مهامك...</p>
                    </div>
                ) : (
                    <>
                        {/* Welcome Card */}
                        <div className="glass rounded-2xl p-6 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                                مرحباً، {user?.name}
                            </h2>
                            <p className="text-gray-600">
                                لديك <span className="font-bold text-primary">{assignments.filter(a => a.status === 'pending' || a.status === 'deficient').length}</span> مهمة قيد الانتظار
                            </p>
                        </div>

                        {/* Tasks List */}
                        <div className="space-y-4">
                            {assignments.length === 0 ? (
                                <div className="glass rounded-2xl p-12 text-center">
                                    <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 font-semibold">لا توجد مهام لليوم</p>
                                    <p className="text-sm text-gray-400 mt-2">استمتع بيومك! 🎉</p>
                                </div>
                            ) : (
                                assignments.map(assignment => {
                                    const isLocked = assignment.submitted && assignment.status !== 'deficient';
                                    const currentNotes = editingNotes[assignment.id] !== undefined
                                        ? editingNotes[assignment.id]
                                        : assignment.employee_notes || '';

                                    return (
                                        <div key={assignment.id} className={`glass rounded-2xl p-6 ${assignment.status === 'deficient' ? 'border-2 border-orange-400' : ''
                                            }`}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                        {assignment.task?.title}
                                                    </h3>
                                                    {assignment.task?.description && (
                                                        <p className="text-gray-600 mb-3">{assignment.task.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {getStatusBadge(assignment.status)}
                                                        {assignment.due_date && (
                                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {new Date(assignment.due_date).toLocaleDateString('ar-EG')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Subtasks */}
                                            {assignment.task?.subtasks && assignment.task.subtasks.length > 0 && (
                                                <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                                                    <p className="text-sm font-bold text-gray-700 mb-2">المهام الفرعية:</p>
                                                    <ul className="space-y-1">
                                                        {assignment.task.subtasks.map(subtask => (
                                                            <li key={subtask.id} className="text-sm text-gray-600 flex items-start gap-2">
                                                                <span className="text-primary mt-1">•</span>
                                                                <span>{subtask.title}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Admin Notes (Deficiency) */}
                                            {assignment.admin_notes && assignment.status === 'deficient' && (
                                                <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                                    <div className="flex items-start gap-2">
                                                        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm font-bold text-orange-900 mb-1">ملاحظات المدير:</p>
                                                            <p className="text-sm text-orange-700">{assignment.admin_notes}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Notes Input */}
                                            <div className="mb-4">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                                    <MessageSquare className="w-4 h-4" />
                                                    ملاحظاتك (روابط، تفاصيل، تبريرات...)
                                                </label>
                                                <textarea
                                                    value={currentNotes}
                                                    onChange={(e) => handleUpdateNotes(assignment.id, e.target.value)}
                                                    disabled={isLocked}
                                                    placeholder="أضف ملاحظاتك هنا..."
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                    rows={3}
                                                />
                                            </div>

                                            {/* Actions */}
                                            {!isLocked && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleMarkDone(assignment)}
                                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg font-bold"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                        تم الإنجاز
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(assignment)}
                                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg font-bold"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                        رفض المهمة
                                                    </button>
                                                </div>
                                            )}

                                            {isLocked && assignment.status === 'done' && (
                                                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-center">
                                                    <p className="text-sm font-semibold text-green-700">
                                                        ✅ تم إرسال هذه المهمة للمراجعة
                                                    </p>
                                                </div>
                                            )}

                                            {isLocked && assignment.status === 'rejected' && (
                                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                                                    <p className="text-sm font-semibold text-red-700">
                                                        ❌ تم رفض هذه المهمة
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default EmployeeDashboard;
