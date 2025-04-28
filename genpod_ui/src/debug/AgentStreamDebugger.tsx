'use client';

import { useEffect } from 'react';

export default function AgentStreamDebugger() {
  useEffect(() => {
    const prompt = 'build a simple login app';
    const es = new EventSource(`/api/agentStream?prompt=${encodeURIComponent(prompt)}&user_id=testUser`);

    es.addEventListener('log', (e) => {
      console.log('📄 [Log]', JSON.parse(e.data));
    });

    es.addEventListener('event', (e) => {
      console.log('🔄 [Workflow Event]', JSON.parse(e.data));
    });

    es.addEventListener('answer', (e) => {
      console.log('✅ [Final Answer]', JSON.parse(e.data));
    });

    es.onerror = (err) => {
        console.error('❌ SSE Error:', err); // not very helpful
      
        fetch('/api/agentStream?prompt=test&user_id=testUser')
          .then((res) => res.text())
          .then(console.warn); // will show raw server error
      
        es.close();
      };

    return () => es.close();
  }, []);

  return (
    <div className="p-4 bg-white border rounded">
      <h2 className="text-lg font-semibold">AgentStreamDebugger</h2>
      <p>Check console logs for real-time updates from backend agents.</p>
    </div>
  );
}