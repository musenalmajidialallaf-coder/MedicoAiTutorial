import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ShieldCheck, UserPlus, Trash2 } from 'lucide-react';

export function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(usersData);

      const adminsSnap = await getDocs(collection(db, 'admins'));
      const adminsData = adminsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAdmins(adminsData);
    } catch (error) {
      console.error("Error fetching admin data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) return;
    try {
      const emailObj = newAdminEmail.trim().toLowerCase();
      await setDoc(doc(db, 'admins', emailObj), {
        email: emailObj,
        addedAt: Date.now(),
        addedBy: auth.currentUser?.email
      });
      setNewAdminEmail('');
      fetchData();
      alert('تم إضافة المسؤول بنجاح');
    } catch (error) {
      console.error('Error adding admin', error);
      alert('حدث خطأ أثناء إضافة المسؤول');
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!confirm(`هل أنت متأكد من إزالة ${email} من قائمة المسؤولين؟`)) return;
    try {
      await deleteDoc(doc(db, 'admins', email));
      fetchData();
    } catch (error) {
      console.error('Error removing admin', error);
      alert('حدث خطأ أثناء إزالة المسؤول');
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم ${user.displayName || user.email}؟ لا يمكن التراجع عن هذه الخطوة وسيتم مسح كافة محاضراته.`)) return;
    try {
      console.log("Attempting to delete user:", user.id);
      
      // Delete user profile
      await deleteDoc(doc(db, 'users', user.id));
      console.log("Deleted from 'users' collection");

      // Delete public profile
      await deleteDoc(doc(db, 'public_profiles', user.id));
      console.log("Deleted from 'public_profiles' collection");
      
      fetchData();
      alert('تم حذف المستخدم بنجاح');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(`حدث خطأ أثناء حذف المستخدم: ${error.message || 'خطأ غير معروف'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p className="text-slate-600 dark:text-slate-400 font-bold">جاري تحميل لوحة التحكم...</p>
      </div>
    );
  }

  const paidUsers = users.filter(u => u.subscription === 'paid');
  const freeUsers = users.filter(u => u.subscription !== 'paid');

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 mt-8 mb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl text-purple-600 dark:text-purple-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">لوحة تحكم الإدارة</h2>
        </div>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('go-home'))}
          className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all shadow-sm"
        >
          العودة للتطبيق
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Paid Users */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 -rotate-45 translate-x-10 -translate-y-10"></div>
          <div className="flex items-center justify-between mb-6 relative">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              المشتركين (المدفوع)
            </h3>
            <div className="bg-amber-100 text-amber-600 px-4 py-1 rounded-full font-bold shadow-inner">{paidUsers.length}</div>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {paidUsers.map(u => (
              <div key={u.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center group border border-transparent hover:border-amber-100 transition-all">
                <div className="flex-1">
                  <p className="font-bold text-slate-800 dark:text-slate-100">{u.displayName || 'بدون اسم'}</p>
                  <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                  <p className="text-[10px] mt-1 text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full inline-block">
                    عدد المحاضرات: {u.freeUploadsUsed || 0}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeleteUser(u)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  title="حذف المستخدم"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {paidUsers.length === 0 && (
              <div className="text-center py-10 opacity-50">
                <Trash2 className="w-12 h-12 mx-auto mb-2 opacity-10" />
                <p className="text-slate-500 text-sm">لا يوجد مشتركين بعد.</p>
              </div>
            )}
          </div>
        </div>

        {/* Free Users */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 -rotate-45 translate-x-10 -translate-y-10"></div>
          <div className="flex items-center justify-between mb-6 relative">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
              المستخدمين (المجاني)
            </h3>
            <div className="bg-teal-100 text-teal-600 px-4 py-1 rounded-full font-bold shadow-inner">{freeUsers.length}</div>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {freeUsers.map(u => (
              <div key={u.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center group border border-transparent hover:border-teal-100 transition-all">
                <div className="flex-1">
                  <p className="font-bold text-slate-800 dark:text-slate-100">{u.displayName || 'بدون اسم'}</p>
                  <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-teal-600 font-bold bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full inline-block">
                      عدد المحاضرات: {u.freeUploadsUsed || 0}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteUser(u)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  title="حذف المستخدم"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {freeUsers.length === 0 && (
              <div className="text-center py-10 opacity-50">
                <Trash2 className="w-12 h-12 mx-auto mb-2 opacity-10" />
                <p className="text-slate-500 text-sm">لا يوجد مستخدمين مجانيين.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 mb-8">
        <div className="flex items-center space-x-3 space-x-reverse mb-6">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">المسؤولين (Admins)</h3>
        </div>

        <form onSubmit={handleAddAdmin} className="flex gap-2 mb-6">
          <input
            type="email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="البريد الإلكتروني للإدمن الجديد..."
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            dir="ltr"
          />
          <button
            type="submit"
            disabled={!newAdminEmail.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all disabled:opacity-50"
          >
            <UserPlus className="w-5 h-5" />
            <span>إضافة مسؤول</span>
          </button>
        </form>

        <div className="space-y-3">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex justify-between items-center border border-slate-100 dark:border-slate-700">
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">musen.almajidi.alallaf@gmail.com</p>
              <p className="text-xs text-slate-500">مسؤول النظام الرئيسي (غير قابل للإزالة)</p>
            </div>
            <div className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded">Root Admin</div>
          </div>

          {admins.map(admin => (
            <div key={admin.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex justify-between items-center border border-slate-100 dark:border-slate-700">
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{admin.email}</p>
                <p className="text-xs text-slate-500">تمت الإضافة: {new Date(admin.addedAt).toLocaleDateString('ar-EG')}</p>
              </div>
              <button 
                onClick={() => handleRemoveAdmin(admin.email)}
                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                title="إزالة المسؤول"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
