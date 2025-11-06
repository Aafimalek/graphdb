import { useEffect } from 'react';

function useKeyboard(shortcuts) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if user is typing in an input/textarea
      const isTyping = ['INPUT', 'TEXTAREA'].includes(event.target.tagName);

      shortcuts.forEach(({ key, ctrl, meta, shift, alt, callback, allowWhileTyping = false }) => {
        // Skip if typing in input (unless explicitly allowed)
        if (isTyping && !allowWhileTyping) return;

        const ctrlMatch = ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
        const metaMatch = meta ? (event.metaKey || event.ctrlKey) : !event.metaKey && !event.ctrlKey;
        const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
        const altMatch = alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === key.toLowerCase();

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
          event.preventDefault();
          callback(event);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export default useKeyboard;

