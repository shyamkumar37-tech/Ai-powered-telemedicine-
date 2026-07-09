import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { fetchMoodEntries, fetchMoodTrends, fetchStressRecommendations, logMoodEntry } from "../services/aiService";
import { getApiErrorMessage } from "../../utils/apiError";
import { translateDisplayText } from "../../utils/i18n";
import { BookHeart, LineChart, Leaf } from "lucide-react";

const MOOD_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function AiMoodInsightsPanel({ patientId }) {
  const { t, language, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const [entries, setEntries] = useState([]);
  const [trend, setTrend] = useState(null);
  const [stress, setStress] = useState(null);
  const [score, setScore] = useState(6);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadInsights = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const [entryData, trendData, stressData] = await Promise.allSettled([
        fetchMoodEntries(patientId),
        fetchMoodTrends(patientId),
        fetchStressRecommendations(patientId)
      ]);
      if (entryData.status === "fulfilled") setEntries(Array.isArray(entryData.value) ? entryData.value : []);
      if (trendData.status === "fulfilled") setTrend(trendData.value);
      if (stressData.status === "fulfilled") setStress(stressData.value);
      
      const failed = [entryData, trendData, stressData].find((item) => item.status === "rejected");
      setError(failed ? getApiErrorMessage(failed.reason, "Unable to load mood insights.") : "");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, [patientId, language]);

  const submitEntry = async () => {
    if (!patientId) return;
    setMessage("");
    setError("");
    try {
      await logMoodEntry(patientId, { moodScore: Number(score), notes: notes.trim() });
      setNotes("");
      setMessage("Mood check-in saved.");
      setTimeout(() => setMessage(""), 3000);
      await loadInsights();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to save mood check-in."));
    }
  };

  const latestEntry = useMemo(() => (Array.isArray(entries) ? entries[0] : null), [entries]);

  return (
    <div className="doctors-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
      
      {/* Journal */}
      <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookHeart size={18} color="var(--tct-teal)" /> Mood Journal
        </h4>
        
        <div className="space-y-4">
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--tct-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>How are you feeling today? (1-10)</label>
            <select 
              value={score} 
              onChange={e => setScore(e.target.value)}
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none' }}
            >
              {MOOD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <textarea 
              placeholder="Optional note about how you feel"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ width: '100%', minHeight: '80px', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '8px', color: '#FFFFFF', outline: 'none', resize: 'vertical' }}
            />
          </div>
          <button className="btn-primary" style={{ width: '100%' }} onClick={submitEntry}>Save Mood Check-in</button>
          
          {message && <p style={{ fontSize: '13px', color: 'var(--tct-teal)', fontWeight: '500' }}>{message}</p>}
          {error && <p style={{ fontSize: '13px', color: 'var(--tct-coral)', fontWeight: '500' }}>{error}</p>}
        </div>

        {latestEntry && (
          <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid var(--tct-teal)' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Latest Entry <span style={{ opacity: 0.5, margin: '0 4px' }}>|</span> {latestEntry.createdAt}</p>
            <p style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: '500' }}>Score: {latestEntry.moodScore}</p>
            {latestEntry.notes && <p style={{ fontSize: '14px', color: '#E2E8F0', marginTop: '4px', lineHeight: '1.4' }}>{latestEntry.notes}</p>}
          </div>
        )}
      </div>

      {/* Trend Summary */}
      <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LineChart size={18} color="var(--tct-teal)" /> Mood Trend Summary
        </h4>
        
        {loading ? (
          <div className="skeleton-pulse" style={{ height: '100px', borderRadius: '8px' }}></div>
        ) : trend ? (
          <div className="space-y-4">
            <p style={{ fontSize: '14px', color: '#E2E8F0', lineHeight: '1.6' }}>{trend.summary}</p>
            <ul style={{ paddingLeft: '20px', color: '#E2E8F0', fontSize: '14px', lineHeight: '1.6' }}>
              {trend.highlights?.map((item, idx) => <li key={idx} style={{ paddingLeft: '4px' }}>{item}</li>)}
            </ul>
            <p style={{ fontSize: '12px', color: 'var(--tct-text-muted)', fontStyle: 'italic', marginTop: '16px' }}>{trend.disclaimer}</p>
          </div>
        ) : (
          <p style={{ fontSize: '14px', color: 'var(--tct-text-secondary)' }}>No trend data available.</p>
        )}
      </div>

      {/* Stress Coping */}
      <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Leaf size={18} color="var(--tct-teal)" /> Coping Recommendations
        </h4>
        
        {loading ? (
          <div className="skeleton-pulse" style={{ height: '100px', borderRadius: '8px' }}></div>
        ) : stress ? (
          <div className="space-y-4">
            <ul style={{ paddingLeft: '20px', color: '#E2E8F0', fontSize: '14px', lineHeight: '1.6' }}>
              {stress.recommendations?.map((item, idx) => <li key={idx} style={{ paddingLeft: '4px' }}>{item}</li>)}
            </ul>
            
            {stress.rationale?.length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--tct-panel-line)' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>Rationale</p>
                <ul style={{ paddingLeft: '20px', color: 'var(--tct-text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>
                  {stress.rationale.map((item, idx) => <li key={idx} style={{ paddingLeft: '4px' }}>{item}</li>)}
                </ul>
              </div>
            )}
            
            <p style={{ fontSize: '12px', color: 'var(--tct-text-muted)', fontStyle: 'italic', marginTop: '16px' }}>{stress.disclaimer}</p>
          </div>
        ) : (
          <p style={{ fontSize: '14px', color: 'var(--tct-text-secondary)' }}>No recommendations available.</p>
        )}
      </div>

    </div>
  );
}
