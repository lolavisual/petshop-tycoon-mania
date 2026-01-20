import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Bot, User, Sparkles, ArrowLeft, Loader2, 
  PawPrint, Heart, Stethoscope, Apple, Scissors, HelpCircle,
  Image, X, History, Plus, Trash2, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { useConsultantChat } from '@/hooks/useConsultantChat';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: Date;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lovable-ai-chat`;

const quickTopics = [
  { icon: Apple, label: 'Питание', query: 'Как правильно кормить моего питомца?' },
  { icon: Stethoscope, label: 'Здоровье', query: 'Какие признаки болезни у питомца?' },
  { icon: Scissors, label: 'Уход', query: 'Как ухаживать за шерстью?' },
  { icon: Heart, label: 'Воспитание', query: 'Как воспитывать питомца?' },
  { icon: PawPrint, label: 'Породы', query: 'Помоги выбрать породу для квартиры' },
  { icon: HelpCircle, label: 'Советы', query: 'Что нужно знать новому владельцу питомца?' },
];

const SYSTEM_PROMPT = `Ты — дружелюбный AI-консультант зоомагазина PetShop по уходу за питомцами.
             
Твои экспертные области:
- Питание животных (рацион, корма, диеты)
- Здоровье (симптомы, профилактика, когда к ветеринару)
- Уход (гигиена, шерсть, когти, зубы)
- Воспитание и дрессировка
- Выбор породы под стиль жизни
- Содержание (клетки, аквариумы, лежанки)
- Анализ фотографий питомцев (порода, здоровье, поведение)

Правила:
1. Отвечай на русском языке
2. Будь дружелюбным и используй эмодзи 🐱🐕🐹
3. Давай практичные и конкретные советы
4. При серьёзных симптомах рекомендуй обратиться к ветеринару
5. Можешь рекомендовать категории товаров, но не конкретные бренды
6. Держи ответы информативными, но не слишком длинными (до 300 слов)
7. Если пользователь отправил фото, внимательно проанализируй его и дай рекомендации`;

const PetConsultant = () => {
  const {
    messages,
    setMessages,
    chatSessions,
    currentChatId,
    isLoadingHistory,
    isAuthenticated,
    loadChatMessages,
    createNewChat,
    saveMessage,
    uploadImage,
    deleteChat,
  } = useConsultantChat();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Welcome message on first load
  useEffect(() => {
    if (messages.length === 0 && !isLoadingHistory) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: '🐾 Привет! Я AI-консультант PetShop. Помогу с любыми вопросами о питомцах:\n\n• Питание и диеты\n• Здоровье и уход\n• Выбор породы\n• Воспитание и дрессировка\n• 📷 Анализ фото питомца\n\nО ком бы ты хотел узнать — кошке, собаке или другом питомце?',
        timestamp: new Date(),
      }]);
    }
  }, [messages.length, isLoadingHistory, setMessages]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Изображение слишком большое (макс. 5MB)');
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const clearImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const sendMessage = async (messageText: string, imageUrl?: string) => {
    if ((!messageText.trim() && !imageUrl) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim() || 'Проанализируй это фото',
      imageUrl,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    clearImage();
    setIsLoading(true);

    // Save user message
    await saveMessage(userMessage);

    try {
      // Build conversation history for context
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => {
          if (m.imageUrl) {
            return {
              role: m.role,
              content: [
                { type: 'text', text: m.content },
                { type: 'image_url', image_url: { url: m.imageUrl } }
              ]
            };
          }
          return { role: m.role, content: m.content };
        });
      
      // Add current message
      if (imageUrl) {
        history.push({
          role: 'user',
          content: [
            { type: 'text', text: messageText.trim() || 'Проанализируй это фото моего питомца. Определи породу, состояние здоровья и дай рекомендации.' },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        });
      } else {
        history.push({ role: 'user', content: messageText.trim() });
      }

      const useStreaming = !imageUrl;

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: history,
          options: {
            stream: useStreaming,
            systemPrompt: SYSTEM_PROMPT,
            temperature: 0.7,
            maxTokens: 1000,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка сервиса');
      }

      const assistantId = (Date.now() + 1).toString();

      if (useStreaming) {
        // Stream handling
        let assistantContent = '';
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('Stream not available');
        }

        // Add empty assistant message to update
        setMessages(prev => [...prev, {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        }]);

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          let newlineIndex;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => 
                  prev.map(m => m.id === assistantId 
                    ? { ...m, content: assistantContent } 
                    : m
                  )
                );
              }
            } catch {
              // Partial JSON, will be completed next chunk
              buffer = line + '\n' + buffer;
              break;
            }
          }
        }

        // Save assistant message
        await saveMessage({
          id: assistantId,
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
        });
      } else {
        // Non-streaming for images
        const data = await response.json();
        const assistantContent = data.content || 'Извините, не удалось получить ответ.';

        const assistantMessage: Message = {
          id: assistantId,
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        await saveMessage(assistantMessage);
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Произошла ошибка';
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `😔 Извините, произошла ошибка: ${errorMessage}. Попробуйте ещё раз.`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let imageUrl: string | undefined;
    
    if (selectedImage) {
      setIsUploading(true);
      try {
        const uploadedUrl = await uploadImage(selectedImage);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          // Fallback to base64 if upload fails
          imageUrl = imagePreview || undefined;
        }
      } catch {
        imageUrl = imagePreview || undefined;
      } finally {
        setIsUploading(false);
      }
    }

    sendMessage(input, imageUrl);
  };

  const handleQuickTopic = (query: string) => {
    sendMessage(query);
  };

  const handleNewChat = async () => {
    await createNewChat();
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: '🐾 Новый чат начат! Чем могу помочь?',
      timestamp: new Date(),
    }]);
  };

  const handleLoadChat = async (chatId: string) => {
    await loadChatMessages(chatId);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Link to="/">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
            </div>
            <div>
              <h1 className="font-bold text-lg">AI Консультант</h1>
              <p className="text-xs text-muted-foreground">Эксперт по уходу за питомцами</p>
            </div>
          </div>
          
          {/* History & New Chat buttons */}
          <div className="flex gap-2">
            {isAuthenticated && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <History className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>История чатов</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-2">
                    <Button 
                      onClick={handleNewChat} 
                      className="w-full justify-start gap-2"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4" />
                      Новый чат
                    </Button>
                    
                    {chatSessions.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        Нет сохранённых чатов
                      </p>
                    ) : (
                      <div className="space-y-1 mt-4">
                        {chatSessions.map(session => (
                          <div 
                            key={session.id} 
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                              currentChatId === session.id ? 'bg-muted' : ''
                            }`}
                          >
                            <button
                              onClick={() => handleLoadChat(session.id)}
                              className="flex-1 flex items-center gap-2 text-left"
                            >
                              <MessageSquare className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{formatDate(session.updatedAt)}</span>
                            </button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteChat(session.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>
        </div>
      </header>

      {/* Loading history indicator */}
      {isLoadingHistory && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Загрузка истории...</span>
        </div>
      )}

      {/* Quick Topics (show only if no user messages yet) */}
      {messages.filter(m => m.role === 'user').length === 0 && !isLoadingHistory && (
        <div className="px-4 py-4 max-w-2xl mx-auto w-full">
          <p className="text-sm text-muted-foreground mb-3">Популярные темы:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickTopics.map((topic) => (
              <Button
                key={topic.label}
                variant="outline"
                className="h-auto py-3 px-4 justify-start gap-2"
                onClick={() => handleQuickTopic(topic.query)}
              >
                <topic.icon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm">{topic.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 px-4">
        <div className="max-w-2xl mx-auto py-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  }`}
                >
                  {message.imageUrl && (
                    <img 
                      src={message.imageUrl} 
                      alt="Pet" 
                      className="rounded-lg mb-2 max-h-48 object-cover"
                    />
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.content === '' && message.role === 'assistant' && (
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 max-w-2xl mx-auto w-full">
          <div className="relative inline-block">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="h-20 rounded-lg object-cover"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={clearImage}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="sticky bottom-0 glass-card border-t border-border/50 p-4">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              className="shrink-0"
            >
              <Image className="w-5 h-5" />
            </Button>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedImage ? "Добавьте комментарий к фото..." : "Спросите о питомце..."}
              disabled={isLoading || isUploading}
              className="flex-1 bg-background/50"
            />
            <Button 
              type="submit" 
              disabled={isLoading || isUploading || (!input.trim() && !selectedImage)}
              className="shrink-0"
            >
              {isLoading || isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            📷 Прикрепите фото питомца для анализа. AI может ошибаться — при серьёзных симптомах обратитесь к ветеринару.
          </p>
        </form>
      </div>
    </div>
  );
};

export default PetConsultant;
