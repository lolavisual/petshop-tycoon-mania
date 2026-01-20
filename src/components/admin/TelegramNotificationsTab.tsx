import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bell, Send, Gift, Snowflake, Loader2, CheckCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const TelegramNotificationsTab = () => {
  const [sendingDaily, setSendingDaily] = useState(false);
  const [sendingSeasonal, setSendingSeasonal] = useState(false);
  const [dailyResult, setDailyResult] = useState<number | null>(null);
  const [seasonalResult, setSeasonalResult] = useState<number | null>(null);

  const sendDailyNotifications = async () => {
    setSendingDaily(true);
    setDailyResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { action: 'send_daily_notifications' }
      });

      if (error) {
        throw error;
      }

      if (data?.sent !== undefined) {
        setDailyResult(data.sent);
        toast.success(`Уведомления отправлены: ${data.sent} пользователям`);
      } else {
        toast.error('Ошибка отправки');
      }
    } catch (error) {
      console.error('Error sending daily notifications:', error);
      toast.error('Ошибка отправки уведомлений');
    } finally {
      setSendingDaily(false);
    }
  };

  const sendSeasonalNotifications = async () => {
    setSendingSeasonal(true);
    setSeasonalResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { action: 'send_seasonal_notification' }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        toast.error(data.error === 'No active event' ? 'Нет активного события' : data.error);
        return;
      }

      if (data?.sent !== undefined) {
        setSeasonalResult(data.sent);
        toast.success(`Уведомления отправлены: ${data.sent} пользователям`);
      }
    } catch (error) {
      console.error('Error sending seasonal notifications:', error);
      toast.error('Ошибка отправки уведомлений');
    } finally {
      setSendingSeasonal(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary" />
        <h3 className="font-bold">Telegram уведомления</h3>
      </div>

      {/* Daily Rewards Notification */}
      <div className="glass-card p-4 rounded-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold">Ежедневные награды</h4>
            <p className="text-sm text-muted-foreground">
              Напомнить всем о доступных ежедневных бонусах
            </p>
          </div>
        </div>

        <Button
          className="w-full btn-gradient-primary"
          onClick={sendDailyNotifications}
          disabled={sendingDaily}
        >
          {sendingDaily ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Отправка...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Отправить уведомление
            </>
          )}
        </Button>

        {dailyResult !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-green-500 text-sm"
          >
            <CheckCircle className="w-4 h-4" />
            Отправлено {dailyResult} пользователям
          </motion.div>
        )}
      </div>

      {/* Seasonal Event Notification */}
      <div className="glass-card p-4 rounded-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <Snowflake className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold">Сезонное событие</h4>
            <p className="text-sm text-muted-foreground">
              Уведомить о текущем сезонном событии и наградах
            </p>
          </div>
        </div>

        <Button
          className="w-full btn-gradient-accent"
          onClick={sendSeasonalNotifications}
          disabled={sendingSeasonal}
        >
          {sendingSeasonal ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Отправка...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Отправить уведомление
            </>
          )}
        </Button>

        {seasonalResult !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-green-500 text-sm"
          >
            <CheckCircle className="w-4 h-4" />
            Отправлено {seasonalResult} пользователям
          </motion.div>
        )}
      </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>Уведомления отправляются всем активным подписчикам бота.</p>
        <p>Не злоупотребляйте рассылками — это может привести к блокировкам.</p>
      </div>
    </motion.div>
  );
};

export default TelegramNotificationsTab;
