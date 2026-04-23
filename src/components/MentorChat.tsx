import React, { useState, useRef, useEffect } from 'react';
import { getMentorResponse } from '../services/gemini';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

export const MentorChat: React.FC<{ context: string }> = ({ context }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: "Hello! I'm your AI Mentor. Stuck on a concept or need more examples? Ask me anything about your current learning path." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await getMentorResponse(userMsg, context);
      setMessages(prev => [...prev, { role: 'assistant', content: response || "I'm sorry, I couldn't process that." }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full flex flex-col"
    >
      <Card className="flex-1 flex flex-col rounded-[2.5rem] border-indigo-100 shadow-sm overflow-hidden bg-white">
        <CardHeader className="border-b border-indigo-50 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-black text-indigo-950 uppercase tracking-tighter leading-none mb-1">AI Mentor: Deep Explainer</CardTitle>
              <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">24/7 Oracle Access</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 overflow-hidden relative bg-indigo-50/10">
          <div className="h-full overflow-y-auto px-6 py-8 custom-scrollbar" ref={scrollRef}>
            <div className="space-y-6 max-w-3xl mx-auto">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm ${
                      msg.role === 'user' ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'
                    }`}>
                      {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`px-5 py-4 shadow-sm border transition-all ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-3xl rounded-tr-none border-indigo-500' 
                        : 'bg-white text-slate-800 rounded-3xl rounded-tl-none border-indigo-50'
                    }`}>
                      <div className="markdown-body text-sm font-medium leading-relaxed prose-invert">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="rounded-3xl rounded-tl-none bg-white border border-indigo-50 px-5 py-4 shadow-sm flex items-center gap-2">
                       <span className="flex gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-200 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                       </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <div className="p-6 border-t border-indigo-50 bg-white">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-3 max-w-3xl mx-auto"
          >
            <div className="relative flex-1 group">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your current module..."
                className="h-14 bg-indigo-50/50 border-indigo-100 rounded-[1.25rem] px-6 pr-12 text-sm font-medium focus:bg-white focus:border-indigo-600 transition-all focus:ring-4 focus:ring-indigo-600/5 shadow-inner"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[10px] font-black text-indigo-300 group-focus-within:text-indigo-400 transition-colors uppercase">
                 Enter <span className="text-xl">↵</span>
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={!input.trim() || loading}
              size="icon"
              className="h-14 w-14 rounded-[1.25rem] bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      </Card>
    </motion.div>
  );
};
