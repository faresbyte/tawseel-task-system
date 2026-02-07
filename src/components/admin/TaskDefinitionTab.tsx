import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { TaskDefinition, SubTask, supabase, User } from '../../lib/supabase';

interface Props {
    taskDefinitions: TaskDefinition[];
    refetch: () => void;
    currentUser: User;
}

const TaskDefinitionTab: React.FC<Props> = ({ taskDefinitions, refetch, currentUser }) => {
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
    const [showMainTaskModal, setShowMainTaskModal] = useState(false);
    const [showSubTaskModal, setShowSubTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskDefinition | null>(null);

    const [newMainTask, setNewMainTask] = useState({
        title: '',
        description: '',
    });

    const [newSubTask, setNewSubTask] = useState({
        title: '',
        description: '',
    });

    const toggleExpand = (taskId: string) => {
        const newExpanded = new Set(expandedTasks);
        if (newExpanded.has(taskId)) {
            newExpanded.delete(taskId);
        } else {
            newExpanded.add(taskId);
        }
        setExpandedTasks(newExpanded);
    };

    const handleCreateMainTask = async () => {
        if (!newMainTask.title.trim()) {
            alert('يرجى إدخال عنوان المهمة');
            return;
        }

        try {
            await supabase
                .from('task_definitions')
                .insert({
                    title: newMainTask.title,
                    description: newMainTask.description,
                    subtasks: [],
                    created_by: currentUser.id,
                });

            setShowMainTaskModal(false);
            setNewMainTask({ title: '', description: '' });
            refetch();
            alert('تم إنشاء المهمة بنجاح');
        } catch (error) {
            console.error('Error creating task:', error);
            alert('حدث خطأ');
        }
    };

    const handleAddSubTask = async () => {
        if (!selectedTask || !newSubTask.title.trim()) {
            alert('يرجى إدخال عنوان المهمة الفرعية');
            return;
        }

        try {
            const newSubTaskObj: SubTask = {
                id: crypto.randomUUID(),
                title: newSubTask.title,
                description: newSubTask.description,
            };

            const updatedSubtasks = [...selectedTask.subtasks, newSubTaskObj];

            await supabase
                .from('task_definitions')
                .update({ subtasks: updatedSubtasks })
                .eq('id', selectedTask.id);

            setShowSubTaskModal(false);
            setNewSubTask({ title: '', description: '' });
            setSelectedTask(null);
            refetch();
            alert('تم إضافة المهمة الفرعية بنجاح');
        } catch (error) {
            console.error('Error adding subtask:', error);
            alert('حدث خطأ');
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه المهمة؟ سيؤثر ذلك على الإسنادات المرتبطة بها.')) return;

        try {
            await supabase
                .from('task_definitions')
                .delete()
                .eq('id', taskId);

            refetch();
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('حدث خطأ في الحذف');
        }
    };

    const handleDeleteSubTask = async (task: TaskDefinition, subtaskId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه المهمة الفرعية؟')) return;

        try {
            const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);

            await supabase
                .from('task_definitions')
                .update({ subtasks: updatedSubtasks })
                .eq('id', task.id);

            refetch();
        } catch (error) {
            console.error('Error deleting subtask:', error);
            alert('حدث خطأ في الحذف');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="glass rounded-2xl p-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">بنك المهام</h3>
                    <p className="text-sm text-gray-500 mt-1">إنشاء وإدارة المهام الرئيسية والفرعية</p>
                </div>
                <button
                    onClick={() => setShowMainTaskModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:shadow-lg font-semibold"
                >
                    <Plus className="w-4 h-4" />
                    إضافة مهمة رئيسية
                </button>
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
                {taskDefinitions.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center">
                        <Plus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-semibold">لا توجد مهام محددة</p>
                    </div>
                ) : (
                    taskDefinitions.map(task => {
                        const isExpanded = expandedTasks.has(task.id);
                        return (
                            <div key={task.id} className="glass rounded-2xl overflow-hidden">
                                {/* Main Task Header */}
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 text-lg">{task.title}</h4>
                                            {task.description && (
                                                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-2">
                                                {task.subtasks.length} مهمة فرعية
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedTask(task);
                                                    setShowSubTaskModal(true);
                                                }}
                                                className="p-2 hover:bg-green-100 rounded-lg text-green-600"
                                                title="إضافة مهمة فرعية"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => toggleExpand(task.id)}
                                                className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"
                                                title="عرض المهام الفرعية"
                                            >
                                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Subtasks */}
                                {isExpanded && task.subtasks.length > 0 && (
                                    <div className="border-t border-gray-200 bg-gray-50/50 p-4">
                                        <p className="text-xs font-bold text-gray-500 mb-3">المهام الفرعية:</p>
                                        <div className="space-y-2">
                                            {task.subtasks.map(subtask => (
                                                <div key={subtask.id} className="flex items-start justify-between p-3 bg-white rounded-lg">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-900">{subtask.title}</p>
                                                        {subtask.description && (
                                                            <p className="text-sm text-gray-600 mt-1">{subtask.description}</p>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteSubTask(task, subtask.id)}
                                                        className="p-1 hover:bg-red-100 rounded text-red-600"
                                                        title="حذف"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Main Task Modal */}
            {showMainTaskModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">إضافة مهمة رئيسية جديدة</h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={newMainTask.title}
                                onChange={(e) => setNewMainTask({ ...newMainTask, title: e.target.value })}
                                placeholder="عنوان المهمة"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            <textarea
                                value={newMainTask.description}
                                onChange={(e) => setNewMainTask({ ...newMainTask, description: e.target.value })}
                                placeholder="وصف المهمة (اختياري)"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                                rows={3}
                            />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleCreateMainTask}
                                className="flex-1 bg-gradient-to-r from-primary to-primary-dark text-white font-bold py-3 rounded-xl hover:shadow-lg"
                            >
                                إنشاء
                            </button>
                            <button
                                onClick={() => {
                                    setShowMainTaskModal(false);
                                    setNewMainTask({ title: '', description: '' });
                                }}
                                className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-semibold"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SubTask Modal */}
            {showSubTaskModal && selectedTask && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">إضافة مهمة فرعية</h3>
                        <p className="text-sm text-gray-600 mb-4">المهمة الرئيسية: <span className="font-semibold">{selectedTask.title}</span></p>
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={newSubTask.title}
                                onChange={(e) => setNewSubTask({ ...newSubTask, title: e.target.value })}
                                placeholder="عنوان المهمة الفرعية"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            <textarea
                                value={newSubTask.description}
                                onChange={(e) => setNewSubTask({ ...newSubTask, description: e.target.value })}
                                placeholder="وصف المهمة (اختياري)"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                                rows={3}
                            />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleAddSubTask}
                                className="flex-1 bg-gradient-to-r from-primary to-primary-dark text-white font-bold py-3 rounded-xl hover:shadow-lg"
                            >
                                إضافة
                            </button>
                            <button
                                onClick={() => {
                                    setShowSubTaskModal(false);
                                    setNewSubTask({ title: '', description: '' });
                                    setSelectedTask(null);
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

export default TaskDefinitionTab;
