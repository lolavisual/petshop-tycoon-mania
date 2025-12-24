import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, Trash2, Save, X, Loader2, Send, 
  Edit2, Image as ImageIcon, Link, Users, CheckCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Broadcast {
  id: string;
  title: string;
  message: string;
  image_url: string | null;
  button_text: string | null;
  button_url: string | null;
  product_ids: string[];
  broadcast_type: string;
  status: string;
  sent_at: string | null;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

interface Product {
  id: string;
  name_ru: string;
  price: number;
  image_url: string | null;
}

const BroadcastsAdminTab = () => {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [editing, setEditing] = useState<Broadcast | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const emptyBroadcast: Omit<Broadcast, 'id' | 'created_at' | 'sent_at' | 'sent_count' | 'failed_count'> = {
    title: '',
    message: '',
    image_url: null,
    button_text: null,
    button_url: null,
    product_ids: [],
    broadcast_type: 'promo',
    status: 'draft',
  };

  const [newBroadcast, setNewBroadcast] = useState(emptyBroadcast);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [broadcastsRes, productsRes, subsRes] = await Promise.all([
        supabase.from('bot_broadcasts').select('*').order('created_at', { ascending: false }),
        supabase.from('pet_products').select('id, name_ru, price, image_url'),
        supabase.from('bot_subscribers').select('id', { count: 'exact', head: true }).eq('is_active', true)
      ]);
      
      if (broadcastsRes.data) setBroadcasts(broadcastsRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      if (subsRes.count !== null) setSubscribersCount(subsRes.count);
    } catch (err) {
      console.error('Error loading broadcasts:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId: string, target: 'new' | 'edit') => {
    if (target === 'new') {
      const ids = newBroadcast.product_ids.includes(productId)
        ? newBroadcast.product_ids.filter(id => id !== productId)
        : [...newBroadcast.product_ids, productId];
      setNewBroadcast({ ...newBroadcast, product_ids: ids });
    } else if (editing) {
      const ids = editing.product_ids.includes(productId)
        ? editing.product_ids.filter(id => id !== productId)
        : [...editing.product_ids, productId];
      setEditing({ ...editing, product_ids: ids });
    }
  };

  const handleCreate = async () => {
    if (!newBroadcast.title.trim() || !newBroadcast.message.trim()) {
      toast.error('Заполните название и текст');
      return;
    }

    try {
      const { error } = await supabase.from('bot_broadcasts').insert(newBroadcast);
      if (error) throw error;
      
      toast.success('Рассылка создана');
      setIsCreating(false);
      setNewBroadcast(emptyBroadcast);
      loadData();
    } catch (err) {
      console.error('Create error:', err);
      toast.error('Ошибка создания');
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;

    try {
      const { error } = await supabase
        .from('bot_broadcasts')
        .update({
          title: editing.title,
          message: editing.message,
          image_url: editing.image_url,
          button_text: editing.button_text,
          button_url: editing.button_url,
          product_ids: editing.product_ids,
          broadcast_type: editing.broadcast_type,
        })
        .eq('id', editing.id);

      if (error) throw error;
      
      toast.success('Рассылка обновлена');
      setEditing(null);
      loadData();
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Ошибка обновления');
    }
  };

  const handleSend = async (broadcast: Broadcast) => {
    if (!confirm(`Отправить рассылку "${broadcast.title}" ${subscribersCount} подписчикам?`)) return;

    setSending(broadcast.id);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { 
          action: 'broadcast',
          broadcastId: broadcast.id
        }
      });

      if (error) throw error;
      
      toast.success(`Рассылка отправлена: ${data?.sent || 0} успешно, ${data?.failed || 0} ошибок`);
      loadData();
    } catch (err) {
      console.error('Send error:', err);
      toast.error('Ошибка отправки');
    } finally {
      setSending(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить рассылку?')) return;

    try {
      const { error } = await supabase.from('bot_broadcasts').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('Рассылка удалена');
      loadData();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Ошибка удаления');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      sent: 'bg-secondary/20 text-secondary',
      failed: 'bg-destructive/20 text-destructive',
    };
    const labels: Record<string, string> = {
      draft: 'Черновик',
      sent: 'Отправлено',
      failed: 'Ошибка',
    };
    return <span className={`px-2 py-0.5 rounded text-xs ${styles[status] || styles.draft}`}>{labels[status] || status}</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Статистика подписчиков */}
      <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          <div>
            <div className="text-2xl font-bold">{subscribersCount}</div>
            <div className="text-xs text-muted-foreground">Подписчиков бота</div>
          </div>
        </div>
      </div>

      <Button
        className="w-full btn-gradient-primary"
        onClick={() => setIsCreating(true)}
        disabled={isCreating}
      >
        <Plus className="w-4 h-4 mr-2" />
        Создать рассылку
      </Button>

      {/* Форма создания */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-card p-4 rounded-2xl space-y-3"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <Send className="w-4 h-4" />
              Новая рассылка
            </h3>
            <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <Input
            placeholder="Название (для себя)"
            value={newBroadcast.title}
            onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
          />

          <textarea
            placeholder="Текст сообщения (поддерживает HTML)"
            value={newBroadcast.message}
            onChange={(e) => setNewBroadcast({ ...newBroadcast, message: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-background border border-input min-h-[100px]"
          />

          <div className="flex gap-2">
            <select
              className="flex-1 px-3 py-2 rounded-lg bg-background border border-input"
              value={newBroadcast.broadcast_type}
              onChange={(e) => setNewBroadcast({ ...newBroadcast, broadcast_type: e.target.value })}
            >
              <option value="promo">🔥 Акция</option>
              <option value="new">✨ Новинка</option>
              <option value="gift">🎁 Подарок</option>
              <option value="info">ℹ️ Информация</option>
            </select>
          </div>

          <Input
            placeholder="URL изображения (опционально)"
            value={newBroadcast.image_url || ''}
            onChange={(e) => setNewBroadcast({ ...newBroadcast, image_url: e.target.value || null })}
          />

          <div className="flex gap-2">
            <Input
              placeholder="Текст кнопки"
              value={newBroadcast.button_text || ''}
              onChange={(e) => setNewBroadcast({ ...newBroadcast, button_text: e.target.value || null })}
              className="flex-1"
            />
            <Input
              placeholder="URL кнопки"
              value={newBroadcast.button_url || ''}
              onChange={(e) => setNewBroadcast({ ...newBroadcast, button_url: e.target.value || null })}
              className="flex-1"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Товары в рассылке (опционально)</label>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={() => toggleProduct(p.id, 'new')}
                  className={`px-2 py-1 rounded text-xs ${
                    newBroadcast.product_ids.includes(p.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {p.name_ru}
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={handleCreate}>
            <Save className="w-4 h-4 mr-2" />
            Сохранить черновик
          </Button>
        </motion.div>
      )}

      {/* Список рассылок */}
      <div className="space-y-2">
        {broadcasts.map((broadcast) => (
          <div key={broadcast.id} className="glass-card p-3 rounded-xl">
            {editing?.id === broadcast.id ? (
              <div className="space-y-3">
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
                <textarea
                  value={editing.message}
                  onChange={(e) => setEditing({ ...editing, message: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-input min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Текст кнопки"
                    value={editing.button_text || ''}
                    onChange={(e) => setEditing({ ...editing, button_text: e.target.value || null })}
                  />
                  <Input
                    placeholder="URL кнопки"
                    value={editing.button_url || ''}
                    onChange={(e) => setEditing({ ...editing, button_url: e.target.value || null })}
                  />
                </div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {products.map(p => (
                    <button
                      key={p.id}
                      onClick={() => toggleProduct(p.id, 'edit')}
                      className={`px-2 py-1 rounded text-xs ${
                        editing.product_ids.includes(p.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {p.name_ru}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleUpdate}>
                    <Save className="w-4 h-4 mr-2" />
                    Сохранить
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate flex items-center gap-2">
                      {broadcast.broadcast_type === 'promo' && '🔥'}
                      {broadcast.broadcast_type === 'new' && '✨'}
                      {broadcast.broadcast_type === 'gift' && '🎁'}
                      {broadcast.broadcast_type === 'info' && 'ℹ️'}
                      {broadcast.title}
                      {getStatusBadge(broadcast.status)}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {broadcast.message.substring(0, 80)}...
                    </div>
                    {broadcast.sent_at && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <CheckCircle className="w-3 h-3" />
                        Отправлено: {broadcast.sent_count} | Ошибок: {broadcast.failed_count}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {broadcast.status === 'draft' && (
                      <>
                        <Button 
                          size="sm" 
                          className="bg-secondary text-secondary-foreground"
                          onClick={() => handleSend(broadcast)}
                          disabled={sending === broadcast.id}
                        >
                          {sending === broadcast.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(broadcast)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(broadcast.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {broadcasts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Send className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Нет рассылок</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BroadcastsAdminTab;
