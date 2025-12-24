import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useArticles, Article } from '@/hooks/useArticles';
import { hapticImpact } from '@/lib/telegram';
import { 
  FileText, Send, Clock, CheckCircle, XCircle, 
  Loader2, AlertCircle, Gift, ChevronDown, ChevronUp 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MIN_CONTENT_LENGTH = 50;

const ArticlesPage = () => {
  const { articles, loading, creating, createArticle, getStats } = useArticles();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

  const stats = getStats();
  const charCount = content.length;
  const isValid = title.trim().length > 0 && charCount >= MIN_CONTENT_LENGTH;

  const handleSubmit = async () => {
    if (!isValid || creating) return;
    
    const success = await createArticle(title, content);
    if (success) {
      setTitle('');
      setContent('');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-secondary" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'На модерации';
      case 'approved':
        return 'Одобрена';
      case 'rejected':
        return 'Отклонена';
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/20 text-amber-600';
      case 'approved':
        return 'bg-secondary/20 text-secondary';
      case 'rejected':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <FileText className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="p-4 space-y-4 pb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Статистика */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Мои статьи
          </h2>
          {stats.totalReward > 0 && (
            <div className="flex items-center gap-1 text-sm currency-diamond">
              <Gift className="w-4 h-4" />
              +{stats.totalReward.toLocaleString()}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="bg-amber-500/10 rounded-lg p-2">
            <div className="font-bold text-amber-600">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">На проверке</div>
          </div>
          <div className="bg-secondary/10 rounded-lg p-2">
            <div className="font-bold text-secondary">{stats.approved}</div>
            <div className="text-xs text-muted-foreground">Одобрено</div>
          </div>
          <div className="bg-destructive/10 rounded-lg p-2">
            <div className="font-bold text-destructive">{stats.rejected}</div>
            <div className="text-xs text-muted-foreground">Отклонено</div>
          </div>
        </div>
      </div>

      {/* Информация о награде */}
      <div className="glass-card p-4 rounded-2xl bg-gradient-to-r from-diamond/10 to-transparent">
        <div className="flex items-start gap-3">
          <Gift className="w-6 h-6 text-diamond flex-shrink-0" />
          <div>
            <h3 className="font-bold text-sm">Получите 1000 💎💎 за статью!</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Напишите интересную статью о питомцах (минимум 50 символов). 
              После одобрения модератором вам начислятся алмазы.
            </p>
          </div>
        </div>
      </div>

      {/* Форма создания */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <button
          className="w-full p-4 flex items-center justify-between font-bold"
          onClick={() => {
            hapticImpact('light');
            setShowForm(!showForm);
          }}
        >
          <span className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Написать статью
          </span>
          {showForm ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                <Input
                  placeholder="Заголовок статьи"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  disabled={creating}
                />
                
                <div className="relative">
                  <textarea
                    className="w-full p-3 rounded-xl bg-muted border-0 resize-none min-h-[120px] text-sm"
                    placeholder="Напишите что-нибудь интересное о питомцах, уходе за ними, забавные истории..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={2000}
                    disabled={creating}
                  />
                  <div className={`absolute bottom-2 right-2 text-xs ${
                    charCount >= MIN_CONTENT_LENGTH ? 'text-secondary' : 'text-muted-foreground'
                  }`}>
                    {charCount}/{MIN_CONTENT_LENGTH}+
                  </div>
                </div>

                {charCount > 0 && charCount < MIN_CONTENT_LENGTH && (
                  <div className="flex items-center gap-2 text-xs text-amber-600">
                    <AlertCircle className="w-3 h-3" />
                    Ещё {MIN_CONTENT_LENGTH - charCount} символов
                  </div>
                )}

                <Button
                  className="w-full btn-gradient-primary"
                  disabled={!isValid || creating}
                  onClick={handleSubmit}
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Отправить на модерацию
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Список статей */}
      {articles.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-muted-foreground px-1">
            Ваши статьи ({articles.length})
          </h3>
          
          {articles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card rounded-xl overflow-hidden"
            >
              <button
                className="w-full p-4 text-left"
                onClick={() => {
                  hapticImpact('light');
                  setExpandedArticle(expandedArticle === article.id ? null : article.id);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate">{article.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(article.created_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${getStatusClass(article.status)}`}>
                      {getStatusIcon(article.status)}
                      {getStatusText(article.status)}
                    </span>
                    {expandedArticle === article.id 
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    }
                  </div>
                </div>
              </button>
              
              <AnimatePresence>
                {expandedArticle === article.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {article.content}
                      </p>
                      
                      {article.status === 'approved' && (
                        <div className="flex items-center gap-2 text-sm text-secondary bg-secondary/10 p-2 rounded-lg">
                          <Gift className="w-4 h-4" />
                          Награда: +1000 💎💎
                        </div>
                      )}
                      
                      {article.status === 'rejected' && article.rejection_reason && (
                        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded-lg">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-medium">Причина отклонения:</div>
                            <div className="text-xs mt-1">{article.rejection_reason}</div>
                          </div>
                        </div>
                      )}
                      
                      {article.reviewed_at && (
                        <div className="text-xs text-muted-foreground">
                          Проверено: {new Date(article.reviewed_at).toLocaleDateString('ru-RU')}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>У вас пока нет статей</p>
          <p className="text-sm mt-1">Напишите первую и получите награду!</p>
        </div>
      )}
    </motion.div>
  );
};

export default ArticlesPage;
