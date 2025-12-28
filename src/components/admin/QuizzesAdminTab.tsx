import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, Trash2, Save, X, Loader2, HelpCircle, 
  Edit2, Gift, ChevronDown, ChevronUp 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  questions: QuizQuestion[];
  reward_type: string;
  reward_value: string | null;
  is_active: boolean;
  created_at: string;
}

const QuizzesAdminTab = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Quiz | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState(false);

  const emptyQuestion: QuizQuestion = {
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
  };

  const emptyQuiz: Omit<Quiz, 'id' | 'created_at'> = {
    title: '',
    description: null,
    questions: [emptyQuestion],
    reward_type: 'discount',
    reward_value: '10',
    is_active: true,
  };

  const [newQuiz, setNewQuiz] = useState(emptyQuiz);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      // Parse questions from JSONB - cast through unknown
      const parsed = (data || []).map(q => ({
        id: q.id,
        title: q.title,
        description: q.description,
        questions: (Array.isArray(q.questions) ? q.questions : []) as unknown as QuizQuestion[],
        reward_type: q.reward_type,
        reward_value: q.reward_value,
        is_active: q.is_active,
        created_at: q.created_at,
      }));
      setQuizzes(parsed);
    } catch (err) {
      console.error('Error loading quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = (target: 'new' | 'edit') => {
    if (target === 'new') {
      setNewQuiz({ ...newQuiz, questions: [...newQuiz.questions, emptyQuestion] });
    } else if (editing) {
      setEditing({ ...editing, questions: [...editing.questions, emptyQuestion] });
    }
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: string | number | string[], target: 'new' | 'edit') => {
    if (target === 'new') {
      const updated = [...newQuiz.questions];
      updated[index] = { ...updated[index], [field]: value };
      setNewQuiz({ ...newQuiz, questions: updated });
    } else if (editing) {
      const updated = [...editing.questions];
      updated[index] = { ...updated[index], [field]: value };
      setEditing({ ...editing, questions: updated });
    }
  };

  const updateOption = (qIndex: number, optIndex: number, value: string, target: 'new' | 'edit') => {
    if (target === 'new') {
      const updated = [...newQuiz.questions];
      updated[qIndex].options[optIndex] = value;
      setNewQuiz({ ...newQuiz, questions: updated });
    } else if (editing) {
      const updated = [...editing.questions];
      updated[qIndex].options[optIndex] = value;
      setEditing({ ...editing, questions: updated });
    }
  };

  const removeQuestion = (index: number, target: 'new' | 'edit') => {
    if (target === 'new') {
      if (newQuiz.questions.length <= 1) return;
      const updated = newQuiz.questions.filter((_, i) => i !== index);
      setNewQuiz({ ...newQuiz, questions: updated });
    } else if (editing) {
      if (editing.questions.length <= 1) return;
      const updated = editing.questions.filter((_, i) => i !== index);
      setEditing({ ...editing, questions: updated });
    }
  };

  const handleCreate = async () => {
    if (!newQuiz.title.trim()) {
      toast.error('Введите название квиза');
      return;
    }
    if (newQuiz.questions.some(q => !q.question.trim())) {
      toast.error('Заполните все вопросы');
      return;
    }

    try {
      const { error } = await supabase.from('quizzes').insert([{
        title: newQuiz.title,
        description: newQuiz.description,
        questions: JSON.parse(JSON.stringify(newQuiz.questions)),
        reward_type: newQuiz.reward_type,
        reward_value: newQuiz.reward_value,
        is_active: newQuiz.is_active,
      }]);
      if (error) throw error;
      
      toast.success('Квиз создан');
      setIsCreating(false);
      setNewQuiz(emptyQuiz);
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
        .from('quizzes')
        .update({
          title: editing.title,
          description: editing.description,
          questions: JSON.parse(JSON.stringify(editing.questions)),
          reward_type: editing.reward_type,
          reward_value: editing.reward_value,
          is_active: editing.is_active,
        })
        .eq('id', editing.id);

      if (error) throw error;
      
      toast.success('Квиз обновлён');
      setEditing(null);
      loadData();
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Ошибка обновления');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить квиз?')) return;

    try {
      const { error } = await supabase.from('quizzes').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('Квиз удалён');
      loadData();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Ошибка удаления');
    }
  };

  const QuestionEditor = ({ questions, target }: { questions: QuizQuestion[]; target: 'new' | 'edit' }) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-xs text-muted-foreground">Вопросы ({questions.length})</label>
        <Button size="sm" variant="outline" onClick={() => setExpandedQuestions(!expandedQuestions)}>
          {expandedQuestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>
      
      {expandedQuestions && questions.map((q, qIndex) => (
        <div key={qIndex} className="bg-muted/50 p-3 rounded-lg space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder={`Вопрос ${qIndex + 1}`}
              value={q.question}
              onChange={(e) => updateQuestion(qIndex, 'question', e.target.value, target)}
              className="flex-1"
            />
            {questions.length > 1 && (
              <Button size="sm" variant="destructive" onClick={() => removeQuestion(qIndex, target)}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt, optIndex) => (
              <div key={optIndex} className="flex items-center gap-1">
                <input
                  type="radio"
                  name={`correct-${target}-${qIndex}`}
                  checked={q.correctIndex === optIndex}
                  onChange={() => updateQuestion(qIndex, 'correctIndex', optIndex, target)}
                />
                <Input
                  placeholder={`Вариант ${optIndex + 1}`}
                  value={opt}
                  onChange={(e) => updateOption(qIndex, optIndex, e.target.value, target)}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <Button size="sm" variant="outline" className="w-full" onClick={() => addQuestion(target)}>
        <Plus className="w-4 h-4 mr-1" />
        Добавить вопрос
      </Button>
    </div>
  );

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
      <Button
        className="w-full btn-gradient-primary"
        onClick={() => { setIsCreating(true); setExpandedQuestions(true); }}
        disabled={isCreating}
      >
        <Plus className="w-4 h-4 mr-2" />
        Создать квиз
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
              <HelpCircle className="w-4 h-4" />
              Новый квиз
            </h3>
            <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <Input
            placeholder="Название квиза"
            value={newQuiz.title}
            onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
          />

          <Input
            placeholder="Описание"
            value={newQuiz.description || ''}
            onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
          />

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Награда</label>
              <select
                className="w-full px-3 py-2 rounded-lg bg-background border border-input"
                value={newQuiz.reward_type}
                onChange={(e) => setNewQuiz({ ...newQuiz, reward_type: e.target.value })}
              >
                <option value="discount">Скидка %</option>
                <option value="promo">Промокод</option>
                <option value="gift">Подарок</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Значение</label>
              <Input
                placeholder="10"
                value={newQuiz.reward_value || ''}
                onChange={(e) => setNewQuiz({ ...newQuiz, reward_value: e.target.value })}
              />
            </div>
          </div>

          <QuestionEditor questions={newQuiz.questions} target="new" />

          <Button className="w-full" onClick={handleCreate}>
            <Save className="w-4 h-4 mr-2" />
            Создать квиз
          </Button>
        </motion.div>
      )}

      {/* Список квизов */}
      <div className="space-y-2">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="glass-card p-3 rounded-xl">
            {editing?.id === quiz.id ? (
              <div className="space-y-3">
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
                <Input
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
                <div className="flex gap-2">
                  <select
                    className="flex-1 px-3 py-2 rounded-lg bg-background border border-input"
                    value={editing.reward_type}
                    onChange={(e) => setEditing({ ...editing, reward_type: e.target.value })}
                  >
                    <option value="discount">Скидка %</option>
                    <option value="promo">Промокод</option>
                    <option value="gift">Подарок</option>
                  </select>
                  <Input
                    className="w-24"
                    value={editing.reward_value || ''}
                    onChange={(e) => setEditing({ ...editing, reward_value: e.target.value })}
                  />
                </div>
                <QuestionEditor questions={editing.questions} target="edit" />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.is_active}
                    onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  />
                  Активен
                </label>
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
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${quiz.is_active ? 'bg-primary/20' : 'bg-muted'}`}>
                  <HelpCircle className={`w-5 h-5 ${quiz.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate flex items-center gap-2">
                    {quiz.title}
                    {!quiz.is_active && <span className="text-xs text-muted-foreground">(неактивен)</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {quiz.questions.length} вопросов • 
                    <Gift className="w-3 h-3 inline mx-1" />
                    {quiz.reward_type === 'discount' && `${quiz.reward_value}% скидка`}
                    {quiz.reward_type === 'promo' && quiz.reward_value}
                    {quiz.reward_type === 'gift' && quiz.reward_value}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(quiz); setExpandedQuestions(true); }}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(quiz.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {quizzes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <HelpCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Нет квизов</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default QuizzesAdminTab;
