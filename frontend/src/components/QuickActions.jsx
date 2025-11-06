import { useState } from 'react';

const QuickActions = ({ onClearConversation, onToggleCypher, showCypher, onExportHistory, onShowShortcuts }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      id: 'clear',
      label: 'Clear Conversation',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      onClick: onClearConversation,
      color: 'hover:bg-red-500/20 hover:text-red-400'
    },
    {
      id: 'cypher',
      label: showCypher ? 'Hide Cypher' : 'Show Cypher',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      onClick: onToggleCypher,
      color: 'hover:bg-blue-500/20 hover:text-blue-400'
    },
    {
      id: 'export',
      label: 'Export History',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      onClick: onExportHistory,
      color: 'hover:bg-emerald-500/20 hover:text-emerald-400'
    },
    {
      id: 'shortcuts',
      label: 'Keyboard Shortcuts',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      onClick: onShowShortcuts,
      color: 'hover:bg-purple-500/20 hover:text-purple-400'
    }
  ];

  return (
    <div className="fixed bottom-8 right-8 z-30">
      {/* Action menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-2 mb-2 animate-slide-up">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${action.color} text-gray-300`}
            >
              {action.icon}
              <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 bg-linear-to-br from-purple-600 to-blue-600 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-purple-500/50 ${
          isOpen ? 'rotate-45' : ''
        }`}
        aria-label="Quick actions"
      >
        <svg
          className="w-6 h-6 text-white transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </button>
    </div>
  );
};

export default QuickActions;

