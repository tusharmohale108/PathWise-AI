import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { Landing } from './Landing';
import { Survey } from './Survey';
import { Dashboard } from './Dashboard';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, LearningPath } from '../types';
import { Loader2 } from 'lucide-react';

export const MainContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile);
          
          // Try fetching the latest path
          const pathDoc = await getDoc(doc(db, 'paths', (profileDoc.data().activePathId || 'none')));
          if (pathDoc.exists()) {
            setPath({ ...pathDoc.data(), id: pathDoc.id } as LearningPath);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) return <Landing />;
  
  if (!profile) return <Survey onComplete={(p) => setProfile(p)} />;

  return <Dashboard profile={profile} path={path} onPathGenerated={(newPath) => setPath(newPath)} />;
};
