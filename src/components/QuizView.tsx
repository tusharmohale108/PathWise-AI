import React, { useState, useEffect } from 'react';
import { generateQuiz } from '../services/gemini';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, CheckCircle2, XCircle, Trophy, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

interface QuizProps {
  topic: string;
  level: string;
  onComplete: (score: number) => void;
  onCancel: () => void;
}

export const QuizView: React.FC<QuizProps> = ({ topic, level, onComplete, onCancel }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [topic, level]);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const data = await generateQuiz(topic, level);
      setQuestions(data.questions);
    } catch (err) {
      toast.error("Failed to load quiz. Try again later.");
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelected(index);
    setAnswered(true);
    if (index === questions[currentIndex].correctIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-600 font-medium">Generating your customized quiz...</p>
      </div>
    );
  }

  if (showResult) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="text-center p-8 bg-white border-2 border-slate-100 shadow-2xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <Trophy className="h-10 w-10" />
          </div>
          <CardTitle className="text-3xl mb-2">Quiz Results</CardTitle>
          <CardDescription className="text-lg">
            Topic: <span className="text-slate-900 font-bold">{topic}</span>
          </CardDescription>
          <div className="my-8">
            <p className="text-5xl font-black text-indigo-600">{score} / {questions.length}</p>
            <p className="text-slate-500 font-medium mt-2">
              {score === questions.length ? "Perfect Score! You nailed it." : 
               score >= questions.length / 2 ? "Good job! You're getting there." : 
               "Keep practicing. Review the module and try again."}
            </p>
          </div>
          <CardFooter className="flex justify-center gap-4">
            <Button variant="outline" onClick={onCancel}>Close</Button>
            <Button onClick={() => onComplete(score)}>Finish Review</Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }

  const q = questions[currentIndex];

  return (
    <Card className="w-full max-w-xl mx-auto shadow-xl border-slate-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 uppercase tracking-widest text-[10px]">{topic}</Badge>
          <span className="text-xs font-bold text-slate-400">Question {currentIndex + 1} of {questions.length}</span>
        </div>
        <ProgressBar value={((currentIndex + 1) / questions.length) * 100} className="h-1" />
        <CardTitle className="mt-6 text-xl leading-relaxed">{q.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={answered}
            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
              selected === i 
                ? (i === q.correctIndex ? 'border-emerald-500 bg-emerald-50' : 'border-rose-500 bg-rose-50')
                : (answered && i === q.correctIndex ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-indigo-200 bg-white')
            }`}
          >
            <span className={`font-medium ${selected === i || (answered && i === q.correctIndex) ? 'text-slate-900' : 'text-slate-600'}`}>
              {opt}
            </span>
            {answered && i === q.correctIndex && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            {answered && selected === i && i !== q.correctIndex && <XCircle className="h-5 w-5 text-rose-600" />}
          </button>
        ))}
      </CardContent>
      <CardFooter className="flex justify-between border-t border-slate-50 pt-6">
        <Button variant="ghost" onClick={onCancel}>Exit Quiz</Button>
        <Button onClick={handleNext} disabled={!answered} className="bg-indigo-600">
          {currentIndex < questions.length - 1 ? "Next Question" : "See Results"}
        </Button>
      </CardFooter>
    </Card>
  );
};

const ProgressBar = ({ value, className }: { value: number, className?: string }) => (
  <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${className}`}>
    <div 
      className="h-full bg-indigo-600 transition-all duration-500" 
      style={{ width: `${value}%` }} 
    />
  </div>
);
