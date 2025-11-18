export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 z-10">
      <div className="flex flex-row items-center justify-center gap-1 sm:gap-2 p-2 flex-wrap">
        <div className="whitespace-nowrap">by the <a href="https://zkpunk.pro" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">ZKPunk</a></div>
        <span className="hidden sm:inline">•</span>
        <div className="whitespace-nowrap">for the <a href="https://zkpunk.pro" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">ZKPunk</a></div>
        <span>•</span>
        <div className="flex items-center gap-1 sm:gap-2">
          <a href="/api/feeds/recent" className="text-orange-600 dark:text-orange-400 hover:underline whitespace-nowrap" title="RSS feed for recent papers">
            RSS
          </a>
          <span>•</span>
          <a href="/api/feeds/hot" className="text-orange-600 dark:text-orange-400 hover:underline whitespace-nowrap" title="RSS feed for hot papers">
            Hot RSS
          </a>
        </div>
      </div>
    </footer>
  );
}
