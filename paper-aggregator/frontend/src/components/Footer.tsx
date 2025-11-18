export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 sm:bottom-4 sm:left-4 sm:right-auto bg-white dark:bg-gray-800 sm:bg-transparent sm:dark:bg-transparent border-t sm:border-t-0 border-gray-200 dark:border-gray-700 sm:border-none text-xs text-gray-600 dark:text-gray-400 z-10">
      <div className="flex flex-row sm:flex-col items-center sm:items-start justify-center sm:justify-start gap-1 sm:gap-0 p-2 sm:p-0 flex-wrap">
        <div className="whitespace-nowrap">by the <a href="https://zkpunk.pro" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">ZKPunk</a></div>
        <div className="whitespace-nowrap sm:block">for the <a href="https://zkpunk.pro" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">ZKPunk</a></div>
        <div className="sm:mt-2 flex items-center gap-1">
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
