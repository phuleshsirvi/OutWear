import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, BarChart3, ShoppingBag, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || '/wardrobe';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError('Email address is required.');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
      });

      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in font-sans">
      <div className="w-full max-w-4xl rounded-3xl bg-white/75 border border-white/70 shadow-[0_16px_50px_rgba(99,102,241,0.14)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 backdrop-blur-2xl">
        {/* Left Decorative Feature Panel (Desktop lg+) */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-br from-[#E3E6FB]/80 via-white/60 to-[#CFE6E0]/50 p-8 sm:p-10 flex-col justify-between border-r border-white/60">
          {/* Brand Logo Chip */}
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#4F5BD5] to-[#707BF7] flex items-center justify-center text-white text-xl shadow-[0_4px_16px_rgba(79,91,213,0.30)]">
                👗
              </div>
              <div>
                <span className="text-xl font-black font-heading tracking-tight text-[#1E2140] block">
                  OutWear
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#4F5BD5]">
                  Style & Wardrobe
                </span>
              </div>
            </div>
          </div>

          {/* Tagline & 3 Feature Bullets */}
          <div className="space-y-6 my-auto py-8">
            <h2 className="text-2xl font-extrabold font-heading text-[#1E2140] leading-snug">
              Know your closet.{' '}
              <span className="text-[#4F5BD5] block">Love your outfits.</span>
            </h2>

            <div className="space-y-3.5 text-xs text-[#6B7194]">
              {/* Bullet 1 */}
              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-xl bg-[#E3E6FB] border border-[#D4D8F7] flex items-center justify-center text-[#4F5BD5] shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-[#1E2140] block text-xs">AI Outfit Suggestions</strong>
                  Curated color harmony & seasonal freshness.
                </div>
              </div>

              {/* Bullet 2 */}
              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-xl bg-[#E3F2D9] border border-[#D5EAC8] flex items-center justify-center text-[#4C8A3A] shrink-0">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-[#1E2140] block text-xs">Cost Per Wear Insights</strong>
                  Track every wear and discover your true closet value.
                </div>
              </div>

              {/* Bullet 3 */}
              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-xl bg-[#DCE8FB] border border-[#CDE0FA] flex items-center justify-center text-[#3B5FB0] shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-[#1E2140] block text-xs">Before-You-Buy Check</strong>
                  Avoid accidental duplicates before you check out.
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Note */}
          <div className="pt-4 border-t border-white/60 text-[11px] text-[#6B7194] flex items-center justify-between">
            <span>Mindful wardrobe curation</span>
            <span className="font-semibold text-[#4F5BD5]">OutWear</span>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6">
          {/* Mobile Header with Logo Chip */}
          <div className="lg:hidden text-center space-y-2 mb-1">
            <div className="inline-flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#4F5BD5] to-[#707BF7] flex items-center justify-center text-white text-base shadow-xs">
                👗
              </div>
              <span className="text-2xl font-black font-heading text-[#1E2140]">OutWear</span>
            </div>
            <p className="text-xs text-[#6B7194]">Know your closet. Love your outfits.</p>
          </div>

          {/* Form Title */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#1E2140] tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7194]">
              Sign in with your email to manage your closet
            </p>
          </div>

          {/* Global Error Alert */}
          {error && (
            <div
              role="alert"
              className="rounded-2xl bg-[#FBE3DC] border border-[#F6D0C5] p-3.5 text-xs sm:text-sm text-[#C2492E] flex items-center space-x-2.5 animate-fade-in"
            >
              <span className="text-base shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <Input
              id="email"
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              placeholder="alex@example.com"
              error={emailError}
            />

            {/* Password */}
            <div>
              <Input
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                placeholder="Enter your password"
                error={passwordError}
                suffixIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="pointer-events-auto min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#6B7194] hover:text-[#1E2140] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F5BD5]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isSubmitting}
                disabled={isSubmitting}
                className="w-full font-bold shadow-[0_4px_16px_rgba(79,91,213,0.30)]"
              >
                <span>{isSubmitting ? 'Signing in...' : 'Sign in to OutWear'}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </form>

          {/* Footer Switch */}
          <div className="pt-3 text-center text-xs text-[#6B7194] border-t border-white/60">
            Don't have an account yet?{' '}
            <Link
              to="/signup"
              state={{ from: location.state?.from }}
              className="font-bold text-[#4F5BD5] hover:text-[#434EB9] transition underline underline-offset-4"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
