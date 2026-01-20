import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { 
  Crown, Star, Users, TrendingUp, Ban, RefreshCw, 
  ChevronLeft, ChevronRight, Loader2, Calendar 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Subscription {
  id: string;
  plan_type: string;
  stars_paid: number;
  started_at: string;
  expires_at: string;
  is_active: boolean;
  telegram_payment_id: string | null;
  profiles: {
    telegram_id: number;
    username: string | null;
    first_name: string | null;
  } | null;
}

interface Stats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalStarsEarned: number;
}

const PremiumAdminTab = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load stats
      const { data: statsData } = await supabase.functions.invoke('telegram-stars-payment', {
        body: { action: 'admin_get_stats' }
      });
      if (statsData?.success) {
        setStats(statsData.stats);
      }

      // Load subscriptions
      const { data: subsData } = await supabase.functions.invoke('telegram-stars-payment', {
        body: { action: 'admin_get_subscriptions', page, limit: 20 }
      });
      if (subsData?.success) {
        setSubscriptions(subsData.subscriptions || []);
        setTotal(subsData.total || 0);
      }
    } catch (error) {
      console.error('Error loading premium data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Отменить подписку? Пользователь потеряет Premium-статус.')) return;

    try {
      const { data } = await supabase.functions.invoke('telegram-stars-payment', {
        body: { action: 'admin_cancel_subscription', subscriptionId }
      });
      
      if (data?.success) {
        toast.success('Подписка отменена');
        loadData();
      } else {
        toast.error(data?.error || 'Ошибка отмены');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Ошибка отмены подписки');
    }
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
              <Users className="w-5 h-5" />
              {stats.totalSubscriptions}
            </div>
            <div className="text-xs text-muted-foreground">Всего подписок</div>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-green-500 flex items-center justify-center gap-1">
              <Crown className="w-5 h-5" />
              {stats.activeSubscriptions}
            </div>
            <div className="text-xs text-muted-foreground">Активных</div>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-yellow-500 flex items-center justify-center gap-1">
              <Star className="w-5 h-5" />
              {stats.totalStarsEarned}
            </div>
            <div className="text-xs text-muted-foreground">Звёзд заработано</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-500" />
          Premium подписки
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Subscriptions List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Crown className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Пока нет подписок</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className={`glass-card p-4 rounded-xl ${
                !sub.is_active || isExpired(sub.expires_at) ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    {sub.plan_type}
                    {sub.is_active && !isExpired(sub.expires_at) && (
                      <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">
                        Активна
                      </span>
                    )}
                    {(!sub.is_active || isExpired(sub.expires_at)) && (
                      <span className="text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full">
                        Неактивна
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {sub.profiles?.first_name || sub.profiles?.username || `ID: ${sub.profiles?.telegram_id}`}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      {sub.stars_paid} звёзд
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      до {format(new Date(sub.expires_at), 'dd MMM yyyy', { locale: ru })}
                    </span>
                  </div>
                </div>
                {sub.is_active && !isExpired(sub.expires_at) && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => cancelSubscription(sub.id)}
                  >
                    <Ban className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
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
            <span className="px-3 py-1">{page}</span>
            <Button
              size="sm"
              variant="outline"
              disabled={page * 20 >= total}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PremiumAdminTab;
