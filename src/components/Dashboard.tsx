import React, { useEffect, useState } from 'react';
import { UserProfile, LearningPath, Progress } from '../types';
import { generateLearningPath } from '../services/gemini';
import { doc, setDoc, updateDoc, getDoc, addDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { 
  Trash2, 
  Plus, 
  ArrowLeft, 
  ArrowRight,
  LogOut, 
  CheckCircle2, 
  Calendar, 
  Sparkles, 
  LineChart, 
  BookOpen, 
  MessageSquare,
  GraduationCap,
  Brain
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Roadmap } from './Roadmap';
import { MentorChat } from './MentorChat';
import { QuizView } from './QuizView';
import { Survey } from './Survey'; // Add Survey for new goals
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Slider } from './ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';

interface DashboardProps {
  profile: UserProfile;
  path: LearningPath | null;
  onPathGenerated: (path: LearningPath) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ profile: initialProfile, path: initialPath, onPathGenerated }) => {
  const [profile, setProfile] = useState(initialProfile);
  const [path, setPath] = useState<LearningPath | null>(initialPath);
  const [allPaths, setAllPaths] = useState<LearningPath[]>([]);
  const [generating, setGenerating] = useState(false);
  const [view, setView] = useState<'overview' | 'roadmap' | 'mentor' | 'stats'>('overview');
  const [progress, setProgress] = useState<Progress | null>(null);
  const [showQuiz, setShowQuiz] = useState({ active: false, topic: '', level: '' });
  const [showMoodCheck, setShowMoodCheck] = useState(true);
  const [moodData, setMoodData] = useState({ focus: 5, mood: 'Neutral' });
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [loadingPaths, setLoadingPaths] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<{ active: boolean; pathId: string | null }>({ active: false, pathId: null });

  useEffect(() => {
    fetchAllPaths();
  }, [profile.userId]);

  useEffect(() => {
    if (path) {
      fetchProgress(path.id!);
    }
  }, [path?.id]);

  const fetchAllPaths = async () => {
    setLoadingPaths(true);
    try {
      const q = query(collection(db, 'paths'), where('userId', '==', profile.userId));
      const querySnapshot = await getDocs(q);
      const paths = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LearningPath));
      setAllPaths(paths);
      
      // If no paths exist at all, generate the first one automatically
      if (paths.length === 0) {
        handleGenerateCustom((profile as any).goal || 'Mastering New Skill');
        return;
      }

      // If no path is active but we have paths
      if (!path && paths.length > 0) {
        const active = paths.find(p => p.id === profile.activePathId) || paths[0];
        setPath(active);
        onPathGenerated(active);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load paths.");
    } finally {
      setLoadingPaths(false);
    }
  };

  const fetchProgress = async (pathId: string) => {
    try {
      console.log("Fetching progress for path:", pathId);
      const progDoc = await getDoc(doc(db, 'progress', pathId));
      if (progDoc.exists()) {
        console.log("Progress document found.");
        setProgress(progDoc.data() as Progress);
      } else {
        console.log("No progress document, creating initial states...");
        const initialProgress: Progress = {
          pathId,
          userId: profile.userId,
          completedTaskIds: [],
          completedModuleIds: [],
          quizHistory: []
        };
        await setDoc(doc(db, 'progress', pathId), initialProgress);
        setProgress(initialProgress);
      }
    } catch (err: any) {
      console.error("Error in fetchProgress:", err);
      toast.error(`Sync error: ${err.message}`);
    }
  };

  const switchPath = async (newPath: LearningPath) => {
    setPath(newPath);
    onPathGenerated(newPath);
    await updateDoc(doc(db, 'profiles', profile.userId), {
      activePathId: newPath.id
    });
    setProfile(prev => ({ ...prev, activePathId: newPath.id }));
  };

  const deletePath = async () => {
    const pathId = confirmDelete.pathId;
    if (!pathId) return;
    
    setConfirmDelete({ active: false, pathId: null });
    console.log("Processing delete for path:", pathId);
    
    try {
      toast.loading("Purging tactical data...", { id: 'delete-goal' });
      
      // Step 1: Try deleting progress (fails gracefully if missing or no permission)
      try {
        console.log("Attempting progress purge...");
        const progRef = doc(db, 'progress', pathId);
        await deleteDoc(progRef);
      } catch (pErr) {
        console.warn("Progress purge skipped or failed:", pErr);
      }
      
      // Step 2: Delete the path itself
      console.log("Attempting path purge...");
      await deleteDoc(doc(db, 'paths', pathId));
      
      setAllPaths(prev => prev.filter(p => p.id !== pathId));
      
      if (path?.id === pathId) {
        setPath(null);
        setProgress(null);
      }
      setConfirmDelete({ active: false, pathId: null });
      toast.success("Goal successfully purged from matrix.", { id: 'delete-goal' });
    } catch (err: any) {
      console.error("CRITICAL: Matrix purge failed:", err);
      toast.error(`Purge failed: ${err.message}`, { id: 'delete-goal' });
    }
  };

  const initiateDelete = (pathId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDelete({ active: true, pathId });
  };

  const handleGenerateCustom = async (goal: string) => {
    setGenerating(true);
    setShowNewGoal(false);
    try {
      const newPath = await generateLearningPath(profile, goal);
      const pathWithMeta = { 
        ...newPath, 
        userId: profile.userId,
        createdAt: new Date().toISOString() 
      };
      const pathDoc = await addDoc(collection(db, 'paths'), pathWithMeta);
      const pathWithId = { ...pathWithMeta, id: pathDoc.id };
      
      await updateDoc(doc(db, 'profiles', profile.userId), {
        activePathId: pathDoc.id
      });
      
      setProfile(prev => ({ ...prev, activePathId: pathDoc.id }));
      setAllPaths(prev => [...prev, pathWithId]);
      setPath(pathWithId);
      onPathGenerated(pathWithId);
      toast.success("New goal matrix initialized!");
    } catch (err) {
      console.error(err);
      toast.error("Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const submitMood = async () => {
    try {
      await addDoc(collection(db, 'logs'), {
        userId: profile.userId,
        date: new Date().toISOString().split('T')[0],
        ...moodData
      });
      setShowMoodCheck(false);
      toast.success("Feedback saved! We'll adjust your path if needed.");
    } catch (err) {
      toast.error("Failed to save log.");
    }
  };

  const toggleTask = async (taskId: string, moduleId: string) => {
    toast.info("Toggling quest...");
    if (!progress || !path) {
      console.warn("Toggle task rejected: Progress or Path is null", { progress, path });
      return;
    }
    
    const isCompleted = progress.completedTaskIds.includes(taskId);
    const newTasks = isCompleted 
      ? progress.completedTaskIds.filter(id => id !== taskId)
      : [...progress.completedTaskIds, taskId];

    // Check if module is complete
    const currentModule = path.modules.find(m => m.id === moduleId);
    let newModules = progress.completedModuleIds;
    if (currentModule) {
      const allTasksCompleted = currentModule.tasks.every(t => newTasks.includes(t.id));
      if (allTasksCompleted && !newModules.includes(moduleId)) {
        newModules = [...newModules, moduleId];
      } else if (!allTasksCompleted && newModules.includes(moduleId)) {
        newModules = newModules.filter(id => id !== moduleId);
      }
    }

    try {
      const updatedProgress = { ...progress, completedTaskIds: newTasks, completedModuleIds: newModules };
      // Optimistic update
      setProgress(updatedProgress);
      
      console.log("Updating progress document in Firestore...", path.id);
      await setDoc(doc(db, 'progress', path.id!), updatedProgress, { merge: true });
      console.log("Progress updated successfully.");
    } catch (err: any) {
      console.error("Failed to toggle task:", err);
      toast.error(`Failed to update progress: ${err.message}`);
      // Revert optimism if needed (optional for now)
    }
  };

  if (generating) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8 h-32 w-32">
          <div className="absolute inset-0 animate-ping rounded-full bg-indigo-100 opacity-75"></div>
          <div className="relative flex h-full w-full items-center justify-center rounded-full bg-white shadow-lg">
            <GraduationCap className="h-16 w-16 text-indigo-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          Crafting Your Personalized Roadmap
        </h2>
        <p className="mt-4 max-w-md text-slate-600">
          Our AI is mapping out the best concepts, resources, and tasks for your goal: "{(profile as any).goal || path?.goal}"
        </p>
        <div className="mt-10 flex flex-col items-center gap-2">
          <div className="flex gap-1">
            <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-600" style={{ animationDelay: '0ms' }} />
            <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-600" style={{ animationDelay: '150ms' }} />
            <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-600" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Optimizing Curriculum</p>
        </div>
      </div>
    );
  }

  if (!path) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-indigo-50 p-6">
        <Card className="max-w-md rounded-[2.5rem] border-indigo-100 p-10 text-center shadow-xl shadow-indigo-100">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-200">
            <Brain className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter mb-4">No Active Matrices</h2>
          <p className="text-slate-500 font-medium mb-8">
            Select an existing mission or initialize a new goal to begin your tactical learning journey.
          </p>
          <Button 
            className="w-full h-14 bg-indigo-600 rounded-2xl font-black uppercase tracking-widest text-xs"
            onClick={() => setShowNewGoal(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Start New Goal
          </Button>
        </Card>

        {/* New Goal Dialog for empty state */}
        <Dialog open={showNewGoal} onOpenChange={setShowNewGoal}>
          <DialogContent className="sm:max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-indigo-600 p-8 text-white">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">Initialize New Matrix</DialogTitle>
                <DialogDescription className="text-indigo-100 opacity-80">Define your next learning objective. Our AI will calibrate a custom roadmap.</DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-8">
              <Survey onComplete={(p) => handleGenerateCustom((p as any).goal)} hideAuth={true} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const totalTasks = path.modules.reduce((acc, m) => acc + m.tasks.length, 0);
  const completedTasks = progress?.completedTaskIds.length || 0;
  const percentComplete = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex h-screen bg-indigo-50 p-6 gap-6 font-sans overflow-hidden text-slate-800">
      <Dialog open={showMoodCheck} onOpenChange={setShowMoodCheck}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-indigo-950">Daily Mindset Check</DialogTitle>
            <DialogDescription className="text-slate-500">How is your focus and energy today? Your path adapts with you.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Focus Intensity</span>
                <span className="text-indigo-600">{moodData.focus}/10</span>
              </div>
              <Slider 
                value={[moodData.focus]} 
                onValueChange={(v) => setMoodData(p => ({ ...p, focus: v[0] }))} 
                max={10} 
                step={1} 
                className="py-4"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['Burnt out', 'Tired', 'Neutral', 'Focused', 'Super Flow'].map((m) => (
                <Button 
                  key={m} 
                  variant={moodData.mood === m ? 'default' : 'outline'}
                  size="sm"
                  className={`text-[10px] px-2 h-10 rounded-xl font-bold uppercase tracking-wide transition-all ${
                    moodData.mood === m ? 'bg-indigo-600 shadow-md shadow-indigo-200' : 'border-indigo-100 hover:border-indigo-300'
                  }`}
                  onClick={() => setMoodData(p => ({ ...p, mood: m }))}
                >
                  {m}
                </Button>
              ))}
            </div>
          </div>
          <Button className="w-full h-12 bg-indigo-600 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-100" onClick={submitMood}>Launch My Quest</Button>
        </DialogContent>
      </Dialog>

      {/* Left Sidebar: Profile & Navigation */}
      <aside className="w-72 flex flex-col gap-6 shrink-0 h-full overflow-y-auto custom-scrollbar">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-indigo-100 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200">
              {profile.userId.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <h2 className="font-black text-lg leading-tight truncate">Learner</h2>
              <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">{profile.skillLevel} Level</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-500" onClick={() => auth.signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          
          <nav className="space-y-1 mb-6">
            <NavButton active={view === 'overview'} onClick={() => setView('overview')} icon={<LineChart className="w-4 h-4" />} label="Dashboard" />
            <NavButton active={view === 'roadmap'} onClick={() => setView('roadmap')} icon={<BookOpen className="w-4 h-4" />} label="Learning Path" />
            <NavButton active={view === 'mentor'} onClick={() => setView('mentor')} icon={<MessageSquare className="w-4 h-4" />} label="AI Mentor" />
          </nav>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold opacity-60">My Goals</label>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-lg text-indigo-600 hover:bg-indigo-50"
                onClick={() => setShowNewGoal(true)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {allPaths.map(p => (
                <div 
                  key={p.id}
                  onClick={() => switchPath(p)}
                  className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                    path?.id === p.id 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                      : 'bg-indigo-50/50 border-indigo-100 text-indigo-700 hover:bg-indigo-100/50'
                  }`}
                >
                  <p className="text-[11px] font-black truncate flex-1 pr-2">{p.goal}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 rounded-lg shrink-0 transition-all ${
                      path?.id === p.id 
                        ? 'text-white/60 hover:text-white hover:bg-white/10' 
                        : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'
                    }`}
                    onClick={(e) => initiateDelete(p.id!, e)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {allPaths.length === 0 && !loadingPaths && (
                <div className="text-center py-4">
                  <p className="text-[10px] font-bold text-slate-400 italic">No goals active.</p>
                  <Button 
                    variant="link" 
                    className="text-[10px] font-black text-indigo-600 h-auto p-0 mt-1"
                    onClick={() => setShowNewGoal(true)}
                  >
                    + Create First Goal
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* New Goal Dialog */}
        <Dialog open={showNewGoal} onOpenChange={setShowNewGoal}>
          <DialogContent className="sm:max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-indigo-600 p-8 text-white">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">Initialize New Matrix</DialogTitle>
                <DialogDescription className="text-indigo-100 opacity-80">Define your next learning objective. Our AI will calibrate a custom roadmap.</DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-8">
              <Survey onComplete={(p) => handleGenerateCustom((p as any).goal)} hideAuth={true} />
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={confirmDelete.active} onOpenChange={(open) => !open && setConfirmDelete({ active: false, pathId: null })}>
          <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-rose-500 p-8 text-white">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">Purge Matrix?</DialogTitle>
                <DialogDescription className="text-rose-100 opacity-80">This action is irreversible. All tactical progress and module data will be permanently erased.</DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-8 flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1 h-14 rounded-2xl border-slate-200 font-black uppercase tracking-widest text-[10px]"
                onClick={() => setConfirmDelete({ active: false, pathId: null })}
              >
                Abort
              </Button>
              <Button 
                className="flex-1 h-14 bg-rose-600 hover:bg-rose-700 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-100"
                onClick={deletePath}
              >
                Confirm Purge
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="bg-indigo-900 rounded-3xl p-6 text-white flex-grow relative overflow-hidden shadow-2xl shadow-indigo-900/20">
          <div className="relative z-10 flex flex-col h-full">
            <h3 className="font-black text-sm uppercase tracking-widest mb-4 opacity-60">Skill Mastery</h3>
            <div className="space-y-4 flex-grow">
               <SkillProgress label="Overall Path" value={percentComplete} color="emerald" />
               <SkillProgress label="Current Stage" value={Math.min(100, Math.round(((progress?.completedTaskIds.length || 0) / (path.modules[progress?.completedModuleIds.length || 0]?.tasks.length || 1)) * 100))} color="amber" />
               <SkillProgress label="Consistency" value={85} color="indigo" />
            </div>
            <div className="mt-6 pt-4 border-t border-white/5">
               <p className="text-[10px] italic opacity-50">"Consistency is the companion of success."</p>
            </div>
          </div>
          <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-white/5 rounded-full blur-[60px]"></div>
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px]"></div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col gap-6 overflow-hidden">
        <header className="bg-white rounded-[2rem] p-8 shadow-sm border border-indigo-100 flex flex-col justify-between shrink-0 relative overflow-hidden">
           <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h1 className="text-3xl font-black text-indigo-950 tracking-tighter uppercase italic">
                  {view === 'overview' ? 'Command Center' : view === 'roadmap' ? 'Learning Quest' : 'Oracle Support'}
                </h1>
                <p className="text-slate-500 font-medium mt-1">
                  {view === 'overview' ? `Tracking your journey to ${path.goal}` : 
                   view === 'roadmap' ? `Current Phase: ${path.modules[progress?.completedModuleIds.length || 0]?.title || 'Finalizing Master'}` : 
                   'The Oracle is ready for your inquiries'}
                </p>
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-10 cursor-pointer rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="h-10 w-10 cursor-pointer rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
           </div>

           <div className="flex items-center gap-4 relative z-10">
             <div className="flex-grow h-2 bg-slate-100 relative rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentComplete}%` }}
                  className="absolute left-0 top-0 h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                />
             </div>
             <span className="text-xs font-black text-indigo-600 tabular-nums">{percentComplete}%</span>
           </div>
           
           <div className="grid grid-cols-4 mt-6 gap-1 relative z-10">
             {path.modules.slice(0, 4).map((m, i) => (
                <div key={i} className={`text-[10px] font-black uppercase tracking-wider truncate ${
                  progress?.completedModuleIds.includes(m.id) ? 'text-indigo-600' : 
                  (progress?.completedModuleIds.length || 0) === i ? 'text-indigo-400' : 'text-slate-300'
                }`}>
                  PH {i+1}: {m.title.split(' ')[0]}
                </div>
             ))}
           </div>
           {/* Abstract Header Background Shape */}
           <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-50/50 to-transparent pointer-events-none" />
        </header>

        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="wait">
            {view === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="grid grid-cols-2 gap-6"
              >
                {/* Insights Section */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-indigo-100 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-lg text-indigo-950 uppercase tracking-tighter">Growth Insights</h3>
                    <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <LineChart className="w-4 h-4" />
                    </div>
                  </div>
                  
                  <div className="space-y-6 flex-grow">
                    <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                      <div className="flex justify-between text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">
                        <span>Consistency Rank</span>
                        <span>Level 4</span>
                      </div>
                      <div className="flex items-end gap-1.5 h-16">
                        {[40, 60, 45, 90, 85, 100, 75].map((h, i) => (
                          <div key={i} className={`w-full rounded-t-lg transition-all duration-500 ${i === 5 ? 'bg-indigo-600' : 'bg-indigo-200'}`} style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl">
                        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 font-black">
                           🔥
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">12 Day Streak</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Keep the momentum going!</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl">
                        <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 font-black">
                           ⚡
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">Sprint Potential</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Ready for 3 extra tasks today</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Next Tasks Card */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-indigo-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-lg text-indigo-950 uppercase tracking-tighter">Current Quests</h3>
                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
                      {path.modules[progress?.completedModuleIds.length || 0]?.tasks.length || 0} Total
                    </span>
                  </div>
                  <div className="space-y-3">
                    {(() => {
                      const currentModuleIndex = progress?.completedModuleIds.length || 0;
                      // Don't overflow
                      const safeModuleIndex = Math.min(currentModuleIndex, path.modules.length - 1);
                      const currentModule = path.modules[safeModuleIndex];
                      
                      if (!currentModule) return <p className="text-xs text-slate-400 italic">No tasks available.</p>;

                      return currentModule.tasks.slice(0, 4).map((task) => (
                        <div key={task.id} className={`p-4 rounded-2xl transition-all border ${
                         progress?.completedTaskIds.includes(task.id) 
                           ? 'bg-indigo-50 border-indigo-100 opacity-60' 
                           : 'bg-white border-slate-100 hover:border-indigo-200'
                        } flex items-center gap-4 shadow-sm group`}>
                          <button 
                            onClick={() => toggleTask(task.id, currentModule.id)}
                            className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all ${
                              progress?.completedTaskIds.includes(task.id) 
                                ? 'bg-indigo-600 text-white' 
                                : 'border-2 border-slate-200 group-hover:border-indigo-400'
                            }`}
                          >
                            {progress?.completedTaskIds.includes(task.id) && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <div className="flex-1 overflow-hidden">
                            <p className={`text-sm font-black truncate ${progress?.completedTaskIds.includes(task.id) ? 'line-through text-slate-400' : 'text-slate-900'}`}>{task.title}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{task.durationHours}h estimated</p>
                          </div>
                        </div>
                      ));
                    })()}
                    <Button variant="ghost" className="w-full text-indigo-500 font-black uppercase text-[10px] hover:bg-indigo-50 rounded-2xl mt-2" onClick={() => setView('roadmap')}>
                      Explore Full Roadmap
                    </Button>
                  </div>
                </section>
              </motion.div>
            )}

            {view === 'roadmap' && !showQuiz.active && (
              <Roadmap 
                path={path} 
                progress={progress} 
                onToggleTask={toggleTask} 
                onStartQuiz={(topic) => setShowQuiz({ active: true, topic, level: profile.skillLevel })}
                onStruggle={(area) => {
                    toast.info(`Adjusting your path for: ${area}...`);
                }}
              />
            )}

            {showQuiz.active && (
              <QuizView 
                topic={showQuiz.topic} 
                level={showQuiz.level} 
                onCancel={() => setShowQuiz({ active: false, topic: '', level: '' })}
                onComplete={(score) => {
                  toast.success(`Score ${score} optimized your path!`);
                  setShowQuiz({ active: false, topic: '', level: '' });
                }}
              />
            )}

            {view === 'mentor' && (
              <div className="h-full min-h-[500px]">
                <MentorChat context={JSON.stringify(path)} />
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Right Sidebar: Motivation & Quick Mentor */}
      <aside className="w-80 flex flex-col gap-6 shrink-0">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-indigo-100 overflow-hidden relative group">
           <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-6">Cognitive Load</h3>
           <div className="relative z-10 text-center py-4">
              <p className="text-sm font-black mb-3">Energy Check</p>
              <div className="flex justify-between gap-2">
                {['😫', '😐', '🔥'].map((emoji, idx) => (
                  <button 
                    key={idx}
                    className={`flex-grow py-4 rounded-2xl text-2xl transition-all hover:scale-105 active:scale-95 ${
                      idx === 0 ? 'bg-rose-50 hover:bg-rose-100' :
                      idx === 1 ? 'bg-amber-50 hover:bg-amber-100' :
                      'bg-emerald-50 hover:bg-emerald-100 shadow-md shadow-emerald-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="mt-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-500 italic leading-relaxed">
                  "You're currently in 'Peak State'. Focus on the most challenging tasks in Section {progress?.completedModuleIds.length || 0 + 1}."
                </p>
              </div>
           </div>
           {/* Background Decal */}
           <div className="absolute -top-4 -right-4 w-20 h-20 bg-indigo-50 rounded-full opacity-50 blur-xl group-hover:opacity-80 transition-opacity"></div>
        </div>

        {/* Skill Gap Analysis Box */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-indigo-100">
           <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-4">Skill Gap Analysis</h3>
           <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100 mb-4 animate-pulse">
              <div className="flex items-center gap-2 mb-2 font-black text-[10px]">
                 <span className="text-rose-600">⚠️</span>
                 <span className="text-rose-800">PATTERN ANOMALY</span>
              </div>
              <p className="text-[11px] font-bold text-rose-900 leading-snug">
                We noticed slowdown in Module {progress?.completedModuleIds.length || 0 + 1}. AI suggested a deep dive on <span className="underline italic">Advanced Context Logic</span>.
              </p>
           </div>
           <Button variant="outline" className="w-full text-[10px] font-black uppercase tracking-widest border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-xl" onClick={() => setView('mentor')}>
              Launch Gap-Fill Lab
           </Button>
        </div>

        {/* Mini Mentor Box */}
        {view !== 'mentor' && (
          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 flex flex-col gap-4 relative overflow-hidden flex-grow group">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black">AI</div>
                <h4 className="font-black text-sm uppercase">Quick Oracle</h4>
              </div>
              <div className="space-y-3">
                 <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl rounded-tl-none text-[10px] font-bold leading-relaxed border border-white/5">
                   Ask me anything about your current module to clear roadblocks!
                 </div>
                 <div className="bg-white p-3 rounded-2xl rounded-br-none text-[10px] font-black text-indigo-900 self-end shadow-lg shadow-indigo-700/20">
                    How does memory leaks happen?
                 </div>
              </div>
            </div>
            <div className="mt-auto relative z-10">
               <div className="bg-white/10 rounded-2xl p-3 flex justify-between items-center group-hover:bg-white/20 transition-all border border-white/5">
                 <span className="text-[10px] font-black opacity-60">Consult AI...</span>
                 <ArrowRight className="w-4 h-4 opacity-100" />
               </div>
            </div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-400 rounded-full blur-[40px] opacity-20"></div>
          </div>
        )}
      </aside>
    </div>
  );
};

const SkillProgress = ({ label, value, color }: { label: string, value: number, color: 'indigo' | 'emerald' | 'amber' }) => {
  const colors = {
    indigo: 'bg-indigo-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400'
  };
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter opacity-80">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full rounded-full ${colors[color]}`} 
        />
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-[11px] font-black uppercase tracking-widest transition-all ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
        : 'text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'
    }`}
  >
    <span className={`${active ? 'text-white' : 'text-slate-300'}`}>{icon}</span>
    {label}
  </button>
);

