export default function Outfits() {
  return (
    <div className="w-full flex justify-center py-8">
      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700 backdrop-blur rounded-2xl p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-3xl">
          👔
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Outfits
          </h1>
          <p className="text-slate-400 text-sm">
            Coming soon
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Outfit curation, pairings, and smart combinations are on the way.
        </p>
      </div>
    </div>
  );
}
