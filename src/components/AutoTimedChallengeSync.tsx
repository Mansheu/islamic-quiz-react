import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import { useTimedChallengeStore } from '../store/timedChallenge';

const AutoTimedChallengeSync: React.FC = () => {
  const [user, loading] = useAuthState(auth);
  const { syncWithFirebase } = useTimedChallengeStore();
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    // Only sync once per session when user signs in
    if (user && !loading && !hasSynced) {
      const performSync = async () => {
        setSyncStatus('🔄 Syncing your timed challenge data...');
        
        try {
          await syncWithFirebase();
          setSyncStatus('✅ Data synced successfully!');
          setHasSynced(true);
          
          // Hide success message after 3 seconds
          setTimeout(() => {
            setSyncStatus('');
          }, 3000);
          
        } catch (error) {
          console.error('Sync failed:', error);
          setSyncStatus('⚠️ Sync completed with local data');
          setHasSynced(true);
          
          // Hide message after 5 seconds
          setTimeout(() => {
            setSyncStatus('');
          }, 5000);
        }
      };

      // Small delay to ensure auth is fully ready
      setTimeout(performSync, 1000);
    }
  }, [user, loading, syncWithFirebase, hasSynced]);

  // Reset sync status when user signs out
  useEffect(() => {
    if (!user && !loading) {
      setHasSynced(false);
      setSyncStatus('');
    }
  }, [user, loading]);

  // Only show sync status if there's something to show
  if (!syncStatus) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: 10000,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      maxWidth: '400px',
      textAlign: 'center'
    }}>
      {syncStatus}
    </div>
  );
};

export default AutoTimedChallengeSync;