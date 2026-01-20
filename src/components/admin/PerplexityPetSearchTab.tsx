import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, Search, Loader2, ExternalLink, BookOpen, 
  Sparkles, AlertCircle, CheckCircle, Copy, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  content: string;
  citations: string[];
  model?: string;
}

const quickSearchTopics = [
  { label: 'Питание кошек', query: 'Как правильно кормить кошку? Суточная норма корма', icon: '🐱' },
  { label: 'Уход за собаками', query: 'Уход за шерстью собаки: советы и рекомендации', icon: '🐕' },
  { label: 'Болезни питомцев', query: 'Распространённые болезни домашних животных и их симптомы', icon: '🏥' },
  { label: 'Дрессировка', query: 'Основы дрессировки собак для начинающих', icon: '🎓' },
  { label: 'Аквариумистика', query: 'Как ухаживать за аквариумными рыбками для новичков', icon: '🐠' },
  { label: 'Попугаи', query: 'Как научить попугая разговаривать', icon: '🦜' },
];

const PerplexityPetSearchTab = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) {
      toast.error('Введите поисковый запрос');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('perplexity-search', {
        body: { 
          query: q,
          options: {
            model: 'sonar',
            systemPrompt: 'Ты эксперт по домашним животным. Отвечай подробно на русском языке, давай практические советы.',
            maxTokens: 2000,
            temperature: 0.3,
          }
        },
      });

      if (invokeError) throw invokeError;

      if (data?.success) {
        setResult({
          content: data.content,
          citations: data.citations || [],
          model: data.model,
        });
        toast.success('Ответ получен');
      } else {
        throw new Error(data?.error || 'Ошибка поиска');
      }
    } catch (err) {
      console.error('Perplexity search error:', err);
      const message = err instanceof Error ? err.message : 'Ошибка при поиске';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
      toast.success('Скопировано в буфер обмена');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Brain className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Perplexity AI Search</h2>
          <p className="text-sm text-muted-foreground">
            AI-поиск информации о питомцах с источниками
          </p>
        </div>
      </div>

      {/* Quick Topics */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          Быстрые темы
        </h3>
        <div className="flex flex-wrap gap-2">
          {quickSearchTopics.map((topic) => (
            <Button
              key={topic.query}
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery(topic.query);
                handleSearch(topic.query);
              }}
              disabled={isLoading}
            >
              <span className="mr-1">{topic.icon}</span>
              {topic.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Search Input */}
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Search className="w-4 h-4" />
          Поисковый запрос
        </h3>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Как выбрать корм для щенка?"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button 
            onClick={() => handleSearch()} 
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card className="p-4 border-red-500/50 bg-red-500/10">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Ответ AI
              {result.model && (
                <Badge variant="secondary" className="text-xs">
                  {result.model}
                </Badge>
              )}
            </h3>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={copyToClipboard}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleSearch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Textarea
              value={result.content}
              readOnly
              className="min-h-[300px] resize-y font-mono text-sm"
            />
          </div>

          {/* Citations */}
          {result.citations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4" />
                Источники ({result.citations.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.citations.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded hover:bg-muted/80 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate max-w-[200px]">
                      {new URL(url).hostname}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Info */}
      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-2">💡 Возможности Perplexity</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>AI-поиск:</strong> Умный поиск с обработкой естественного языка</li>
          <li>• <strong>Источники:</strong> Все ответы подкреплены ссылками на источники</li>
          <li>• <strong>Актуальность:</strong> Поиск по актуальной информации в интернете</li>
          <li>• Используйте для советов по уходу, питанию и здоровью питомцев</li>
        </ul>
      </Card>
    </motion.div>
  );
};

export default PerplexityPetSearchTab;
