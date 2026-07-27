import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCcw, ArrowLeft, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from "../../context/LanguageContext";
import Card from "./Card";

export interface ErrorStateCardProps {
  title?: DynamicState;
  message?: DynamicState;
  errorDetails?: DynamicState;
  onRetry?: (...args: DynamicStateObject[]) => void;
  className?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function ErrorStateCard({ title, message, errorDetails, onRetry, className = "" }: ErrorStateCardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState<DynamicState>(false);

  return (
    <Card elevated={false} className={`flex flex-col items-center justify-center p-8 bg-rose-500/5 border-rose-500/20 ${className}`}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        className="w-24 h-24 mb-6 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center"
      >
        <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400" />
      </motion.div>
      
      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2 text-center">
        {title || t('somethingWentWrong') || 'Something went wrong'}
      </h3>
      
      <p className="text-slate-600 dark:text-slate-400 text-center max-w-md mb-8">
        {message || t('pleaseTryAgain') || 'We encountered an unexpected issue while trying to load this data. Please try again.'}
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            {t('retry') || 'Retry'}
          </button>
        )}
        <button
          onClick={() => navigate('/patient')}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToDashboard') || 'Back to Dashboard'}
        </button>
      </div>

      {errorDetails && (
        <div className="w-full max-w-lg mt-8">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span>{t('showTechnicalDetails') || 'Technical Details'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
          </button>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="overflow-hidden"
            >
              <pre className="mt-2 p-4 bg-slate-900 text-slate-300 text-xs rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
                {typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails, null, 2)}
              </pre>
            </motion.div>
          )}
        </div>
      )}
    </Card>
  );
}
