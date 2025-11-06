import { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';

const GraphVisualization = ({ graphData, onClose }) => {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });

  useEffect(() => {
    if (!containerRef.current || !graphData) return;

    // Parse graph data
    const nodes = graphData.nodes.map(node => ({
      id: node.id,
      label: node.label,
      title: node.properties ? Object.entries(node.properties)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n') : '',
      color: getNodeColor(node.labels?.[0] || 'default'),
      font: { color: '#ffffff', size: 14 },
      shape: 'dot',
      size: 20
    }));

    const edges = graphData.relationships.map((rel, idx) => ({
      id: idx,
      from: rel.startNode,
      to: rel.endNode,
      label: rel.type,
      arrows: 'to',
      color: { color: '#848484', highlight: '#848484' },
      font: { color: '#ffffff', size: 12, background: '#1e293b' }
    }));

    setStats({ nodes: nodes.length, edges: edges.length });

    const data = { nodes, edges };

    const options = {
      nodes: {
        borderWidth: 2,
        borderWidthSelected: 3,
        shadow: true
      },
      edges: {
        width: 2,
        shadow: true,
        smooth: {
          type: 'continuous'
        }
      },
      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -2000,
          centralGravity: 0.3,
          springLength: 150,
          springConstant: 0.04
        },
        stabilization: {
          iterations: 200
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        hideEdgesOnDrag: true,
        navigationButtons: true,
        keyboard: true
      }
    };

    networkRef.current = new Network(containerRef.current, data, options);

    // Fit the network to the container
    networkRef.current.once('stabilizationIterationsDone', () => {
      networkRef.current.fit({
        animation: {
          duration: 1000,
          easingFunction: 'easeInOutQuad'
        }
      });
    });

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [graphData]);

  const getNodeColor = (label) => {
    const colors = {
      'Person': '#10B981',   // Emerald green - for people
      'Movie': '#3B82F6',    // Blue - for movies
      'Genre': '#F59E0B',    // Amber - for genres
      'Actor': '#10B981',    // Same as Person
      'Director': '#8B5CF6', // Purple - for directors
      'default': '#6B7280'   // Gray - for unknown types
    };
    return colors[label] || colors.default;
  };
  
  // Get unique node types for the legend
  const getNodeTypes = () => {
    if (!graphData || !graphData.nodes) return [];
    const types = new Set();
    graphData.nodes.forEach(node => {
      if (node.labels && node.labels.length > 0) {
        types.add(node.labels[0]);
      }
    });
    return Array.from(types).sort();
  };

  const handleExportImage = () => {
    if (networkRef.current) {
      const canvas = containerRef.current.querySelector('canvas');
      if (canvas) {
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `graph-${Date.now()}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        });
      }
    }
  };

  const handleZoomIn = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale * 1.2 });
    }
  };

  const handleZoomOut = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale * 0.8 });
    }
  };

  const handleFit = () => {
    if (networkRef.current) {
      networkRef.current.fit({ animation: { duration: 500 } });
    }
  };

  if (!graphData || (graphData.nodes.length === 0 && graphData.relationships.length === 0)) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full text-center" onClick={(e) => e.stopPropagation()}>
          <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-bold text-white mb-2">No Graph Data Available</h3>
          <p className="text-gray-400 mb-4">This query doesn't return graph structure data.</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col" onClick={onClose}>
      <div className="w-full h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Graph Visualization
              </h2>
              <div className="flex gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  {stats.nodes} Nodes
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  {stats.edges} Relationships
                </span>
              </div>
              
              {/* Color Legend */}
              <div className="flex gap-3 text-sm text-gray-400 ml-6 pl-6 border-l border-white/10">
                {getNodeTypes().map(type => (
                  <span key={type} className="flex items-center gap-1.5">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: getNodeColor(type) }}
                    ></span>
                    {type}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomIn}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Zoom In"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              <button
                onClick={handleFit}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Fit to Screen"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              <button
                onClick={handleExportImage}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Export as Image"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors ml-2"
                title="Close"
              >
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Graph Container */}
        <div ref={containerRef} className="grow bg-slate-950" style={{ width: '100%', height: 'calc(100vh - 80px)' }} />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-white mb-2">Legend</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              <span className="text-gray-300">Person</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-gray-300">Movie</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-gray-300">Genre</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 right-4 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-white mb-2">Controls</h4>
          <div className="space-y-1 text-xs text-gray-300">
            <p>• Drag nodes to reposition</p>
            <p>• Scroll to zoom</p>
            <p>• Click and drag to pan</p>
            <p>• Hover for details</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphVisualization;

