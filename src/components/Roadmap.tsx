import React from 'react';
import { LearningPath, Progress } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CheckCircle2, Circle, Clock, ExternalLink, PlayCircle, FileText, Code2, GraduationCap, Book } from 'lucide-react';
import { motion } from 'motion/react';

interface RoadmapProps {
  path: LearningPath;
  progress: Progress | null;
  onToggleTask: (taskId: string, moduleId: string) => void;
  onStartQuiz: (topic: string) => void;
  onStruggle: (area: string) => void;
}

export const Roadmap: React.FC<RoadmapProps> = ({ path, progress, onToggleTask, onStartQuiz, onStruggle }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="max-w-4xl mx-auto space-y-12 pb-20"
    >
      <div className="relative space-y-12 before:absolute before:inset-0 before:ml-6 before:h-full before:w-1 before:-translate-x-px before:bg-gradient-to-b before:from-indigo-600 before:via-indigo-100 before:to-transparent">
        {path.modules.map((module, mIndex) => (
          <div key={module.id} className="relative flex items-start group">
            {/* Timeline Indicator */}
            <div className={`absolute left-0 mt-8 flex h-12 w-12 items-center justify-center rounded-2xl border-4 border-indigo-50 transition-all z-10 shadow-lg ${
              progress?.completedModuleIds.includes(module.id) 
                ? 'bg-indigo-600' 
                : mIndex === (progress?.completedModuleIds.length || 0)
                  ? 'bg-white ring-4 ring-indigo-600/20 shadow-indigo-200'
                  : 'bg-slate-200'
            }`}>
              {progress?.completedModuleIds.includes(module.id) ? (
                <CheckCircle2 className="h-6 w-6 text-white" />
              ) : (
                <span className={`text-sm font-black ${mIndex === (progress?.completedModuleIds.length || 0) ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {mIndex + 1}
                </span>
              )}
            </div>

            {/* Content Card */}
            <div className="ml-20 flex-1">
              <Card className={`rounded-[2rem] border-indigo-100 shadow-sm transition-all duration-500 ${
                mIndex === (progress?.completedModuleIds.length || 0) 
                  ? 'ring-4 ring-indigo-600/10 shadow-2xl shadow-indigo-100 border-indigo-200' 
                  : 'hover:shadow-md'
              }`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                      <Clock className="w-3 h-3" />
                      PHASE {mIndex + 1} • {module.durationWeeks} Wks
                    </div>
                    {progress?.completedModuleIds.includes(module.id) && (
                      <Badge className="bg-emerald-500 text-white border-none shadow-sm font-black uppercase tracking-widest text-[9px]">Mastered</Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl font-black text-indigo-950 tracking-tight">{module.title}</CardTitle>
                  <CardDescription className="text-slate-500 font-medium leading-relaxed">{module.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Quests (Tasks) */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Daily Quests</h4>
                    <div className="grid gap-3">
                      {module.tasks.map((task) => (
                        <div 
                          key={task.id} 
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                            progress?.completedTaskIds.includes(task.id) 
                              ? 'bg-slate-50 border-slate-100 opacity-60' 
                              : 'bg-white border-slate-100 hover:border-indigo-100 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => onToggleTask(task.id, module.id)}
                              className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all ${
                                progress?.completedTaskIds.includes(task.id) 
                                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                                  : 'border-2 border-slate-200 hover:border-indigo-400'
                              }`}
                            >
                              {progress?.completedTaskIds.includes(task.id) && <CheckCircle2 className="h-4 w-4" />}
                            </button>
                            <div>
                              <p className={`text-sm font-black tracking-tight ${progress?.completedTaskIds.includes(task.id) ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                {task.title}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{task.durationHours}h estimated</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vault (Resources) */}
                  <div className="space-y-4 pt-6 border-t border-slate-100">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                       Knowledge Vault
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {module.recommendations.map((rec, i) => (
                        <a 
                          key={i} 
                          href={rec.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-100 transition-all group"
                        >
                          <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            {rec.type === 'video' ? <PlayCircle className="h-5 w-5 text-indigo-600" /> : 
                             rec.type === 'practice' ? <Code2 className="h-5 w-5 text-indigo-600" /> : 
                             rec.type === 'book' ? <Book className="h-5 w-5 text-indigo-600" /> :
                             <FileText className="h-5 w-5 text-indigo-600" />
                            }
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <span className="text-xs font-black text-slate-900 truncate block">{rec.title}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-bold">{rec.type}</span>
                          </div>
                          <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-indigo-600" />
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-8 flex flex-wrap gap-3 pt-6 border-t border-slate-100">
                    <Button 
                      variant="default" 
                      className="bg-indigo-600 rounded-xl h-11 px-6 shadow-lg shadow-indigo-100 font-black uppercase tracking-widest text-[10px] group"
                      onClick={() => onStartQuiz(module.title)}
                    >
                      Verify Knowledge <GraduationCap className="ml-2 h-4 w-4 transition-transform group-hover:rotate-12" />
                    </Button>
                    <Button 
                      variant="outline" 
                      className="rounded-xl h-11 px-6 border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-black uppercase tracking-widest text-[10px]"
                      onClick={() => onStruggle(module.title)}
                    >
                      Struggling? Recalibrate AI
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
