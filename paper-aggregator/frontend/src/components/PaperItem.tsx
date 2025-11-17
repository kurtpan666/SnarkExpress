import React, { useState } from 'react';
import { Paper } from '../types';
import { papers as papersApi } from '../api';
import { useAuth } from '../AuthContext';
import { MathText } from './MathText';

interface PaperItemProps {
  paper: Paper;
  onVoteChange: (paperId: number, voteCount: number, userVote: number | null) => void;
}

export function PaperItem({ paper, onVoteChange }: PaperItemProps) {
  const { isAuthenticated } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleVote = async (vote: number) => {
    if (!isAuthenticated) {
      alert('Please login to vote');
      return;
    }

    try {
      const response = await papersApi.vote(paper.id, vote);
      onVoteChange(paper.id, response.data.vote_count, response.data.user_vote);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const formatDate = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  const copyBibTeX = async () => {
    if (!paper.bib_entry) return;

    try {
      await navigator.clipboard.writeText(paper.bib_entry);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy BibTeX:', error);
      alert('Failed to copy to clipboard');
    }
  };

  return (
    <div className="py-2 border-b border-gray-200">
      <div className="flex items-start space-x-2">
        <div className="flex flex-col items-center text-gray-600 min-w-[40px]">
          <button
            onClick={() => handleVote(paper.user_vote === 1 ? 0 : 1)}
            className={`text-lg ${paper.user_vote === 1 ? 'text-orange-500' : 'hover:text-orange-500'}`}
            disabled={!isAuthenticated}
          >
            ▲
          </button>
          <span className="text-sm font-semibold">{paper.vote_count}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-baseline">
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-black hover:underline text-base"
            >
              {paper.title}
            </a>
            <span className="text-xs text-gray-500 ml-2">
              ({getHostname(paper.url)})
            </span>
          </div>
          <div className="text-xs text-gray-600 mt-1 space-x-2">
            <span>by {paper.submitter_username}</span>
            <span>|</span>
            <span>{formatDate(paper.created_at)}</span>
            {paper.authors && (
              <>
                <span>|</span>
                <span className="italic">{paper.authors}</span>
              </>
            )}
            {paper.tags.length > 0 && (
              <>
                <span>|</span>
                {paper.tags.map((tag, index) => (
                  <span key={index} className="bg-gray-200 px-2 py-0.5 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </>
            )}
            {(paper.abstract || paper.bib_entry) && (
              <>
                <span>|</span>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-blue-600 hover:underline"
                >
                  {showDetails ? 'hide' : 'show'} details
                </button>
              </>
            )}
          </div>
          {showDetails && (
            <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
              {paper.abstract && (
                <div className="mb-3">
                  <h4 className="font-semibold mb-1">Abstract:</h4>
                  <MathText text={paper.abstract} className="text-gray-700 leading-relaxed" />
                </div>
              )}
              {paper.bib_entry && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold">BibTeX:</h4>
                    <button
                      onClick={copyBibTeX}
                      className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors"
                    >
                      {copied ? '✓ Copied!' : 'Copy BibTeX'}
                    </button>
                  </div>
                  <pre className="bg-white p-2 rounded border border-gray-300 overflow-x-auto text-xs">
                    {paper.bib_entry}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
