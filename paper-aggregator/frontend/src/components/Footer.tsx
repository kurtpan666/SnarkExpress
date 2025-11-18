export function Footer() {
  return (
    <footer className="fixed bottom-4 left-4 text-xs text-gray-600 z-10">
      <div>by  the <a href="https://zkpunk.pro" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ZKPunk</a></div>
      <div>for the <a href="https://zkpunk.pro" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ZKPunk</a></div>
      <div className="mt-2 space-x-2">
        <a href="/api/feeds/recent" className="text-orange-600 hover:underline" title="RSS feed for recent papers">
          RSS
        </a>
        <span>•</span>
        <a href="/api/feeds/hot" className="text-orange-600 hover:underline" title="RSS feed for hot papers">
          Hot RSS
        </a>
      </div>
    </footer>
  );
}
