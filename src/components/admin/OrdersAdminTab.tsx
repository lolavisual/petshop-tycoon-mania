import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, Clock, CheckCircle, Truck, XCircle, 
  Search, ChevronLeft, ChevronRight, ExternalLink,
  MessageSquare, Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type OrderStatus = 'new' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  telegram_id: number;
  chat_id: number;
  customer_name: string;
  customer_username: string | null;
  product_name: string;
  product_id: string | null;
  price: string;
  status: OrderStatus;
  manager_notes: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

const statusConfig: Record<OrderStatus, { label: string; icon: typeof Package; color: string }> = {
  new: { label: 'Новый', icon: Package, color: 'bg-blue-500' },
  processing: { label: 'В обработке', icon: Clock, color: 'bg-yellow-500' },
  confirmed: { label: 'Подтверждён', icon: CheckCircle, color: 'bg-green-500' },
  shipped: { label: 'Отправлен', icon: Truck, color: 'bg-purple-500' },
  delivered: { label: 'Доставлен', icon: CheckCircle, color: 'bg-emerald-500' },
  cancelled: { label: 'Отменён', icon: XCircle, color: 'bg-red-500' },
};

const OrdersAdminTab = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [managerNotes, setManagerNotes] = useState('');
  const perPage = 10;

  useEffect(() => {
    loadOrders();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [page, statusFilter, search]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (search.trim()) {
        query = query.or(`customer_name.ilike.%${search}%,customer_username.ilike.%${search}%,product_name.ilike.%${search}%`);
      }

      const { data, count, error } = await query;

      if (error) throw error;

      setOrders((data || []) as Order[]);
      setTotal(count || 0);
    } catch (err) {
      console.error('Failed to load orders:', err);
      toast.error('Ошибка загрузки заказов');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updates: Record<string, unknown> = { status: newStatus };
      
      if (newStatus === 'confirmed') updates.confirmed_at = new Date().toISOString();
      if (newStatus === 'shipped') updates.shipped_at = new Date().toISOString();
      if (newStatus === 'delivered') updates.delivered_at = new Date().toISOString();

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;

      toast.success(`Статус изменён на "${statusConfig[newStatus].label}"`);
      loadOrders();
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus } as Order);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Ошибка обновления статуса');
    }
  };

  const saveNotes = async () => {
    if (!selectedOrder) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ manager_notes: managerNotes })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast.success('Заметки сохранены');
      loadOrders();
    } catch (err) {
      console.error('Failed to save notes:', err);
      toast.error('Ошибка сохранения заметок');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени, товару..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-2">
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              statusFilter === 'all' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}
            onClick={() => setStatusFilter('all')}
          >
            Все
          </button>
          {(Object.keys(statusConfig) as OrderStatus[]).map(status => (
            <button
              key={status}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                statusFilter === status 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => setStatusFilter(status)}
            >
              {statusConfig[status].label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          Заказов не найдено
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const config = statusConfig[order.status];
            const StatusIcon = config.icon;
            
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-4 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setSelectedOrder(order);
                  setManagerNotes(order.manager_notes || '');
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      {order.product_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.customer_name}
                      {order.customer_username && ` (@${order.customer_username})`}
                    </div>
                  </div>
                  <Badge className={`${config.color} text-white`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>💰 {order.price}</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Всего: {total}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 py-1">{page} / {totalPages}</span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass-card p-6 rounded-2xl max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">Заказ #{selectedOrder.id.slice(0, 8)}</h3>
                <Badge className={`${statusConfig[selectedOrder.status].color} text-white`}>
                  {statusConfig[selectedOrder.status].label}
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="glass-card p-3 rounded-xl">
                  <div className="text-muted-foreground mb-1">Товар</div>
                  <div className="font-bold">{selectedOrder.product_name}</div>
                  <div className="text-primary font-medium">{selectedOrder.price}</div>
                </div>

                <div className="glass-card p-3 rounded-xl">
                  <div className="text-muted-foreground mb-1">Клиент</div>
                  <div className="font-bold">{selectedOrder.customer_name}</div>
                  {selectedOrder.customer_username && (
                    <a 
                      href={`https://t.me/${selectedOrder.customer_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary flex items-center gap-1 hover:underline"
                    >
                      @{selectedOrder.customer_username}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    Telegram ID: {selectedOrder.telegram_id}
                  </div>
                </div>

                <div className="glass-card p-3 rounded-xl">
                  <div className="text-muted-foreground mb-1">Даты</div>
                  <div className="space-y-1 text-xs">
                    <div>📦 Создан: {formatDate(selectedOrder.created_at)}</div>
                    {selectedOrder.confirmed_at && (
                      <div>✅ Подтверждён: {formatDate(selectedOrder.confirmed_at)}</div>
                    )}
                    {selectedOrder.shipped_at && (
                      <div>🚚 Отправлен: {formatDate(selectedOrder.shipped_at)}</div>
                    )}
                    {selectedOrder.delivered_at && (
                      <div>🎉 Доставлен: {formatDate(selectedOrder.delivered_at)}</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    Заметки менеджера
                  </label>
                  <textarea
                    className="w-full p-3 rounded-xl bg-muted border-0 resize-none h-20 text-sm"
                    placeholder="Добавьте заметки..."
                    value={managerNotes}
                    onChange={(e) => setManagerNotes(e.target.value)}
                  />
                  <Button size="sm" variant="outline" onClick={saveNotes}>
                    Сохранить заметки
                  </Button>
                </div>
              </div>

              {/* Status Actions */}
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Изменить статус:</div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedOrder.status === 'new' && (
                    <>
                      <Button
                        size="sm"
                        className="bg-yellow-500 hover:bg-yellow-600"
                        onClick={() => updateOrderStatus(selectedOrder.id, 'processing')}
                      >
                        В обработку
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                      >
                        Отменить
                      </Button>
                    </>
                  )}
                  {selectedOrder.status === 'processing' && (
                    <>
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                      >
                        Подтвердить
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                      >
                        Отменить
                      </Button>
                    </>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <Button
                      size="sm"
                      className="bg-purple-500 hover:bg-purple-600 col-span-2"
                      onClick={() => updateOrderStatus(selectedOrder.id, 'shipped')}
                    >
                      Отправить
                    </Button>
                  )}
                  {selectedOrder.status === 'shipped' && (
                    <Button
                      size="sm"
                      className="bg-emerald-500 hover:bg-emerald-600 col-span-2"
                      onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                    >
                      Доставлен
                    </Button>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedOrder(null)}
              >
                Закрыть
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OrdersAdminTab;
