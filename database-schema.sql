-- =====================================================
-- نظام توصيل ون لإدارة المهام
-- Supabase Database Schema
-- =====================================================

-- تنظيف الجداول القديمة (لإعادة البناء بأمان)
DROP TABLE IF EXISTS routines CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS task_definitions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. جدول الأدوار الوظيفية (Roles)
-- =====================================================
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. جدول المستخدمين (Users)
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'user')),
    disabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. جدول تعريف المهام (Task Definitions)
-- =====================================================
CREATE TABLE task_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    subtasks JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. جدول الإسنادات (Assignments)
-- =====================================================
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES task_definitions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'rejected', 'deficient')),
    employee_notes TEXT,
    admin_notes TEXT,
    submitted BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 5. جدول المهام الروتينية (Routines)
-- =====================================================
CREATE TABLE routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES task_definitions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. الفهارس (Indexes) لتحسين الأداء
-- =====================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_disabled ON users(disabled);
CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_assignments_task_id ON assignments(task_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_assigned_at ON assignments(assigned_at);
CREATE INDEX idx_routines_user_id ON routines(user_id);
CREATE INDEX idx_routines_task_id ON routines(task_id);

-- =====================================================
-- 7. بيانات تجريبية (Sample Data)
-- =====================================================

-- إنشاء أدوار تجريبية
INSERT INTO roles (name) VALUES
    ('مصمم جرافيك'),
    ('مبرمج'),
    ('محاسب'),
    ('مسوق رقمي');

-- إنشاء حسابات تجريبية (كلمة المرور: "admin123" و "employee123" مشفرة بـ SHA-256)
-- ملاحظة: في الإنتاج يجب استخدام bcrypt
INSERT INTO users (email, password, name, role_id, user_type, disabled)
SELECT 
    'admin@tawseel.com',
    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', -- admin123
    'مدير النظام',
    NULL,
    'admin',
    FALSE
UNION ALL
SELECT 
    'employee@tawseel.com',
    'c6ba91b90d922e159893f46c387e5dc1b3dc5c101a5a4522f03b987177a24a91', -- employee123
    'موظف تجريبي',
    (SELECT id FROM roles WHERE name = 'مصمم جرافيك' LIMIT 1),
    'user',
    FALSE;

-- إنشاء مهام تجريبية
INSERT INTO task_definitions (title, description, subtasks, created_by)
SELECT 
    'تصميم عروض البيع اليومية',
    'إنشاء تصاميم جذابة لعروض المتجر',
    '[
        {"id": "1", "title": "تحديد المنتجات المطلوبة", "description": ""},
        {"id": "2", "title": "تصميم البوستر الأساسي", "description": ""},
        {"id": "3", "title": "تصميم الستوري", "description": ""},
        {"id": "4", "title": "رفع التصاميم على Drive", "description": ""}
    ]'::jsonb,
    (SELECT id FROM users WHERE user_type = 'admin' LIMIT 1)
UNION ALL
SELECT 
    'مراجعة الحسابات اليومية',
    'مراجعة وتدقيق المعاملات المالية',
    '[
        {"id": "1", "title": "مراجعة الفواتير", "description": ""},
        {"id": "2", "title": "تسجيل المصروفات", "description": ""},
        {"id": "3", "title": "إعداد تقرير مالي", "description": ""}
    ]'::jsonb,
    (SELECT id FROM users WHERE user_type = 'admin' LIMIT 1)
UNION ALL
SELECT 
    'نشر على وسائل التواصل',
    'إدارة الحسابات الاجتماعية',
    '[
        {"id": "1", "title": "كتابة المحتوى", "description": ""},
        {"id": "2", "title": "تصميم البوست", "description": ""},
        {"id": "3", "title": "النشر والرد على التعليقات", "description": ""}
    ]'::jsonb,
    (SELECT id FROM users WHERE user_type = 'admin' LIMIT 1);

-- =====================================================
-- 8. تفعيل Realtime (اختياري - يمكن تفعيله من Dashboard)
-- =====================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE roles;
-- ALTER PUBLICATION supabase_realtime ADD TABLE users;
-- ALTER PUBLICATION supabase_realtime ADD TABLE task_definitions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE assignments;
-- ALTER PUBLICATION supabase_realtime ADD TABLE routines;

-- =====================================================
-- 9. Row Level Security (RLS) - اختياري للأمان المتقدم
-- =====================================================
-- يمكن تفعيل RLS لاحقاً حسب احتياجات الأمان
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
-- وهكذا...

-- =====================================================
-- انتهى السكريبت
-- =====================================================

-- للتحقق من نجاح التنفيذ، قم بتشغيل:
-- SELECT * FROM roles;
-- SELECT * FROM users;
-- SELECT * FROM task_definitions;
