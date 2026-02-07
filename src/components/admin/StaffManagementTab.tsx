import React, { useState } from 'react';
import { Plus, Edit2, Lock, Unlock, Trash2, UserPlus, Briefcase } from 'lucide-react';
import { Role, User, supabase, hashPassword } from '../../lib/supabase';

interface Props {
    roles: Role[];
    users: User[];
    refetch: () => void;
}

const StaffManagementTab: React.FC<Props> = ({ roles, users, refetch }) => {
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Form states for new user
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        user_type: 'user' as 'admin' | 'user',
        role_id: '',
    });

    // Form states for editing user
    const [editUser, setEditUser] = useState({
        name: '',
        email: '',
        password: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateRole = async () => {
        if (!newRoleName.trim()) {
            alert('يرجى إدخال اسم الدور');
            return;
        }

        try {
            await supabase
                .from('roles')
                .insert({ name: newRoleName });

            setShowRoleModal(false);
            setNewRoleName('');
            refetch();
            alert('تم إنشاء الدور بنجاح');
        } catch (error) {
            console.error('Error creating role:', error);
            alert('حدث خطأ');
        }
    };

    const handleCreateUser = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) {
            alert('يرجى ملء جميع الحقول');
            return;
        }

        if (newUser.user_type === 'user' && !newUser.role_id) {
            alert('يرجى اختيار الدور الوظيفي');
            return;
        }

        try {
            setIsSubmitting(true);
            const hashedPassword = await hashPassword(newUser.password);

            const { error } = await supabase
                .from('users')
                .insert({
                    name: newUser.name,
                    email: newUser.email.toLowerCase(),
                    password: hashedPassword,
                    user_type: newUser.user_type,
                    role_id: newUser.user_type === 'user' ? newUser.role_id : null,
                    disabled: false,
                });

            if (error) throw error;

            // Success Updates
            setShowUserModal(false);
            setNewUser({ name: '', email: '', password: '', user_type: 'user', role_id: '' });
            alert('تم إنشاء الحساب بنجاح! سيظهر في القائمة قريباً.');

            // Trigger refetch in background without blocking UI
            setTimeout(() => refetch(), 100);

        } catch (error) {
            console.error('Error creating user:', error);
            alert('حدث خطأ أثناء إنشاء الحساب. تأكد من عدم تكرار البريد الإلكتروني.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ... inside return ...

    {/* User Creation Modal */ }
    {
        showUserModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in max-h-[90vh] overflow-y-auto">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">إنشاء حساب جديد</h3>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                            placeholder="الاسم الكامل"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            disabled={isSubmitting}
                        />
                        <input
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            placeholder="البريد الإلكتروني"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            disabled={isSubmitting}
                        />
                        <input
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            placeholder="كلمة المرور"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            disabled={isSubmitting}
                        />
                        <select
                            value={newUser.user_type}
                            onChange={(e) => setNewUser({ ...newUser, user_type: e.target.value as 'admin' | 'user' })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            disabled={isSubmitting}
                        >
                            <option value="user">موظف</option>
                            <option value="admin">مدير</option>
                        </select>
                        {newUser.user_type === 'user' && (
                            <select
                                value={newUser.role_id}
                                onChange={(e) => setNewUser({ ...newUser, role_id: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                disabled={isSubmitting}
                            >
                                <option value="">اختر الدور الوظيفي</option>
                                {roles.map(role => (
                                    <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={handleCreateUser}
                            disabled={isSubmitting}
                            className="flex-1 bg-gradient-to-r from-primary to-primary-dark text-white font-bold py-3 rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>جاري الإنشاء...</span>
                                </>
                            ) : (
                                'إنشاء الحساب'
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setShowUserModal(false);
                                setNewUser({ name: '', email: '', password: '', user_type: 'user', role_id: '' });
                            }}
                            disabled={isSubmitting}
                            className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-semibold disabled:opacity-50"
                        >
                            إلغاء
                        </button>
                    </div>
                </div>
            </div>
        )
    }
    const handleToggleDisable = async (user: User) => {
        try {
            await supabase
                .from('users')
                .update({ disabled: !user.disabled })
                .eq('id', user.id);

            refetch();
        } catch (error) {
            console.error('Error toggling user status:', error);
            alert('حدث خطأ');
        }
    };

    const handleEditUser = async () => {
        if (!selectedUser || !editUser.name || !editUser.email) {
            alert('يرجى ملء جميع الحقول');
            return;
        }

        try {
            const updateData: any = {
                name: editUser.name,
                email: editUser.email.toLowerCase(),
            };

            if (editUser.password) {
                updateData.password = await hashPassword(editUser.password);
            }

            await supabase
                .from('users')
                .update(updateData)
                .eq('id', selectedUser.id);

            setShowEditModal(false);
            setSelectedUser(null);
            setEditUser({ name: '', email: '', password: '' });
            refetch();
            alert('تم تحديث البيانات بنجاح');
        } catch (error) {
            console.error('Error updating user:', error);
            alert('حدث خطأ');
        }
    };

    const handleDeleteRole = async (roleId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الدور؟ سيؤثر ذلك على الموظفين المرتبطين به.')) return;

        try {
            await supabase
                .from('roles')
                .delete()
                .eq('id', roleId);

            refetch();
        } catch (error) {
            console.error('Error deleting role:', error);
            alert('حدث خطأ في الحذف');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Roles Section */}
            <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">الأدوار الوظيفية</h3>
                    <button
                        onClick={() => setShowRoleModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:shadow-lg font-semibold"
                    >
                        <Plus className="w-4 h-4" />
                        إضافة دور
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {roles.map(role => (
                        <div key={role.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-primary" />
                                <span className="font-semibold text-gray-900">{role.name}</span>
                            </div>
                            <button
                                onClick={() => handleDeleteRole(role.id)}
                                className="p-1 hover:bg-red-100 rounded text-red-600"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {roles.length === 0 && (
                        <p className="text-gray-500 text-sm col-span-3">لا توجد أدوار وظيفية</p>
                    )}
                </div>
            </div>

            {/* Users Section */}
            <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">الموظفون والمستخدمون</h3>
                    <button
                        onClick={() => setShowUserModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl hover:shadow-lg font-semibold"
                    >
                        <UserPlus className="w-4 h-4" />
                        إنشاء حساب
                    </button>
                </div>
                <div className="space-y-3">
                    {users.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100">
                            <div>
                                <h4 className="font-bold text-gray-900">{user.name}</h4>
                                <p className="text-sm text-gray-600">{user.email}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.user_type === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {user.user_type === 'admin' ? 'مدير' : 'موظف'}
                                    </span>
                                    {user.role && (
                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                            {user.role.name}
                                        </span>
                                    )}
                                    {user.disabled && (
                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                            معطل
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedUser(user);
                                        setEditUser({ name: user.name, email: user.email, password: '' });
                                        setShowEditModal(true);
                                    }}
                                    className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"
                                    title="تعديل"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleToggleDisable(user)}
                                    className={`p-2 rounded-lg ${user.disabled ? 'hover:bg-green-100 text-green-600' : 'hover:bg-red-100 text-red-600'
                                        }`}
                                    title={user.disabled ? 'تفعيل' : 'تعطيل'}
                                >
                                    {user.disabled ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    ))}
                    {users.length === 0 && (
                        <p className="text-gray-500 text-center py-8">لا توجد حسابات</p>
                    )}
                </div>
            </div>

            {/* Role Modal */}
            {showRoleModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">إضافة دور وظيفي جديد</h3>
                        <input
                            type="text"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            placeholder="مثال: مصمم، مبرمج، محاسب"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none mb-4"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleCreateRole}
                                className="flex-1 bg-gradient-to-r from-primary to-primary-dark text-white font-bold py-3 rounded-xl hover:shadow-lg"
                            >
                                إنشاء
                            </button>
                            <button
                                onClick={() => {
                                    setShowRoleModal(false);
                                    setNewRoleName('');
                                }}
                                className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-semibold"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Creation Modal */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">إنشاء حساب جديد</h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={newUser.name}
                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                placeholder="الاسم الكامل"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            <input
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                placeholder="البريد الإلكتروني"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            <input
                                type="password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                placeholder="كلمة المرور"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            <select
                                value={newUser.user_type}
                                onChange={(e) => setNewUser({ ...newUser, user_type: e.target.value as 'admin' | 'user' })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            >
                                <option value="user">موظف</option>
                                <option value="admin">مدير</option>
                            </select>
                            {newUser.user_type === 'user' && (
                                <select
                                    value={newUser.role_id}
                                    onChange={(e) => setNewUser({ ...newUser, role_id: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                >
                                    <option value="">اختر الدور الوظيفي</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleCreateUser}
                                className="flex-1 bg-gradient-to-r from-primary to-primary-dark text-white font-bold py-3 rounded-xl hover:shadow-lg"
                            >
                                إنشاء الحساب
                            </button>
                            <button
                                onClick={() => {
                                    setShowUserModal(false);
                                    setNewUser({ name: '', email: '', password: '', user_type: 'user', role_id: '' });
                                }}
                                className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-semibold"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">تعديل بيانات الموظف</h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={editUser.name}
                                onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                                placeholder="الاسم الكامل"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            <input
                                type="email"
                                value={editUser.email}
                                onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                                placeholder="البريد الإلكتروني"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            <input
                                type="password"
                                value={editUser.password}
                                onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                                placeholder="كلمة المرور الجديدة (اتركه فارغاً للإبقاء على القديمة)"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleEditUser}
                                className="flex-1 bg-gradient-to-r from-primary to-primary-dark text-white font-bold py-3 rounded-xl hover:shadow-lg"
                            >
                                حفظ التعديلات
                            </button>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedUser(null);
                                    setEditUser({ name: '', email: '', password: '' });
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

export default StaffManagementTab;
