import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from "../../context/LanguageContext";
import { Activity } from 'lucide-react';
import { DynamicStateObject, DynamicState } from "./../../types/DynamicState";

export default function PremiumLoadingState() {
  const { t } = useLanguage();
  const [messageIndex, setMessageIndex] = useState<DynamicState>(0);
  
  const messages = [
    t('settingUpWorkspace') || 'Setting up your secure workspace...',
    t('encryptingSession') || 'Encrypting your session...',
    t('loadingDashboard') || 'Loading your dashboard...',
    t('almostReady') || 'Almost ready...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev: DynamicStateObject) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <div className="relative flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 shadow-xl shadow-brand-500/20">
          <Activity className="w-10 h-10 text-white animate-pulse" />
          <div className="absolute inset-0 rounded-2xl border border-white/20"></div>
        </div>
        <div className="h-6 overflow-hidden relative w-64 text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-slate-600 dark:text-slate-300 font-medium absolute inset-0"
            >
              {messages[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="w-48 h-1.5 mt-8 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand-500 rounded-full"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          />
        </div>
      </motion.div>
    </div>
  );
}
