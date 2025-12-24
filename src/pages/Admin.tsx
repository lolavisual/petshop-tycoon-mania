import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin, AdminStats, AdminUser, AdminArticle } from '@/hooks/useAdmin';
import { 
  Shield, Users, FileText, BarChart3, Send, Ban, 
  CheckCircle, XCircle, Search, ChevronLeft, ChevronRight,
  Gift, Loader2, Eye, AlertTriangle, Package, Tag, HelpCircle, Megaphone, ShoppingCart
} from 'lucide-react';
import ProductsAdminTab from '@/components/ProductsAdminTab';
import PromotionsAdminTab from '@/components/admin/PromotionsAdminTab';
import QuizzesAdminTab from '@/components/admin/QuizzesAdminTab';
import BroadcastsAdminTab from '@/components/admin/BroadcastsAdminTab';
import OrdersAdminTab from '@/components/admin/OrdersAdminTab';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type TabType = 'stats' | 'users' | 'articles' | 'broadcast' | 'products' | 'promotions' | 'quizzes' | 'mailings' | 'orders';

const AdminPage = () => {
  const [adminSecret, setAdminSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  
  const { 
    loading, 
    isAuthorized,
    getStats, 
    getUsers, 
    updateUser,
    banUser,
    getArticles, 
    moderateArticle,
    broadcast,
    bulkGiveCurrency
  } = useAdmin(adminSecret);

  // Состояния данных
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [articlesTotal, setArticlesTotal] = useState(0);
  const [articlesPage, setArticlesPage] = useState(1);
  const [articlesStatus, setArticlesStatus] = useState('pending');

  // Форма рассылки
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastMinLevel, setBroadcastMinLevel] = useState('');

  // Форма выдачи валюты
  const [giveCurrency, setGiveCurrency] = useState<'crystals' | 'diamonds' | 'stones'>('crystals');
  const [giveAmount, setGiveAmount] = useState('');
  const [giveMinLevel, setGiveMinLevel] = useState('');

  // Редактирование пользователя
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Загрузка данных при смене таба
  useEffect(() => {
    if (!isAuthenticated) return;

    if (activeTab === 'stats') {
      loadStats();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'articles') {
      loadArticles();
    }
  }, [activeTab, isAuthenticated, usersPage, usersSearch, articlesPage, articlesStatus]);

  const loadStats = async () => {
    const data = await getStats();
    if (data) setStats(data);
  };

  const loadUsers = async () => {
    const data = await getUsers(usersPage, 20, usersSearch);
    if (data) {
      setUsers(data.users);
      setUsersTotal(data.total);
    }
  };

  const loadArticles = async () => {
    const data = await getArticles(articlesStatus, articlesPage, 20);
    if (data) {
      setArticles(data.articles);
      setArticlesTotal(data.total);
    }
  };

  const handleLogin = async () => {
    if (!adminSecret.trim()) {
      toast.error('Введите секретный ключ');
      return;
    }
    const data = await getStats();
    if (data) {
      setIsAuthenticated(true);
      setStats(data);
      toast.success('Добро пожаловать, админ!');
    }
  };

  const handleBan = async (user: AdminUser) => {
    const result = await banUser(user.id, !user.is_banned);
    if (result?.success) {
      toast.success(user.is_banned ? 'Пользователь разблокирован' : 'Пользователь заблокирован');
      loadUsers();
    }
  };

  const handleModerate = async (article: AdminArticle, action: 'approve' | 'reject') => {
    const reason = action === 'reject' ? prompt('Причина отклонения:') : undefined;
    if (action === 'reject' && !reason) return;

    const result = await moderateArticle(article.id, action, reason || undefined);
    if (result?.success) {
      toast.success(action === 'approve' ? 'Статья одобрена, награда выдана!' : 'Статья отклонена');
      loadArticles();
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      toast.error('Введите сообщение');
      return;
    }

    const segment = broadcastMinLevel ? { minLevel: parseInt(broadcastMinLevel) } : undefined;
    const result = await broadcast(broadcastMessage, segment);
    if (result?.success) {
      toast.success(`Рассылка отправлена ${result.recipients} пользователям`);
      setBroadcastMessage('');
    }
  };

  const handleGiveCurrency = async () => {
    const amount = parseInt(giveAmount);
    if (!amount || amount <= 0) {
      toast.error('Введите корректную сумму');
      return;
    }

    const segment = giveMinLevel ? { minLevel: parseInt(giveMinLevel) } : undefined;
    const result = await bulkGiveCurrency(giveCurrency, amount, segment);
    if (result?.success) {
      toast.success(`Выдано ${result.updated} пользователям`);
      setGiveAmount('');
      loadStats();
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    const result = await updateUser(editingUser.id, {
      level: editingUser.level,
      crystals: editingUser.crystals,
      diamonds: editingUser.diamonds,
      stones: editingUser.stones
    });
    
    if (result?.success) {
      toast.success('Пользователь обновлён');
      setEditingUser(null);
      loadUsers();
    }
  };

  // Экран входа
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 rounded-3xl max-w-md w-full space-y-6"
        >
          <div className="text-center">
            <Shield className="w-16 h-16 mx-auto text-primary mb-4" />
            <h1 className="text-2xl font-bold">Панель администратора</h1>
            <p className="text-muted-foreground mt-2">PetShop Tycoon</p>
          </div>

          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Секретный ключ администратора"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="text-center"
            />
            
            <Button 
              className="w-full btn-gradient-primary"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Войти'}
            </Button>

            {isAuthorized === false && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-destructive text-sm justify-center"
              >
                <AlertTriangle className="w-4 h-4" />
                Доступ запрещён
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Админка
          </h1>
          {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 p-2 overflow-x-auto">
        {[
          { id: 'stats', icon: BarChart3, label: 'Статистика' },
          { id: 'orders', icon: ShoppingCart, label: 'Заказы' },
          { id: 'users', icon: Users, label: 'Пользователи' },
          { id: 'articles', icon: FileText, label: 'Статьи' },
          { id: 'products', icon: Package, label: 'Товары' },
          { id: 'promotions', icon: Tag, label: 'Акции' },
          { id: 'quizzes', icon: HelpCircle, label: 'Квизы' },
          { id: 'mailings', icon: Megaphone, label: 'Рассылки' },
          { id: 'broadcast', icon: Send, label: 'Игра' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}
            onClick={() => setActiveTab(tab.id as TabType)}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* Статистика */}
          {activeTab === 'stats' && stats && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Всего игроков" value={stats.totalUsers} />
                <StatCard label="DAU" value={stats.dau} />
                <StatCard label="MAU" value={stats.mau} />
                <StatCard label="Retention" value={stats.retention} />
                <StatCard label="Всего кликов" value={stats.totalClicks.toLocaleString()} />
                <StatCard label="Ср. уровень" value={stats.avgLevel} />
              </div>

              <div className="glass-card p-4 rounded-2xl">
                <h3 className="font-bold mb-3">💰 Экономика</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Кристаллы в обращении:</span>
                    <span className="currency-crystal">{stats.economy.crystals.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Алмазы в обращении:</span>
                    <span className="currency-diamond">{stats.economy.diamonds.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Камни в обращении:</span>
                    <span>{stats.economy.stones.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-2xl">
                <h3 className="font-bold mb-3">📝 Модерация</h3>
                <p>Статей на проверке: <strong>{stats.pendingArticles}</strong></p>
              </div>
            </motion.div>
          )}

          {/* Пользователи */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по имени или Telegram ID..."
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-2">
                {users.map(user => (
                  <div key={user.id} className="glass-card p-3 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          {user.first_name || user.username || `ID: ${user.telegram_id}`}
                          {user.is_banned && <Ban className="w-4 h-4 text-destructive" />}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Ур. {user.level} | 💎{Math.floor(user.crystals)} | Стрик: {user.streak_days}д
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingUser(user)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={user.is_banned ? "default" : "destructive"}
                          onClick={() => handleBan(user)}
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Всего: {usersTotal}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={usersPage <= 1}
                    onClick={() => setUsersPage(p => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="px-3 py-1">{usersPage}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={usersPage * 20 >= usersTotal}
                    onClick={() => setUsersPage(p => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Статьи */}
          {activeTab === 'articles' && (
            <motion.div
              key="articles"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex gap-2">
                {['pending', 'approved', 'rejected'].map(status => (
                  <button
                    key={status}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      articlesStatus === status 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                    onClick={() => setArticlesStatus(status)}
                  >
                    {status === 'pending' && 'На проверке'}
                    {status === 'approved' && 'Одобрены'}
                    {status === 'rejected' && 'Отклонены'}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {articles.map(article => (
                  <div key={article.id} className="glass-card p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold">{article.title}</h4>
                      <span className="text-xs text-muted-foreground">
                        {new Date(article.created_at).toLocaleDateString('ru')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                      {article.content}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">
                        От: {article.profiles?.first_name || article.profiles?.username || article.profiles?.telegram_id}
                      </span>
                      {articlesStatus === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-secondary text-secondary-foreground"
                            onClick={() => handleModerate(article, 'approve')}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleModerate(article, 'reject')}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {articles.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    Нет статей
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Рассылка */}
          {activeTab === 'broadcast' && (
            <motion.div
              key="broadcast"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Рассылка сообщения */}
              <div className="glass-card p-4 rounded-2xl space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Рассылка сообщения
                </h3>
                <textarea
                  className="w-full p-3 rounded-xl bg-muted border-0 resize-none h-24"
                  placeholder="Текст сообщения..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Минимальный уровень (опционально)"
                  value={broadcastMinLevel}
                  onChange={(e) => setBroadcastMinLevel(e.target.value)}
                />
                <Button 
                  className="w-full btn-gradient-primary"
                  onClick={handleBroadcast}
                  disabled={loading}
                >
                  Отправить рассылку
                </Button>
              </div>

              {/* Массовая выдача валюты */}
              <div className="glass-card p-4 rounded-2xl space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Выдать валюту
                </h3>
                <div className="flex gap-2">
                  {(['crystals', 'diamonds', 'stones'] as const).map(curr => (
                    <button
                      key={curr}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium ${
                        giveCurrency === curr 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                      onClick={() => setGiveCurrency(curr)}
                    >
                      {curr === 'crystals' && '💎 Кристаллы'}
                      {curr === 'diamonds' && '💎💎 Алмазы'}
                      {curr === 'stones' && '🪨 Камни'}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  placeholder="Количество"
                  value={giveAmount}
                  onChange={(e) => setGiveAmount(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Минимальный уровень (опционально)"
                  value={giveMinLevel}
                  onChange={(e) => setGiveMinLevel(e.target.value)}
                />
                <Button 
                  className="w-full btn-gradient-accent"
                  onClick={handleGiveCurrency}
                  disabled={loading}
                >
                  Выдать всем
                </Button>
              </div>
            </motion.div>
          )}

          {/* Товары */}
          {activeTab === 'products' && (
            <ProductsAdminTab adminSecret={adminSecret} />
          )}

          {/* Акции */}
          {activeTab === 'promotions' && (
            <PromotionsAdminTab />
          )}

          {/* Квизы */}
          {activeTab === 'quizzes' && (
            <QuizzesAdminTab />
          )}

          {/* Рассылки по товарам */}
          {activeTab === 'mailings' && (
            <BroadcastsAdminTab />
          )}

          {/* Заказы */}
          {activeTab === 'orders' && (
            <OrdersAdminTab />
          )}
        </AnimatePresence>
      </div>

      {/* Modal для редактирования пользователя */}
      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setEditingUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass-card p-6 rounded-2xl max-w-sm w-full space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-lg">
                Редактирование: {editingUser.first_name || editingUser.username}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Уровень</label>
                  <Input
                    type="number"
                    value={editingUser.level}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      level: parseInt(e.target.value) || 1
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Кристаллы</label>
                  <Input
                    type="number"
                    value={editingUser.crystals}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      crystals: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Алмазы</label>
                  <Input
                    type="number"
                    value={editingUser.diamonds}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      diamonds: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Камни</label>
                  <Input
                    type="number"
                    value={editingUser.stones}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      stones: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingUser(null)}
                >
                  Отмена
                </Button>
                <Button
                  className="flex-1 btn-gradient-primary"
                  onClick={handleSaveUser}
                  disabled={loading}
                >
                  Сохранить
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Компонент карточки статистики
const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="glass-card p-4 rounded-xl text-center">
    <div className="text-2xl font-bold text-primary">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);

export default AdminPage;
