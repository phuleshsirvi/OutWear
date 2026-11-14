import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, BarChart3, ShoppingBag, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup } = useAuth();

  const from = location.state?.from?.pathname || '/wardrobe';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    let isValid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters.');
      isValid = false;
    }

    if (!email.trim()) {
      setEmailError('Email address is required.');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      isValid = false;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
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
      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to sign up. Please try again.');
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
                  Smart Wardrobe
                </span>
              </div>
            </div>
          </div>

          {/* Tagline & Feature Bullets */}
          <div className="space-y-6 my-auto py-8">
            <h2 className="text-2xl font-extrabold font-heading text-[#1E2140] leading-snug">
              Digitize your closet.{' '}
              <span className="text-[#4F5BD5] block">Dress with joy.</span>
            </h2>

            <div className="space-y-3.5 text-xs text-[#6B7194]">
              {/* Bullet 1 */}
              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-xl bg-[#E3E6FB] border border-[#D4D8F7] flex items-center justify-center text-[#4F5BD5] shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-[#1E2140] block text-xs">Curated Outfits</strong>
                  Pair pieces easily with harmonious style suggestions.
                </div>
              </div>

              {/* Bullet 2 */}
              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-xl bg-[#E3F2D9] border border-[#D5EAC8] flex items-center justify-center text-[#4C8A3A] shrink-0">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-[#1E2140] block text-xs">Wear Habits Tracker</strong>
                  Uncover what you actually wear and calculate cost-per-wear.
                </div>
              </div>

              {/* Bullet 3 */}
              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-xl bg-[#DCE8FB] border border-[#CDE0FA] flex items-center justify-center text-[#3B5FB0] shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-[#1E2140] block text-xs">Smart Buying Advice</strong>
                  Check for closet duplicates before spending money.
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Note */}
          <div className="pt-4 border-t border-white/60 text-[11px] text-[#6B7194] flex items-center justify-between">
            <span>Free personal closet manager</span>
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
              Create your account
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7194]">
              Start building your digital wardrobe today
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
            {/* Full Name */}
            <Input
              id="name"
              label="Full Name"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
              placeholder="Alex Johnson"
              error={nameError}
            />

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
              placeholder="At least 8 characters"
              error={passwordError}
              suffixIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="pointer-events-auto min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#6B7194] hover:text-[#1E2140] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F5BD5]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {/* Confirm Password */}
            <Input
              id="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmPasswordError) setConfirmPasswordError('');
              }}
              placeholder="Re-enter password"
              error={confirmPasswordError}
              suffixIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="pointer-events-auto min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#6B7194] hover:text-[#1E2140] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F5BD5]"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

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
                <span>{isSubmitting ? 'Creating account...' : 'Create your account'}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </form>

          {/* Footer Switch */}
          <div className="pt-3 text-center text-xs text-[#6B7194] border-t border-white/60">
            Already have an account?{' '}
            <Link
              to="/login"
              state={{ from: location.state?.from }}
              className="font-bold text-[#4F5BD5] hover:text-[#434EB9] transition underline underline-offset-4"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
