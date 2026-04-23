import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, SkillLevel } from '../types';
import { toast } from 'sonner';
import { Loader2, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Survey: React.FC<{ onComplete: (p: UserProfile) => void; hideAuth?: boolean }> = ({ onComplete, hideAuth = false }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    goal: '',
    skillLevel: 'beginner' as SkillLevel,
    timePerDay: 2,
    deadline: '',
  });

  const handleSubmit = async () => {
    if (!user && !hideAuth) return;
    setLoading(true);
    try {
      const profile: UserProfile = {
        userId: user?.uid || 'guest',
        ...formData,
        createdAt: new Date().toISOString(),
      };
      
      if (!hideAuth && user) {
        await setDoc(doc(db, 'profiles', user.uid), profile);
      }
      onComplete(profile);
      if (!hideAuth) toast.success("Profile created! Let's build your roadmap.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save data.");
    } finally {
      setLoading(false);
    }
  };

  const cardContent = (
    <Card className={`w-full ${hideAuth ? 'max-w-none shadow-none border-none' : 'max-w-[32rem] shadow-2xl shadow-indigo-100'} rounded-[2.5rem] border-indigo-100 overflow-hidden bg-white`}>
      <div className="h-2 bg-slate-100 flex overflow-hidden">
        {[1, 2, 3].map((s) => (
          <div 
            key={s} 
            className={`flex-1 transition-all duration-700 ${s <= step ? 'bg-indigo-600' : 'bg-transparent'}`} 
          />
        ))}
      </div>

      <CardHeader className="p-10 pb-6 text-center">
        <CardTitle className="text-3xl font-black text-indigo-950 tracking-tighter uppercase mb-2">
          {hideAuth ? 'New Goal Context' : 'Configure Oracle'}
        </CardTitle>
        <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Specification Phase {step}/3</CardDescription>
      </CardHeader>

      <CardContent className="px-10 py-6 min-h-[300px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <Label htmlFor="goal" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Learning Target</Label>
                <Input 
                  id="goal" 
                  placeholder="e.g. Master React & Node.js" 
                  value={formData.goal}
                  onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                  className="h-14 bg-indigo-50/50 border-indigo-100 rounded-2xl px-6 font-black text-indigo-900 focus:bg-white transition-all shadow-inner"
                />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1 italic opacity-60">* Specific goals yield superior matrices.</p>
              </div>
              <div className="space-y-4">
                <Label htmlFor="level" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Current Skill Variance</Label>
                <Select 
                  value={formData.skillLevel} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, skillLevel: v as SkillLevel }))}
                >
                  <SelectTrigger id="level" className="h-14 border-indigo-100 rounded-2xl px-6 bg-slate-50 font-black text-indigo-900">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-indigo-100 shadow-xl">
                    <SelectItem value="beginner" className="rounded-xl focus:bg-indigo-50">Beginner (Zero State)</SelectItem>
                    <SelectItem value="intermediate" className="rounded-xl focus:bg-indigo-50">Intermediate (Foundation Active)</SelectItem>
                    <SelectItem value="advanced" className="rounded-xl focus:bg-indigo-50">Advanced (Optimization Mode)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <Label htmlFor="time" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Daily Bandwidth (Hours)</Label>
                <Input 
                  id="time" 
                  type="number"
                  min="1"
                  max="24"
                  value={formData.timePerDay}
                  onChange={(e) => setFormData(prev => ({ ...prev, timePerDay: Number(e.target.value) }))}
                  className="h-14 bg-indigo-50/50 border-indigo-100 rounded-2xl px-6 font-black text-indigo-900 shadow-inner"
                />
              </div>
              <div className="space-y-4">
                <Label htmlFor="deadline" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Milestone Date (Optional)</Label>
                <Input 
                  id="deadline" 
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="h-14 bg-indigo-50/50 border-indigo-100 rounded-2xl px-6 font-black text-indigo-900 shadow-inner"
                />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center space-y-8 text-center"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-200">
                  <Sparkles className="h-12 w-12" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-indigo-950 tracking-tighter uppercase">Calculation Ready</h3>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2 px-8">
                  The Oracle is ready to generate your tactical learning roadmap.
                </p>
              </div>
              <div className="grid w-full grid-cols-2 gap-4 rounded-3xl border border-indigo-50 bg-indigo-50/30 p-6 text-left">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-indigo-300">Mission</p>
                  <p className="font-black text-indigo-950 truncate">{formData.goal || 'Undefined'}</p>
                </div>
                <div className="space-y-1 pl-4 border-l border-indigo-100/50">
                  <p className="text-[10px] font-black uppercase tracking-wider text-indigo-300">Tempo</p>
                  <p className="font-black text-indigo-950">{formData.timePerDay} Hrs/Day</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      <CardFooter className="p-10 pt-4 flex gap-4">
        {step > 1 && (
          <Button 
            variant="outline" 
            onClick={() => setStep(s => s - 1)}
            className="h-14 flex-1 rounded-2xl border-indigo-100 text-indigo-600 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Relinquish
          </Button>
        )}
        
        {step < 3 ? (
          <Button 
            className="h-14 flex-[2] bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            disabled={step === 1 && !formData.goal} 
            onClick={() => setStep(s => s + 1)}
          >
            Proceed <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button 
            className="h-14 flex-[2] bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Initiate Matrix
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  if (hideAuth) return cardContent;

  return (
    <div className="flex min-h-screen items-center justify-center p-6 sm:p-12 bg-indigo-50">
      {cardContent}
    </div>
  );
};
