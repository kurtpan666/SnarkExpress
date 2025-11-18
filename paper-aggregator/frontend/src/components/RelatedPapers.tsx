import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { recommendations } from '../api';
import { Paper, PaperNetwork } from '../types';

interface RelatedPapersProps {
  paperId: number;
}

export function RelatedPapers({ paperId }: RelatedPapersProps) {
  const [relatedPapers, setRelatedPapers] = useState<Paper[]>([]);
  const [network, setNetwork] = useState<PaperNetwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGraph, setShowGraph] = useState(false);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        setLoading(true);
        const [relatedResponse, networkResponse] = await Promise.all([
          recommendations.getRelated(paperId, 3),
          recommendations.getNetwork(paperId),
        ]);
        setRelatedPapers(relatedResponse.data);
        setNetwork(networkResponse.data);
      } catch (err) {
        console.error('Failed to fetch related papers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [paperId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Related Papers</h3>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (relatedPapers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Related Papers</h3>
        {network && network.edges.length > 0 && (
          <button
            onClick={() => setShowGraph(!showGraph)}
            className="text-sm text-orange-600 hover:underline"
          >
            {showGraph ? 'Hide' : 'Show'} Graph
          </button>
        )}
      </div>

      {/* Network Graph */}
      {showGraph && network && (
        <div className="mb-4 bg-gray-50 rounded-lg p-4 overflow-auto">
          <PaperNetworkGraph network={network} />
        </div>
      )}

      {/* List View */}
      <div className="space-y-3">
        {relatedPapers.map((paper) => (
          <div key={paper.id} className="border-b border-gray-100 pb-3 last:border-b-0">
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-900 hover:text-orange-600 line-clamp-2"
            >
              {paper.title}
            </a>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
              <span className="text-orange-600 font-semibold">
                {paper.vote_count} points
              </span>
              <span>•</span>
              <div className="flex gap-1 flex-wrap">
                {paper.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 px-1.5 py-0.5 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple network graph visualization
function PaperNetworkGraph({ network }: { network: PaperNetwork }) {
  const width = 600;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 150;

  // Position nodes in a circle around the center
  const nodePositions = new Map<string, { x: number; y: number }>();

  // Find the target node
  const targetNode = network.nodes.find((n) => n.isTarget);
  if (targetNode) {
    nodePositions.set(targetNode.id, { x: centerX, y: centerY });
  }

  // Position other nodes in a circle
  const otherNodes = network.nodes.filter((n) => !n.isTarget);
  otherNodes.forEach((node, index) => {
    const angle = (2 * Math.PI * index) / otherNodes.length;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    nodePositions.set(node.id, { x, y });
  });

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Edges */}
      {network.edges.map((edge, index) => {
        const from = nodePositions.get(edge.from);
        const to = nodePositions.get(edge.to);
        if (!from || !to) return null;

        return (
          <g key={index}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#D1D5DB"
              strokeWidth={Math.min(edge.weight, 4)}
              opacity={0.6}
            />
          </g>
        );
      })}

      {/* Nodes */}
      {network.nodes.map((node) => {
        const pos = nodePositions.get(node.id);
        if (!pos) return null;

        const nodeRadius = node.isTarget ? 8 : 6;
        const color = node.isTarget ? '#EA580C' : '#F97316';

        return (
          <g key={node.id}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={nodeRadius}
              fill={color}
              stroke="white"
              strokeWidth={2}
            />
            <title>{node.label}</title>
          </g>
        );
      })}

      {/* Labels for nodes */}
      {network.nodes.map((node) => {
        const pos = nodePositions.get(node.id);
        if (!pos) return null;

        // Truncate label to fit
        const maxLength = 20;
        const label = node.label.length > maxLength
          ? node.label.substring(0, maxLength) + '...'
          : node.label;

        return (
          <text
            key={`label-${node.id}`}
            x={pos.x}
            y={pos.y + (node.isTarget ? 25 : 20)}
            textAnchor="middle"
            fontSize="10"
            fill="#374151"
            className="pointer-events-none"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
