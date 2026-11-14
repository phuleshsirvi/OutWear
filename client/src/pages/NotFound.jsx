import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';

export default function NotFound() {
  useEffect(() => {
    document.title = 'Page Not Found · OutWear';
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 text-center animate-fade-in-up font-sans">
      <div className="max-w-lg w-full bg-white/75 border border-white/70 backdrop-blur-2xl rounded-3xl p-8 sm:p-12 shadow-[0_16px_50px_rgba(99,102,241,0.12)] space-y-6 relative overflow-hidden">
        {/* Floating Hanger Illustration */}
        <div className="relative w-20 h-20 mx-auto rounded-3xl bg-[#E3E6FB] border border-[#D4D8F7] flex items-center justify-center text-4xl shadow-xs">
          <span>👗</span>
        </div>

        {/* 404 Number & Friendly Message */}
        <div className="relative space-y-1">
          <div className="text-7xl sm:text-8xl font-black font-heading tracking-tight text-[#4F5BD5] select-none">
            404
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-[#1E2140]">
            Outfit Not Found
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7194] max-w-sm mx-auto leading-relaxed">
            We couldn't find the page or outfit you're looking for. It may have been retired from the wardrobe or moved.
          </p>
        </div>

        {/* Return Button */}
        <div className="pt-2 relative flex justify-center">
          <Button
            as={Link}
            to="/wardrobe"
            variant="primary"
            size="md"
            className="w-full sm:w-auto px-8 shadow-[0_4px_16px_rgba(79,91,213,0.25)] gap-2"
          >
            <span>👗</span>
            <span>Return to Wardrobe</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
