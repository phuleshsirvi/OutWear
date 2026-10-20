import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700 backdrop-blur rounded-2xl p-8 shadow-xl space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 mb-2">
          <span className="text-3xl font-mono font-bold">404</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Page Not Found
          </h1>
          <p className="text-slate-400 text-sm">
            We couldn't find the page you're looking for. It may have been moved or doesn't exist.
          </p>
        </div>

        <Link
          to="/wardrobe"
          className="inline-block w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20 cursor-pointer"
        >
          Return to Wardrobe
        </Link>
      </div>
    </div>
  );
}
