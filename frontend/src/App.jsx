import { useState, useEffect, useRef } from 'react';
import Toast from './components/Toast';
import HistorySidebar from './components/HistorySidebar';
import TypingAnimation from './components/TypingAnimation';
import QuickActions from './components/QuickActions';
import GraphVisualization from './components/GraphVisualization';
import useLocalStorage from './hooks/useLocalStorage';
import useKeyboard from './hooks/useKeyboard';
import { exportToJSON, exportToMarkdown, exportToPDF } from './utils/exportUtils';

const LoadingSpinner = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const BackendStatusIndicator = ({ status }) => {
  const statusColors = {
    connected: 'bg-emerald-500',
    connecting: 'bg-amber-500',
    disconnected: 'bg-red-500'
  };

  const statusLabels = {
    connected: 'Backend Connected',
    connecting: 'Checking...',
    disconnected: 'Backend Offline'
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse`}></div>
      <span className="text-gray-400">{statusLabels[status]}</span>
    </div>
  );
};

const LoadingStages = ({ stage }) => {
  const stages = [
    { id: 1, label: 'Generating query...', icon: '🔍' },
    { id: 2, label: 'Executing query...', icon: '⚡' },
    { id: 3, label: 'Formatting answer...', icon: '📝' }
  ];

  return (
    <div className="flex items-center gap-4 justify-center py-8">
      {stages.map((s) => (
        <div
          key={s.id}
          className={`flex items-center gap-2 transition-all ${
            s.id === stage
              ? 'text-purple-400 scale-110'
              : s.id < stage
              ? 'text-emerald-400'
              : 'text-gray-600'
          }`}
        >
          <span className="text-2xl">{s.icon}</span>
          <span className="text-sm font-medium">{s.label}</span>
        </div>
      ))}
    </div>
  );
};

const ShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['Enter'], description: 'Submit question' },
    { keys: ['Ctrl', 'K'], description: 'Focus search input' },
    { keys: ['Escape'], description: 'Clear current input' },
    { keys: ['Ctrl', 'L'], description: 'Clear history' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Keyboard Shortcuts</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-4">
          {shortcuts.map((shortcut, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-gray-300">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, i) => (
                  <kbd
                    key={i}
                    className="px-3 py-1 bg-white/10 border border-white/20 rounded text-sm font-mono text-gray-200"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ExportModal = ({ isOpen, onClose, onExport }) => {
  if (!isOpen) return null;

  const exportOptions = [
    {
      format: 'json',
      name: 'JSON',
      description: 'Machine-readable format',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      color: 'from-blue-500 to-cyan-500'
    },
    {
      format: 'markdown',
      name: 'Markdown',
      description: 'Human-readable text format',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'from-purple-500 to-pink-500'
    },
    {
      format: 'pdf',
      name: 'PDF',
      description: 'Printable document format',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-red-500 to-orange-500'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Export Conversation History</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-gray-400 mb-6">Choose your preferred export format:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {exportOptions.map((option) => (
            <button
              key={option.format}
              onClick={() => {
                onExport(option.format);
                onClose();
              }}
              className="group relative overflow-hidden p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 hover:scale-105"
            >
              <div className={`absolute inset-0 bg-linear-to-br ${option.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
              <div className="relative flex flex-col items-center text-center gap-3">
                <div className="text-white">{option.icon}</div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-1">{option.name}</h4>
                  <p className="text-xs text-gray-400">{option.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [generatedCypher, setGeneratedCypher] = useState('');
  const [graphData, setGraphData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(1);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('connecting');
  const [showCypher, setShowCypher] = useState(true);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useLocalStorage('qa-history', []);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isFromHistory, setIsFromHistory] = useState(false);
  const inputRef = useRef(null);

  const BACKEND_URL = 'http://127.0.0.1:8000';

  // Sample questions for user guidance
  const sampleQuestions = [
    "How many movies did Tom Hanks act in?",
    "Which actors played in the movie 'Casino'?",
    "List all movies from the 'Comedy' genre",
    "Which director has directed the most movies?"
  ];

  // Keyboard shortcuts
  useKeyboard([
    {
      key: 'k',
      ctrl: true,
      callback: () => {
        inputRef.current?.focus();
      }
    },
    {
      key: 'Escape',
      callback: () => {
        setQuestion('');
        setShowSuggestions(false);
      },
      allowWhileTyping: true
    },
    {
      key: 'l',
      ctrl: true,
      callback: () => {
        if (history.length > 0 && confirm('Clear all history?')) {
          setHistory([]);
          showToast('History cleared', 'success');
        }
      }
    }
  ]);

  // Check backend status on mount
  useEffect(() => {
    const checkBackendStatus = async () => {
      const prevStatus = backendStatus;
      try {
        const response = await fetch(`${BACKEND_URL}/status`);
        if (response.ok) {
          setBackendStatus('connected');
          if (prevStatus === 'disconnected') {
            showToast('Backend reconnected', 'success');
          }
        } else {
          setBackendStatus('disconnected');
          if (prevStatus === 'connected') {
            showToast('Backend disconnected', 'error');
          }
        }
      } catch (err) {
        setBackendStatus('disconnected');
        if (prevStatus === 'connected') {
          showToast('Backend disconnected', 'error');
        }
      }
    };

    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 10000);

    return () => clearInterval(interval);
  }, [backendStatus]);

  // Handle question input changes with suggestions
  useEffect(() => {
    if (question.trim().length > 0) {
      const historyQuestions = history.map(h => h.question);
      const allSuggestions = [...new Set([...sampleQuestions, ...historyQuestions])];
      const filtered = allSuggestions.filter(q =>
        q.toLowerCase().includes(question.toLowerCase())
      ).slice(0, 5);
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  }, [question, history]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setAnswer('');
    setGeneratedCypher('');
    setError(null);
    setCurrentFeedback(null);
    setShowSuggestions(false);
    setLoadingStage(1);

    try {
      // Stage 1: Generating query
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoadingStage(2);

      const response = await fetch(`${BACKEND_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ question: question }),
      });

      // Stage 2: Executing
      setLoadingStage(3);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error: ${response.status}`);
      }

      const data = await response.json();
      
      // Debug logging
      console.log('🔍 API Response:', data);
      console.log('📊 Graph Data:', data.graph_data);
      console.log('🔢 Graph Data Type:', typeof data.graph_data);
      if (data.graph_data) {
        console.log('📈 Nodes:', data.graph_data.nodes?.length || 0);
        console.log('🔗 Relationships:', data.graph_data.relationships?.length || 0);
      }

      if (data.error) {
        setError(data.error);
        showToast(data.error, 'error');
      } else {
        setAnswer(data.answer);
        setGeneratedCypher(data.generated_cypher);
        setGraphData(data.graph_data);
        setIsFromHistory(false); // New answer, show animation
        
        // Add to history with graph data
        const newHistoryItem = {
          id: Date.now(),
          question: question,
          answer: data.answer,
          cypher: data.generated_cypher,
          graphData: data.graph_data,
          timestamp: Date.now()
        };
        setHistory([newHistoryItem, ...history]);
        
        // Show toast if graph data is available
        if (data.graph_data) {
          showToast('Graph visualization available! Click the graph icon to view.', 'success');
        } else {
          console.warn('⚠️ No graph data returned from backend');
        }
      }
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
      setLoadingStage(1);
    }
  };

  const handleSampleClick = (sample) => {
    setQuestion(sample);
    setShowSuggestions(false);
    // Clear previous results when selecting a new sample
    setAnswer('');
    setGeneratedCypher('');
    setGraphData(null);
    setError(null);
    setCurrentFeedback(null);
    inputRef.current?.focus();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  };

  const handleSelectHistory = (item) => {
    // Restore the complete conversation state
    setQuestion(item.question);
    setAnswer(item.answer);
    setGeneratedCypher(item.cypher);
    setGraphData(item.graphData || null);
    setError(null);
    setCurrentFeedback(null);
    setShowSuggestions(false);
    setIsFromHistory(true); // Mark as from history to skip animation
    setIsSidebarOpen(false);
    showToast('Conversation loaded from history', 'success');
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all history?')) {
      setHistory([]);
      showToast('History cleared', 'success');
    }
  };

  const handleDeleteHistoryItem = (id) => {
    setHistory(history.filter(item => item.id !== id));
    showToast('Item deleted', 'success');
  };

  const handleFeedback = async (rating) => {
    if (!answer || !question) return;

    try {
      const response = await fetch(`${BACKEND_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          answer,
          rating
        })
      });

      if (response.ok) {
        setCurrentFeedback(rating);
        showToast('Thank you for your feedback!', 'success');
      }
    } catch (err) {
      console.error('Feedback error:', err);
      showToast('Failed to submit feedback', 'error');
    }
  };

  const handleExportHistory = (format) => {
    if (history.length === 0) {
      showToast('No history to export', 'warning');
      return;
    }

    try {
      switch (format) {
        case 'json':
          exportToJSON(history);
          break;
        case 'markdown':
          exportToMarkdown(history);
          break;
        case 'pdf':
          exportToPDF(history);
          break;
        default:
          exportToJSON(history);
      }
      showToast(`History exported as ${format.toUpperCase()}!`, 'success');
    } catch (err) {
      showToast('Export failed', 'error');
      console.error('Export error:', err);
    }
  };

  const handleClearConversation = () => {
    setQuestion('');
    setAnswer('');
    setGeneratedCypher('');
    setGraphData(null);
    setError(null);
    setCurrentFeedback(null);
    showToast('Conversation cleared', 'success');
  };

  const handleSuggestionSelect = (suggestion) => {
    setQuestion(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSuggestionSelect(filteredSuggestions[selectedSuggestionIndex]);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* History Sidebar */}
      <HistorySidebar
        history={history}
        onSelectHistory={handleSelectHistory}
        onClearHistory={handleClearHistory}
        onDeleteItem={handleDeleteHistoryItem}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Quick Actions */}
      <QuickActions
        onClearConversation={handleClearConversation}
        onToggleCypher={() => setShowCypher(!showCypher)}
        showCypher={showCypher}
        onExportHistory={() => setShowExportModal(true)}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      {/* Modals */}
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} onExport={handleExportHistory} />
      
      {/* Graph Visualization */}
      {showGraphModal && graphData && (
        <GraphVisualization graphData={graphData} onClose={() => setShowGraphModal(false)} />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Main content */}
      <div className="relative z-10 p-4 sm:p-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-purple-500 to-blue-600 rounded-2xl mb-6 shadow-2xl transform hover:scale-110 transition-transform duration-300">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold bg-linear-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
              Graph Q&A
            </h1>
            <p className="text-gray-400 text-lg mb-4">
              Ask intelligent questions about your graph database
            </p>
            <BackendStatusIndicator status={backendStatus} />
          </div>

          {/* Query Input Form */}
          <div className="mb-8 backdrop-blur-xl bg-white/5 rounded-2xl p-6 shadow-2xl border border-white/10">
            <form onSubmit={handleSubmit} className="mb-6">
              <div className="flex flex-col sm:flex-row gap-4 relative">
                <div className="grow relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => question.trim() && setShowSuggestions(filteredSuggestions.length > 0)}
                    placeholder="Ask anything about your graph data..."
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-300"
                    disabled={isLoading}
                  />
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-20">
                      {filteredSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSuggestionSelect(suggestion)}
                          className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-colors text-gray-300 ${
                            idx === selectedSuggestionIndex ? 'bg-white/10' : ''
                          }`}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  type="submit"
                  className="flex justify-center items-center bg-linear-to-r from-purple-600 to-blue-600 text-white font-semibold p-4 px-8 rounded-xl shadow-lg transition-all duration-300 hover:shadow-purple-500/50 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:hover:scale-100"
                  disabled={isLoading || backendStatus === 'disconnected'}
                >
                  {isLoading ? <LoadingSpinner /> : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Ask
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Sample Questions */}
            {!answer && !error && !isLoading && !question.trim() && (
              <div>
                <p className="text-gray-400 text-sm mb-3 font-medium">Try these examples:</p>
                <div className="flex flex-wrap gap-2">
                  {sampleQuestions.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSampleClick(sample)}
                      className="text-sm px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 transition-all duration-200 hover:scale-105"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Loading State with Stages */}
          {isLoading && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl shadow-2xl mb-6">
              <LoadingStages stage={loadingStage} />
            </div>
          )}

          {/* Results Section */}
          <div className="space-y-6">
            
            {/* Error Display */}
            {error && (
              <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 text-red-200 p-6 rounded-2xl shadow-2xl animate-fade-in">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-bold mb-2 text-lg">Error</h3>
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Answer Display */}
            {answer && (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-2xl font-semibold text-emerald-400">Answer</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Graph visualization button */}
                    {graphData && (
                      <button
                        onClick={() => setShowGraphModal(true)}
                        className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors text-purple-400"
                        title="View Graph Visualization"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                      </button>
                    )}
                    {/* Feedback buttons */}
                    <button
                      onClick={() => handleFeedback('positive')}
                      className={`p-2 rounded-lg transition-colors ${
                        currentFeedback === 'positive'
                          ? 'bg-emerald-500/30 text-emerald-400'
                          : 'hover:bg-white/10 text-gray-400'
                      }`}
                      title="Good answer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleFeedback('negative')}
                      className={`p-2 rounded-lg transition-colors ${
                        currentFeedback === 'negative'
                          ? 'bg-red-500/30 text-red-400'
                          : 'hover:bg-white/10 text-gray-400'
                      }`}
                      title="Poor answer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => copyToClipboard(answer)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Copy answer"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <TypingAnimation text={answer} skipAnimation={isFromHistory} />
              </div>
            )}

            {/* Generated Cypher Display */}
            {generatedCypher && showCypher && (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <h2 className="text-xl font-semibold text-blue-400">Generated Cypher Query</h2>
                  </div>
                  <button
                    onClick={() => copyToClipboard(generatedCypher)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Copy query"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <pre className="bg-slate-900/50 p-4 rounded-xl text-sm text-amber-300 overflow-x-auto border border-white/5">
                  <code>{generatedCypher}</code>
                </pre>
              </div>
            )}
            
          </div>

          {/* Initial state placeholder */}
          {!isLoading && !answer && !error && (
            <div className="text-center text-gray-500 pt-16 animate-fade-in">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white/5 rounded-full mb-6">
                <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-lg">Ask a question to get started</p>
              <p className="text-sm mt-2">Your AI-powered answers will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
