
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { parseFinancialText } from './geminiService';
import { Transaction, TransactionType, ExchangeRates, CurrencySummary } from './types';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Settings, 
  Plus, 
  Trash2, 
  Calculator, 
  MessageSquare, 
  RefreshCcw,
  DollarSign,
  Edit2,
  Check,
  X,
  FileDown,
  Table,
  Lock,
  User,
  LogOut,
  AlertTriangle,
  Download,
  Upload,
  Database,
  FileText,
  Clock,
  History,
  ShieldCheck,
  UserPlus,
  Users,
  UserCog,
  ShieldAlert,
  MessageCircle,
  ExternalLink,
  Crown
} from 'lucide-react';

interface UserAccount {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  activeSessionId?: string;
}

const App: React.FC = () => {
  const DEFAULT_ADMIN = { id: 'admin-0', username: 'abd999', password: '732234', role: 'admin' as const };

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('user_accounts_v2');
    if (saved) return JSON.parse(saved);
    return [DEFAULT_ADMIN];
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('currentUserId') || '';
  });
  
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [newAccount, setNewAccount] = useState<Omit<UserAccount, 'id' | 'activeSessionId'>>({ username: '', password: '', role: 'user' });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userEditValues, setUserEditValues] = useState<UserAccount | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    'USD': 1,
    'TRY': 34.50, 
    'SYP': 14500,
  });

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<{
    transactions: Transaction[];
    exchangeRates: ExchangeRates;
    count: number;
    date: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Transaction | null>(null);

  const [mySessionId] = useState<string>(() => {
    const existing = sessionStorage.getItem('mySessionId');
    if (existing) return existing;
    const newId = Math.random().toString(36).substring(7);
    sessionStorage.setItem('mySessionId', newId);
    return newId;
  });

  useEffect(() => {
    if (!isLoggedIn || !currentUserId) return;
    const checkSession = () => {
      const latestUsersRaw = localStorage.getItem('user_accounts_v2');
      if (latestUsersRaw) {
        const latestUsers: UserAccount[] = JSON.parse(latestUsersRaw);
        const me = latestUsers.find(u => u.id === currentUserId);
        if (me && me.activeSessionId && me.activeSessionId !== mySessionId) {
          handleLogout();
          setLoginError('تم تسجيل الخروج لأن الحساب سجل دخوله من نافذة أو جهاز آخر');
        }
      }
    };
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_accounts_v2') checkSession();
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(checkSession, 2000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [isLoggedIn, currentUserId, mySessionId]);

  useEffect(() => {
    if (isLoggedIn && currentUserId) {
      const savedTransactions = localStorage.getItem(`transactions_${currentUserId}`);
      const savedRates = localStorage.getItem(`exchangeRates_${currentUserId}`);
      setTransactions(savedTransactions ? JSON.parse(savedTransactions) : []);
      if (savedRates) setExchangeRates(JSON.parse(savedRates));
      else setExchangeRates({ 'USD': 1, 'TRY': 34.50, 'SYP': 14500 });
    }
  }, [currentUserId, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && currentUserId) {
      localStorage.setItem(`transactions_${currentUserId}`, JSON.stringify(transactions));
    }
  }, [transactions, currentUserId, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && currentUserId) {
      localStorage.setItem(`exchangeRates_${currentUserId}`, JSON.stringify(exchangeRates));
    }
  }, [exchangeRates, currentUserId, isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('user_accounts_v2', JSON.stringify(users));
  }, [users]);

  const currentUser = useMemo(() => users.find(u => u.id === currentUserId), [users, currentUserId]);
  const isAdmin = currentUser?.role === 'admin';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const foundUserIndex = users.findIndex(u => u.username === loginUsername && u.password === loginPassword);
    if (foundUserIndex !== -1) {
      const updatedUsers = [...users];
      updatedUsers[foundUserIndex] = { ...updatedUsers[foundUserIndex], activeSessionId: mySessionId };
      setUsers(updatedUsers);
      setIsLoggedIn(true);
      setCurrentUserId(updatedUsers[foundUserIndex].id);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUserId', updatedUsers[foundUserIndex].id);
    } else {
      setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  const handleLogout = () => {
    if (currentUserId) {
      setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, activeSessionId: undefined } : u));
    }
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUserId');
    setCurrentUserId('');
    setLoginUsername('');
    setLoginPassword('');
    setShowAdminPanel(false);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.username || !newAccount.password) return;
    const userToAdd: UserAccount = { ...newAccount, id: `user-${Date.now()}` };
    setUsers(prev => [...prev, userToAdd]);
    setNewAccount({ username: '', password: '', role: 'user' });
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUserId) {
      alert("لا يمكنك حذف حسابك الحالي أثناء تسجيل الدخول");
      return;
    }
    const adminsCount = users.filter(u => u.role === 'admin').length;
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.role === 'admin' && adminsCount <= 1) {
      alert("يجب أن يبقى مسؤول واحد على الأقل في النظام");
      return;
    }
    if (confirm(`هل أنت متأكد من حذف حساب المستخدم: ${userToDelete?.username}؟`)) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      localStorage.removeItem(`transactions_${userId}`);
      localStorage.removeItem(`exchangeRates_${userId}`);
    }
  };

  const startUserEdit = (user: UserAccount) => {
    setEditingUserId(user.id);
    setUserEditValues({ ...user });
  };

  const saveUserEdit = () => {
    if (userEditValues) {
      const adminsCount = users.filter(u => u.role === 'admin').length;
      if (userEditValues.id === currentUserId && userEditValues.role === 'user' && adminsCount <= 1) {
        alert("لا يمكنك إلغاء صلاحيات المسؤول عن نفسك لأنه لا يوجد مسؤول آخر");
        return;
      }
      setUsers(prev => prev.map(u => u.id === userEditValues.id ? userEditValues : u));
      setEditingUserId(null);
      setUserEditValues(null);
    }
  };

  const handleExportBackup = () => {
    const backupData = { transactions, exchangeRates, exportDate: new Date().toISOString(), owner: currentUser?.username };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `نسخة_احتياطية_${currentUser?.username}_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (data.transactions && data.exchangeRates) {
          setPendingRestoreData({ transactions: data.transactions, exchangeRates: data.exchangeRates, count: data.transactions.length, date: data.exportDate || new Date().toISOString() });
          setShowRestoreConfirm(true);
        } else { setError('ملف غير صالح'); }
      } catch (err) { setError('خطأ في قراءة الملف'); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const executeRestore = () => {
    if (pendingRestoreData) {
      setTransactions(pendingRestoreData.transactions);
      setExchangeRates(pendingRestoreData.exchangeRates);
      setShowRestoreConfirm(false);
      setPendingRestoreData(null);
    }
  };

  const handleRateChange = (currency: string, value: string) => {
    const rate = parseFloat(value);
    if (!isNaN(rate)) setExchangeRates(prev => ({ ...prev, [currency]: rate }));
  };

  const addNewCurrency = () => {
    const currency = prompt('أدخل رمز العملة الجديد (مثال: EUR, AED):');
    if (currency) {
      const upper = currency.trim().toUpperCase();
      if (upper && !exchangeRates[upper]) setExchangeRates(prev => ({ ...prev, [upper]: 1 }));
      else if (upper) alert('العملة موجودة بالفعل');
    }
  };

  const summaries = useMemo(() => {
    const map = new Map<string, CurrencySummary>();
    transactions.forEach(t => {
      const current = map.get(t.currency) || { currency: t.currency, totalIncoming: 0, totalOutgoing: 0, balance: 0, usdValue: 0 };
      if (t.type === TransactionType.INCOMING) current.totalIncoming += t.amount;
      else current.totalOutgoing += t.amount;
      current.balance = current.totalIncoming - current.totalOutgoing;
      const rate = exchangeRates[t.currency] || 0;
      current.usdValue = rate > 0 ? current.balance / rate : 0;
      map.set(t.currency, current);
    });
    return Array.from(map.values());
  }, [transactions, exchangeRates]);

  const totalUsdBalance = useMemo(() => summaries.reduce((acc, curr) => acc + curr.usdValue, 0), [summaries]);

  const handleProcessText = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const newTransactions = await parseFinancialText(inputText);
      setTransactions(prev => [...prev, ...newTransactions]);
      setInputText('');
    } catch (err: any) { setError(err.message || 'حدث خطأ أثناء معالجة النص'); }
    finally { setLoading(false); }
  };

  const handleDownloadPDF = () => {
    if (!reportRef.current) return;
    const filename = `تقرير_${currentUser?.username}_${Date.now()}.pdf`;
    const opt = { margin: [15, 15, 15, 15], filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    // @ts-ignore
    window.html2pdf().set(opt).from(reportRef.current).save();
  };

  const handleDownloadExcel = () => {
    if (transactions.length === 0) return;
    // @ts-ignore
    const wb = XLSX.utils.book_new();
    // @ts-ignore
    const wsTransactions = XLSX.utils.json_to_sheet(transactions.map(t => ({ 'النوع': t.type, 'المبلغ': t.amount, 'العملة': t.currency, 'الوصف': t.description })));
    // @ts-ignore
    XLSX.utils.book_append_sheet(wb, wsTransactions, "الحركات");
    // @ts-ignore
    XLSX.writeFile(wb, `بيانات_${currentUser?.username}.xlsx`);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="bg-emerald-600 p-8 text-center text-white">
            <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Calculator className="w-8 h-8" /></div>
            <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
            <p className="text-emerald-100 text-sm mt-1">المحاسب الذكي - الأستاذ عبد الرزاق الموسى</p>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 flex items-center gap-2"><User className="w-4 h-4 text-emerald-600" />اسم المستخدم</label>
              <input type="text" required value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-lg" placeholder="اسم المستخدم" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 flex items-center gap-2"><Lock className="w-4 h-4 text-emerald-600" />كلمة المرور</label>
              <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-lg" placeholder="••••••••" />
            </div>
            {loginError && (
              <div className="flex items-start gap-2 bg-rose-50 p-3 rounded-lg border border-rose-100 text-rose-600 animate-in fade-in slide-in-from-top-1">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-bold leading-tight">{loginError}</p>
              </div>
            )}
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95">دخول آمن</button>
          </form>
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">جميع الحقوق محفوظة © 2024 - عبد الرزاق الموسى</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <input type="file" ref={fileInputRef} onChange={handleImportBackup} accept=".json" className="hidden" />

      {/* Admin Panel Modal */}
      {showAdminPanel && isAdmin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-8 bg-emerald-700 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <UserCog className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-black">إدارة النظام والمستخدمين</h2>
                  <p className="text-emerald-100 text-sm">مراقبة الجلسات وتدقيق الحسابات</p>
                </div>
              </div>
              <button onClick={() => {setShowAdminPanel(false); setEditingUserId(null);}} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-all"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5 text-emerald-600" /> إضافة حساب جديد</h3>
                <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input type="text" placeholder="اسم المستخدم" className="bg-white border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500 font-bold" value={newAccount.username} onChange={(e) => setNewAccount({...newAccount, username: e.target.value})} />
                  <input type="text" placeholder="كلمة المرور" className="bg-white border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500 font-bold" value={newAccount.password} onChange={(e) => setNewAccount({...newAccount, password: e.target.value})} />
                  <select className="bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold" value={newAccount.role} onChange={(e) => setNewAccount({...newAccount, role: e.target.value as 'admin' | 'user'})}>
                    <option value="user">مستخدم عادي</option>
                    <option value="admin">مسؤول نظام</option>
                  </select>
                  <button type="submit" className="bg-emerald-600 text-white font-black rounded-xl py-2 hover:bg-emerald-700 transition-all active:scale-95">إضافة</button>
                </form>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-600" /> الحسابات المسجلة ({users.length})</h3>
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-right">
                    <thead className="bg-slate-100 text-slate-500 text-xs font-black">
                      <tr><th className="px-6 py-4">المستخدم</th><th className="px-6 py-4">كلمة المرور</th><th className="px-6 py-4 text-center">حالة الجلسة</th><th className="px-6 py-4 text-center">العمليات</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {users.map((u) => (
                        <tr key={u.id} className={`hover:bg-slate-50/80 transition-colors ${editingUserId === u.id ? 'bg-amber-50' : ''}`}>
                          <td className="px-6 py-4 font-bold">
                            {editingUserId === u.id ? <input type="text" className="border rounded-lg px-2 py-1 w-full" value={userEditValues?.username} onChange={(e) => setUserEditValues(prev => prev ? {...prev, username: e.target.value} : null)} /> : <div className="flex items-center gap-2">{u.username}{u.role === 'admin' && <ShieldCheck className="w-3 h-3 text-emerald-600" />}</div>}
                          </td>
                          <td className="px-6 py-4 font-mono text-sm text-slate-400">
                            {editingUserId === u.id ? <input type="text" className="border rounded-lg px-2 py-1 w-full" value={userEditValues?.password} onChange={(e) => setUserEditValues(prev => prev ? {...prev, password: e.target.value} : null)} /> : u.password}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {u.activeSessionId ? <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-[10px] font-black"><span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></span>نشط الآن</span> : <span className="text-[10px] text-slate-300 font-bold">غير متصل</span>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {editingUserId === u.id ? <><button onClick={saveUserEdit} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all"><Check className="w-5 h-5" /></button><button onClick={() => setEditingUserId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"><X className="w-5 h-5" /></button></> : <><button onClick={() => startUserEdit(u)} title="تعديل الحساب" className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDeleteUser(u.id)} title="حذف الحساب" className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button></>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      {showRestoreConfirm && pendingRestoreData && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center border border-slate-200">
            <History className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">استعادة البيانات</h2>
            <p className="text-slate-500 text-sm mb-6">سيتم استبدال بياناتك الحالية بـ {pendingRestoreData.count} حركة من نسخة {new Date(pendingRestoreData.date).toLocaleDateString('ar-EG')}.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowRestoreConfirm(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">إلغاء</button>
              <button onClick={executeRestore} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">تأكيد</button>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center border border-slate-200">
            <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">تصفير السجل</h2>
            <p className="text-slate-500 text-sm mb-6">هل أنت متأكد من مسح كافة حركاتك المالية الحالية؟</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">إلغاء</button>
              <button onClick={() => { setTransactions([]); setShowClearConfirm(false); }} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold">مسح الكل</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-emerald-600 text-white shadow-lg sticky top-0 z-50 no-print">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-8 h-8" />
            <h1 className="text-xl font-bold hidden sm:block tracking-tight">محاسب الواتساب الذكي</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {isAdmin && <button onClick={() => setShowAdminPanel(true)} className="bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg text-sm font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95"><ShieldCheck className="w-4 h-4" />لوحة التحكم</button>}
            <button onClick={handleDownloadExcel} className="bg-emerald-500/50 hover:bg-emerald-500 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"><Table className="w-4 h-4" /><span className="hidden lg:inline">إكسل</span></button>
            <button onClick={handleDownloadPDF} className="bg-emerald-500/50 hover:bg-emerald-500 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"><FileDown className="w-4 h-4" /><span className="hidden lg:inline">PDF</span></button>
            <div className="w-px h-6 bg-emerald-400/30 mx-1 hidden sm:block"></div>
            <button onClick={handleLogout} className="text-emerald-100 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors hover:bg-white/10 px-3 py-1.5 rounded-lg"><LogOut className="w-4 h-4" /><span className="hidden sm:inline">خروج</span></button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6 no-print">
          <div className="bg-emerald-700 rounded-2xl shadow-lg p-8 text-white text-center">
            <p className="text-emerald-100 text-sm mb-1">الرصيد الإجمالي التقديري</p>
            <div className="text-4xl font-bold flex items-center justify-center gap-2"><DollarSign className="w-9 h-9" />{totalUsdBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-800/50 px-3 py-1 rounded-full text-[10px] font-bold text-emerald-200 border border-emerald-600/50">
              <ShieldCheck className="w-3 h-3" /> جلسة مشفرة: {currentUser?.username}
            </div>
          </div>

          {/* Designer attribution card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center gap-3">
               <div className="bg-amber-100 p-2 rounded-lg"><Crown className="w-5 h-5 text-amber-600" /></div>
               <div><p className="text-xs font-bold text-slate-400">تصميم وتطوير</p><h3 className="text-sm font-black text-slate-700">الأستاذ عبد الرزاق الموسى</h3></div>
            </div>
            <div className="p-5">
               <a href="https://wa.me/963992262993" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100 group hover:bg-emerald-600 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-emerald-600 group-hover:text-white" />
                    <span className="text-sm font-bold text-emerald-700 group-hover:text-white">تواصل واتساب</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-emerald-300 group-hover:text-white" />
               </a>
               <p className="text-[10px] text-center text-slate-400 mt-4 font-bold leading-relaxed">للدعم الفني وتخصيص الأنظمة المحاسبية<br/>+963 992 262 993</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-bold text-lg flex items-center gap-2 mb-6 text-slate-700"><Database className="w-5 h-5 text-emerald-600" />إدارة البيانات</h2>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleExportBackup} className="flex flex-col items-center gap-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-emerald-50 transition-all group"><Download className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors" /><span className="text-xs font-bold text-slate-600">تصدير</span></button>
              <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-blue-50 transition-all group"><Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" /><span className="text-xs font-bold text-slate-600">استيراد</span></button>
            </div>
            <button onClick={() => setShowClearConfirm(true)} className="w-full mt-4 py-2 text-rose-500 text-xs font-bold hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-center gap-2 border border-rose-100"><RefreshCcw className="w-3 h-3" />مسح كافة الحركات</button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6"><h2 className="font-bold text-lg flex items-center gap-2 text-slate-700"><Settings className="w-5 h-5 text-emerald-600" />أسعار الصرف</h2><button onClick={addNewCurrency} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"><Plus className="w-5 h-5 text-emerald-600" /></button></div>
            <div className="space-y-4">
              {Object.entries(exchangeRates).map(([currency, rate]) => (
                <div key={currency} className="flex items-center gap-3"><span className="w-16 text-xs font-black text-slate-400 uppercase tracking-widest">{currency}</span><input type="number" value={rate} onChange={(e) => handleRateChange(currency, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all" /></div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8 space-y-8" ref={reportRef}>
          <div className="hidden block-for-pdf bg-white rounded-3xl p-10 border-4 border-emerald-600 mb-10 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-600 p-4 rounded-2xl text-white"><Calculator className="w-10 h-10" /></div>
                <div><h1 className="text-4xl font-black text-emerald-700 leading-tight">محاسب الواتساب الذكي</h1><p className="text-slate-500 font-bold text-lg mt-1">تصميم الأستاذ: عبد الرزاق الموسى</p></div>
              </div>
              <div className="text-left rtl:text-right border-r-2 border-emerald-100 pr-6 mr-6"><div className="flex items-center gap-2 text-slate-400 mb-1"><Clock className="w-4 h-4" /><span className="text-sm font-bold">تاريخ الإصدار</span></div><p className="text-emerald-600 font-black text-xl">{new Date().toLocaleDateString('ar-EG', { dateStyle: 'long' })}</p></div>
            </div>
            <div className="mt-12 bg-emerald-50 border-2 border-emerald-100 p-8 rounded-[2rem] flex items-center justify-between">
              <div><p className="text-emerald-800 text-lg font-black mb-1">إجمالي الرصيد الصافي (USD)</p></div>
              <div className="bg-emerald-600 px-8 py-5 rounded-2xl text-white text-center shadow-lg"><div className="text-4xl font-black flex items-center justify-center gap-2"><span className="text-2xl font-bold opacity-80">$</span>{totalUsdBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 no-print">
            <label className="block mb-4 font-bold text-slate-700 flex items-center gap-2 text-lg"><MessageSquare className="w-6 h-6 text-emerald-600" />تحليل نص جديد</label>
            <textarea className="w-full h-44 bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none text-lg leading-relaxed shadow-inner" placeholder="انسخ الحسابات من واتساب هنا..." value={inputText} onChange={(e) => setInputText(e.target.value)} />
            {error && <div className="mt-3 p-3 bg-rose-50 text-rose-600 text-sm font-medium border border-rose-100 rounded-lg">⚠️ {error}</div>}
            <button onClick={handleProcessText} disabled={loading || !inputText.trim()} className={`mt-5 w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-3 text-lg shadow-md ${loading ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'}`}>
              {loading ? "جاري التحليل..." : "إضافة الحسابات لدفتر البيانات"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summaries.map((summary) => (
              <div key={summary.currency} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 break-inside-avoid shadow-inner-white">
                <div className="flex justify-between items-center mb-5"><span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-black text-sm uppercase tracking-widest">{summary.currency}</span><span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">≈ {summary.usdValue.toFixed(2)} $</span></div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-slate-400 font-bold">إجمالي الوارد</span><span className="text-emerald-600 font-black">+{summary.totalIncoming.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400 font-bold">إجمالي الصادر</span><span className="text-rose-600 font-black">-{summary.totalOutgoing.toLocaleString()}</span></div>
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center"><span className="font-bold text-slate-700">الصافي</span><span className={`text-xl font-black ${summary.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{summary.balance.toLocaleString()}</span></div>
                </div>
              </div>
            ))}
          </div>

          {transactions.length > 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden break-before-page">
              <div className="p-6 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center">
                <h2 className="font-black text-slate-700 text-xl flex items-center gap-3"><FileText className="w-6 h-6 text-emerald-600" />سجل الحسابات الشخصي</h2>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{currentUser?.username}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="text-slate-400 text-xs uppercase font-black border-b border-slate-100 bg-slate-50/30">
                      <th className="px-6 py-5">النوع</th><th className="px-6 py-5">المبلغ</th><th className="px-6 py-5">العملة</th><th className="px-6 py-5">الوصف والبيان</th><th className="px-6 py-5 text-center no-print">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((t) => (
                      <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${editingId === t.id ? 'bg-emerald-50/30' : ''} break-inside-avoid`}>
                        <td className="px-6 py-5">
                          {editingId === t.id ? (
                            <select value={editValues?.type} onChange={(e) => setEditValues(prev => prev ? {...prev, type: e.target.value as TransactionType} : null)} className="bg-white border border-slate-200 rounded-lg p-2 text-sm font-bold"><option value={TransactionType.INCOMING}>وارد / له</option><option value={TransactionType.OUTGOING}>صادر / عليه</option></select>
                          ) : (
                            <div className={`flex items-center gap-2 ${t.type === TransactionType.INCOMING ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}`}>{t.type === TransactionType.INCOMING ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}<span className="text-sm">{t.type === TransactionType.INCOMING ? 'وارد' : 'صادر'}</span></div>
                          )}
                        </td>
                        <td className="px-6 py-5 font-black text-slate-700 whitespace-nowrap text-lg">
                          {editingId === t.id ? <input type="number" value={editValues?.amount} onChange={(e) => setEditValues(prev => prev ? {...prev, amount: parseFloat(e.target.value) || 0} : null)} className="w-28 border-2 border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none" /> : t.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-5 uppercase font-black text-slate-400 text-xs tracking-widest">
                          {editingId === t.id ? <select value={editValues?.currency} onChange={(e) => setEditValues(prev => prev ? {...prev, currency: e.target.value} : null)} className="border-2 border-slate-200 rounded-xl p-1.5 font-bold">{Object.keys(exchangeRates).map(curr => <option key={curr} value={curr}>{curr}</option>)}</select> : t.currency}
                        </td>
                        <td className="px-6 py-5 text-slate-600 text-sm font-medium leading-relaxed">
                          {editingId === t.id ? <input type="text" value={editValues?.description} onChange={(e) => setEditValues(prev => prev ? {...prev, description: e.target.value} : null)} className="w-full border-2 border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /> : t.description}
                        </td>
                        <td className="px-6 py-5 text-center no-print">
                          <div className="flex items-center justify-center gap-1">
                            {editingId === t.id ? <><button onClick={() => { if(editValues) setTransactions(prev => prev.map(t => t.id === editValues.id ? editValues : t)); setEditingId(null); }} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all"><Check className="w-6 h-6" /></button><button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"><X className="w-6 h-6" /></button></> : <><button onClick={() => { setEditingId(t.id); setEditValues({...t}); }} className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit2 className="w-5 h-5" /></button><button onClick={() => setTransactions(prev => prev.filter(item => item.id !== t.id))} className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-6 h-6" /></button></>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : !loading && (
            <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 no-print">
              <Calculator className="w-16 h-16 text-slate-200 mx-auto mb-6" />
              <h3 className="text-slate-500 font-bold text-2xl mb-2">دفتر الحسابات فارغ</h3>
              <p className="text-slate-400 max-w-xs mx-auto text-sm">أهلاً بك يا {currentUser?.username}. قم بإضافة أولى حساباتك الآن.</p>
            </div>
          )}
        </div>
      </main>
      
      <footer className="container mx-auto px-4 mt-12 text-center border-t border-slate-200 pt-8 pb-4 no-print">
        <div className="flex flex-col items-center gap-2">
           <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
              <span>تصميم الأستاذ: عبد الرزاق الموسى</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <a href="https://wa.me/963992262993" className="text-emerald-600 hover:underline">واتساب: +963992262993</a>
           </div>
           <p className="text-[10px] text-slate-300">نظام المحاسب الذكي - حماية الجلسة نشطة - جميع الحقوق محفوظة 2024</p>
        </div>
      </footer>

      <style>{`
        .block-for-pdf { display: none; }
        .shadow-inner-white { box-shadow: inset 0 2px 4px 0 rgba(255, 255, 255, 0.05); }
        .html2pdf__container .block-for-pdf { display: block !important; }
        .html2pdf__container main { margin-top: 0 !important; }
        .html2pdf__container table th { background-color: #f1f5f9 !important; color: #64748b !important; }
        .html2pdf__container .bg-white { border: 1px solid #e2e8f0 !important; }
        @media print { .block-for-pdf { display: block !important; } }
      `}</style>
    </div>
  );
};

export default App;
