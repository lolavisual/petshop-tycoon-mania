import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, Clock, TrendingUp, Users, 
  Command, Loader2, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

interface MessageLog {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  user_message: string;
  bot_response: string;
  response_time_ms: number | null;
  is_command: boolean | null;
  command_type: string | null;
  created_at: string;
}

interface AnalyticsStats {
  totalMessages: number;
  uniqueUsers: number;
  avgResponseTime: number;
  commandsCount: number;
  todayMessages: number;
  messagesPerHour: { hour: string; count: number }[];
  topQuestions: { question: string; count: number }[];
  commandsBreakdown: { name: string; value: number }[];
  responseTimeHistory: { date: string; avgTime: number }[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28'];

const BotAnalyticsTab = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [recentMessages, setRecentMessages] = useState<MessageLog[]>([]);
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch all message logs
      const { data: logs, error } = await supabase
        .from('bot_message_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const messages = logs || [];
      setRecentMessages(messages.slice(0, 50));

      // Calculate stats
      const uniqueUsers = new Set(messages.map(m => m.telegram_id)).size;
      const avgResponseTime = messages.length > 0
        ? Math.round(messages.reduce((sum, m) => sum + (m.response_time_ms || 0), 0) / messages.length)
        : 0;
      
      const commandMessages = messages.filter(m => m.is_command);
      
      // Today's messages
      const today = new Date().toDateString();
      const todayMessages = messages.filter(m => 
        new Date(m.created_at).toDateString() === today
      ).length;

      // Messages per hour (last 24h)
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentLogs = messages.filter(m => new Date(m.created_at) >= last24h);
      const hourCounts: Record<number, number> = {};
      recentLogs.forEach(m => {
        const hour = new Date(m.created_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      const messagesPerHour = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        count: hourCounts[i] || 0
      }));

      // Top questions (non-command messages)
      const questionCounts: Record<string, number> = {};
      messages
        .filter(m => !m.is_command)
        .forEach(m => {
          const q = m.user_message.toLowerCase().trim().slice(0, 50);
          questionCounts[q] = (questionCounts[q] || 0) + 1;
        });
      const topQuestions = Object.entries(questionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([question, count]) => ({ question, count }));

      // Commands breakdown
      const cmdCounts: Record<string, number> = {};
      commandMessages.forEach(m => {
        const cmd = m.command_type || 'unknown';
        cmdCounts[cmd] = (cmdCounts[cmd] || 0) + 1;
      });
      const commandsBreakdown = Object.entries(cmdCounts)
        .map(([name, value]) => ({ name, value }));

      // Response time history (last 7 days)
      const days: Record<string, { sum: number; count: number }> = {};
      messages.forEach(m => {
        const date = new Date(m.created_at).toLocaleDateString('ru');
        if (!days[date]) days[date] = { sum: 0, count: 0 };
        days[date].sum += m.response_time_ms || 0;
        days[date].count++;
      });
      const responseTimeHistory = Object.entries(days)
        .slice(0, 7)
        .reverse()
        .map(([date, { sum, count }]) => ({
          date,
          avgTime: Math.round(sum / count)
        }));

      setStats({
        totalMessages: messages.length,
        uniqueUsers,
        avgResponseTime,
        commandsCount: commandMessages.length,
        todayMessages,
        messagesPerHour,
        topQuestions,
        commandsBreakdown,
        responseTimeHistory
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Аналитика бота
        </h2>
        <Button size="sm" variant="outline" onClick={loadAnalytics}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatsCard
              icon={MessageSquare}
              label="Всего сообщений"
              value={stats.totalMessages}
              color="text-primary"
            />
            <StatsCard
              icon={Users}
              label="Уникальных юзеров"
              value={stats.uniqueUsers}
              color="text-secondary"
            />
            <StatsCard
              icon={Clock}
              label="Ср. время ответа"
              value={`${stats.avgResponseTime}ms`}
              color="text-yellow-500"
            />
            <StatsCard
              icon={TrendingUp}
              label="Сегодня"
              value={stats.todayMessages}
              color="text-green-500"
            />
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Messages per Hour */}
            <div className="glass-card p-4 rounded-2xl">
              <h3 className="font-bold mb-4">📊 Сообщений по часам (24ч)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.messagesPerHour}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="hour" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Commands Breakdown */}
            <div className="glass-card p-4 rounded-2xl">
              <h3 className="font-bold mb-4">⚡ Использование команд</h3>
              {stats.commandsBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={stats.commandsBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {stats.commandsBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  Нет данных о командах
                </div>
              )}
            </div>
          </div>

          {/* Response Time History */}
          <div className="glass-card p-4 rounded-2xl">
            <h3 className="font-bold mb-4">⏱️ Время ответа по дням</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.responseTimeHistory}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} unit="ms" />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="avgTime" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Questions */}
          <div className="glass-card p-4 rounded-2xl">
            <h3 className="font-bold mb-4">❓ Популярные вопросы</h3>
            <div className="space-y-2">
              {stats.topQuestions.map((q, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm truncate flex-1">{q.question}</span>
                  <span className="text-xs bg-primary/20 px-2 py-1 rounded-full ml-2">
                    {q.count}
                  </span>
                </div>
              ))}
              {stats.topQuestions.length === 0 && (
                <p className="text-muted-foreground text-sm">Нет данных</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Recent Messages */}
      <div className="glass-card p-4 rounded-2xl">
        <h3 className="font-bold mb-4">💬 Последние сообщения</h3>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {recentMessages.map(msg => (
            <div 
              key={msg.id} 
              className="bg-muted/50 p-3 rounded-xl cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => setExpandedMessage(expandedMessage === msg.id ? null : msg.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {msg.first_name || msg.username || `ID: ${msg.telegram_id}`}
                    </span>
                    {msg.is_command && (
                      <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                        <Command className="w-3 h-3 inline mr-1" />
                        {msg.command_type}
                      </span>
                    )}
                    {msg.response_time_ms && (
                      <span className="text-xs text-muted-foreground">
                        {msg.response_time_ms}ms
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    👤 {msg.user_message.slice(0, 100)}{msg.user_message.length > 100 ? '...' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {expandedMessage === msg.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
              
              {expandedMessage === msg.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 pt-3 border-t border-border/50"
                >
                  <p className="text-sm">
                    🤖 {msg.bot_response}
                  </p>
                </motion.div>
              )}
            </div>
          ))}
          {recentMessages.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Сообщений пока нет
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const StatsCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  color: string;
}) => (
  <div className="glass-card p-4 rounded-2xl">
    <div className="flex items-center gap-3">
      <Icon className={`w-8 h-8 ${color}`} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  </div>
);

export default BotAnalyticsTab;
