import React, { useState } from 'react';
import { Send, Calendar, Repeat } from 'lucide-react';
import { TaskDefinition, User, supabase } from '../../lib/supabase';

interface Props {
    taskDefinitions: TaskDefinition[];
    users: User[];
    refetch: () => void;
    currentUser: User;
}

const TaskAssignmentTab: React.FC<Props> = ({ taskDefinitions, users, refetch, currentUser }) => {
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const [selectedUser, setSelectedUser] = useState('');
    const [isRoutine, setIsRoutine] = useState(false);
    const [dueDate, setDueDate] = useState('');

    const handleToggleTask = (taskId: string) => {
        const newSelected = new Set(selectedTasks);
        if (newSelected.has(taskId)) {
            newSelected.delete(taskId);
        } else {
            newSelected.add(taskId);
        }
        setSelectedTasks(newSelected);
    };

    const handleAssign = async () => {
        if (selectedTasks.size === 0) {
            alert('يرجى اختيار مهمة واحدة على الأقل');
            return;
        }

        if (!selectedUser) {
            alert('يرجى اختيار موظف');
            return;
        }

        try {
            if (isRoutine) {
                // Create routine entries
                const routines = Array.from(selectedTasks).map(taskId => ({
                    task_id: taskId,
                    user_id: selectedUser,
                    created_by: currentUser.id,
                    frequency: 'daily' as const,
                }));

                await supabase
                    .from('routines')
                    .insert(routines);

                alert('تم إنشاء المهام الروتينية بنجاح');
            } else {
                // Create one-time assignments
                const assignments = Array.from(selectedTasks).map(taskId => ({
                    task_id: taskId,
                    user_id: selectedUser,
                    assigned_by: currentUser.id,
                    status: 'pending' as const,
                    submitted: false,
                    due_date: dueDate || null,
                }));

                await supabase
                    .from('assignments')
                    .insert(assignments);

                alert('تم إسناد المهام بنجاح');
            }

            setSelectedTasks(new Set());
            setSelectedUser('');
            setDueDate('');
            refetch();
        } catch (error) {
            console.error('Error assigning tasks:', error);
            alert('حدث خطأ أثناء الإسناد');
        }
    };

    const employees = users.filter(u => u.user_type === 'user' && !u.disabled);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Assignment Form */}
            <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">نموذج الإسناد</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            اختر الموظف
                        </label>
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        >
                            <option value="">-- اختر موظف --</option>
                            {employees.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name} {user.role && `(${user.role.name})`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {!isRoutine && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 inline ml-1" />
                                تاريخ الاستحقاق (اختياري)
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 mb-4 p-4 bg-gray-50 rounded-xl">
                    <input
                        type="checkbox"
                        id="routine-checkbox"
                        checked={isRoutine}
                        onChange={(e) => setIsRoutine(e.target.checked)}
                        className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="routine-checkbox" className="flex items-center gap-2 font-semibold text-gray-900 cursor-pointer">
                        <Repeat className="w-5 h-5 text-primary" />
                        تحويل إلى مهام روتينية (يومية)
                    </label>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-900">
                        <strong>ملاحظة:</strong> المهام المختارة: <span className="font-bold text-primary">{selectedTasks.size}</span>
                    </p>
                    {isRoutine && (
                        <p className="text-xs text-blue-700 mt-1">
                            ⚙️ المهام الروتينية سيتم توليدها تلقائياً كل يوم عند دخول الموظف
                        </p>
                    )}
                </div>
            </div>

            {/* Tasks Selection */}
            <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">اختر المهام</h3>
                <div className="space-y-2">
                    {taskDefinitions.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">لا توجد مهام متاحة</p>
                    ) : (
                        taskDefinitions.map(task => {
                            const isSelected = selectedTasks.has(task.id);
                            return (
                                <div
                                    key={task.id}
                                    onClick={() => handleToggleTask(task.id)}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                            ? 'bg-primary/5 border-primary shadow-md'
                                            : 'bg-white border-gray-200 hover:border-primary/30'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleToggleTask(task.id)}
                                            className="mt-1 w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded"
                                        />
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900">{task.title}</h4>
                                            {task.description && (
                                                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                            )}
                                            {task.subtasks.length > 0 && (
                                                <p className="text-xs text-gray-500 mt-2">
                                                    📋 {task.subtasks.length} مهمة فرعية
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Submit Button */}
            {selectedTasks.size > 0 && selectedUser && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-scale-in">
                    <button
                        onClick={handleAssign}
                        className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-95 font-bold"
                    >
                        <Send className="w-6 h-6" />
                        <span>
                            {isRoutine ? 'تأكيد الروتين اليومي' : 'تأكيد الإسناد'}
                        </span>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                            {selectedTasks.size}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default TaskAssignmentTab;
