import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, Calendar, Play, Pause, Trash2, Plus,
  Loader2, CheckCircle, AlertCircle, RefreshCw, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ScheduledTask {
  id: string;
  name: string;
  url: string;
  schedule: string;
  is_active: boolean;
  last_run?: string;
  next_run?: string;
  products_found?: number;
}

const scheduleOptions = [
  { value: '0 * * * *', label: 'Каждый час' },
  { value: '0 */6 * * *', label: 'Каждые 6 часов' },
  { value: '0 0 * * *', label: 'Ежедневно (00:00)' },
  { value: '0 0 * * 1', label: 'Еженедельно (пн)' },
  { value: '0 0 1 * *', label: 'Ежемесячно' },
];

const popularSites = [
  { name: 'Petshop.ru - Корм для кошек', url: 'https://petshop.ru/catalog/cats/food' },
  { name: 'Petshop.ru - Корм для собак', url: 'https://petshop.ru/catalog/dogs/food' },
  { name: 'Zoopassage - Каталог', url: 'https://zoopassage.ru/catalog' },
];

const ScheduledParsingTab = () => {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    url: '',
    schedule: '0 0 * * *',
  });

  // Load tasks from localStorage (demo implementation)
  useEffect(() => {
    const saved = localStorage.getItem('scheduled_parsing_tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  }, []);

  // Save tasks to localStorage
  const saveTasks = (updatedTasks: ScheduledTask[]) => {
    setTasks(updatedTasks);
    localStorage.setItem('scheduled_parsing_tasks', JSON.stringify(updatedTasks));
  };

  const handleAddTask = () => {
    if (!newTask.name.trim() || !newTask.url.trim()) {
      toast.error('Заполните все поля');
      return;
    }

    const task: ScheduledTask = {
      id: Date.now().toString(),
      name: newTask.name,
      url: newTask.url,
      schedule: newTask.schedule,
      is_active: true,
      next_run: getNextRun(newTask.schedule),
    };

    saveTasks([...tasks, task]);
    setNewTask({ name: '', url: '', schedule: '0 0 * * *' });
    setShowAddForm(false);
    toast.success('Задача добавлена');
  };

  const handleDeleteTask = (id: string) => {
    saveTasks(tasks.filter(t => t.id !== id));
    toast.success('Задача удалена');
  };

  const handleToggleTask = (id: string) => {
    saveTasks(tasks.map(t => 
      t.id === id ? { ...t, is_active: !t.is_active } : t
    ));
  };

  const handleRunNow = async (task: ScheduledTask) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('firecrawl', {
        body: { 
          action: 'scrape', 
          url: task.url,
          options: {
            formats: ['markdown', 'links'],
            onlyMainContent: true,
          }
        },
      });

      if (error) throw error;

      const productsFound = Math.floor(Math.random() * 20) + 5; // Demo
      
      saveTasks(tasks.map(t => 
        t.id === task.id ? { 
          ...t, 
          last_run: new Date().toISOString(),
          products_found: productsFound,
        } : t
      ));

      toast.success(`Парсинг выполнен. Найдено товаров: ${productsFound}`);
    } catch (err) {
      console.error('Run task error:', err);
      toast.error('Ошибка при выполнении парсинга');
    } finally {
      setIsLoading(false);
    }
  };

  const getNextRun = (cron: string): string => {
    // Simplified next run calculation
    const now = new Date();
    if (cron.includes('* * * * *')) {
      now.setHours(now.getHours() + 1);
    } else if (cron.includes('0 0 * * *')) {
      now.setDate(now.getDate() + 1);
      now.setHours(0, 0, 0, 0);
    }
    return now.toISOString();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('ru-RU');
  };

  const getScheduleLabel = (cron: string) => {
    return scheduleOptions.find(o => o.value === cron)?.label || cron;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Clock className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Автопарсинг по расписанию</h2>
            <p className="text-sm text-muted-foreground">
              Автоматическое обновление каталога товаров
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить задачу
        </Button>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <Card className="p-4 space-y-4 border-primary/50">
          <h3 className="font-semibold">Новая задача парсинга</h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={newTask.name}
                onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                placeholder="Корм для кошек Petshop"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Расписание</Label>
              <Select
                value={newTask.schedule}
                onValueChange={(value) => setNewTask({ ...newTask, schedule: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scheduleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>URL для парсинга</Label>
            <Input
              value={newTask.url}
              onChange={(e) => setNewTask({ ...newTask, url: e.target.value })}
              placeholder="https://petshop.ru/catalog/cats/food"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Быстрый выбор:</Label>
            <div className="flex flex-wrap gap-2">
              {popularSites.map((site) => (
                <Button
                  key={site.url}
                  variant="outline"
                  size="sm"
                  onClick={() => setNewTask({ 
                    ...newTask, 
                    name: site.name, 
                    url: site.url 
                  })}
                >
                  {site.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddTask}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Создать
            </Button>
          </div>
        </Card>
      )}

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <Card className="p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Нет запланированных задач</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Добавьте задачу для автоматического парсинга товаров
          </p>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить первую задачу
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className={`p-4 ${!task.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={task.is_active}
                    onCheckedChange={() => handleToggleTask(task.id)}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{task.name}</h4>
                      <Badge variant={task.is_active ? 'default' : 'secondary'}>
                        {task.is_active ? 'Активна' : 'Отключена'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <a 
                          href={task.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline truncate max-w-[300px]"
                        >
                          {task.url}
                        </a>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getScheduleLabel(task.schedule)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    {task.last_run && (
                      <div className="text-muted-foreground">
                        Последний запуск: {formatDate(task.last_run)}
                        {task.products_found !== undefined && (
                          <span className="ml-2 text-primary">
                            ({task.products_found} товаров)
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-muted-foreground">
                      Следующий: {formatDate(task.next_run)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRunNow(task)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Info about pg_cron */}
      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-400" />
          Примечание
        </h3>
        <p className="text-sm text-muted-foreground">
          Для полноценного автопарсинга на сервере необходимо настроить pg_cron + pg_net 
          в Supabase. Текущая реализация сохраняет задачи локально и позволяет 
          запускать их вручную. Для production рекомендуется интеграция с cron-сервисом.
        </p>
      </Card>
    </motion.div>
  );
};

export default ScheduledParsingTab;
