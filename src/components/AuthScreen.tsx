import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  ChevronDown, 
  Search,
  Phone
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '../context/AuthContext';
import { COUNTRIES, Country } from '../data/countries';

export const AuthScreen: React.FC = () => {
  const { register, login } = useAuth();
  const [mode, setMode] = useState<'register' | 'login'>('register');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Country Selection States
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // Default to Nigeria 🇳🇬
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.dialCode.includes(countrySearch) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!phoneNumber.trim()) {
        setError('Please enter your phone number.');
        return;
      }
      if (!agreedTerms) {
        setError('Please accept the Terms of Service to continue.');
        return;
      }

      setIsLoading(true);
      setTimeout(() => {
        const fullPhone = phoneNumber ? `${selectedCountry.dialCode} ${phoneNumber}` : '';
        const res = register(name, email, password, selectedCountry.name, selectedCountry.code, fullPhone);
        setIsLoading(false);
        if (!res.success) {
          setError(res.message || 'Registration failed.');
        }
      }, 400);
    } else {
      if (!email.trim()) {
        setError('Please enter your email.');
        return;
      }
      if (!password) {
        setError('Please enter your password.');
        return;
      }

      setIsLoading(true);
      setTimeout(() => {
        const res = login(email, password);
        setIsLoading(false);
        if (!res.success) {
          setError(res.message || 'Invalid credentials.');
        }
      }, 400);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D14] flex flex-col justify-center items-center p-4 sm:p-6 text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md bg-[#121824]/90 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-5 sm:p-8 shadow-2xl relative z-10">
        {/* Brand header */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-2">
            <BrandLogo size="lg" showTagline={true} />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {mode === 'register' 
              ? 'Create your secure account to access live global trading markets' 
              : 'Sign in to access your trading portfolio & live markets'}
          </p>
        </div>

        {/* Tab switch between Register and Login */}
        <div className="grid grid-cols-2 p-1 bg-[#0B0F17] rounded-xl border border-slate-800/80 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-[#F5BA31] text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-[#F5BA31] text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Notice for new account balance */}
        {mode === 'register' && (
          <div className="mb-4 p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-200/90 leading-tight">
              <strong className="text-amber-400 font-bold">Standard Account:</strong> New accounts activate with an initial balance of <strong className="text-white font-mono">$0.00</strong>. Practice with zero deposit risk or fund anytime.
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <>
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40 transition-all"
                  />
                </div>
              </div>

              {/* Country Selection */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-slate-300">Country of Residence</label>
                  <span className="text-[10px] text-amber-400/90 font-medium">Select your country</span>
                </div>
                
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                    className="w-full pl-3.5 pr-3 py-2.5 bg-[#0B0F17] border border-slate-800 hover:border-slate-700 rounded-xl text-sm text-white flex items-center justify-between transition-all focus:outline-none focus:border-amber-400/60"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-lg leading-none">{selectedCountry.flag}</span>
                      <span className="font-semibold text-slate-100">{selectedCountry.name}</span>
                      <span className="text-xs text-slate-500 font-mono">({selectedCountry.dialCode})</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Country Selector Dropdown */}
                  {isCountryDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40 bg-black/40" 
                        onClick={() => setIsCountryDropdownOpen(false)} 
                      />
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#0D131F] border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {/* Search in Dropdown */}
                        <div className="p-2 border-b border-slate-800">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              placeholder="Search country or code..."
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 bg-[#141B27] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Country List */}
                        <div className="max-h-52 overflow-y-auto divide-y divide-slate-800/40 no-scrollbar">
                          {filteredCountries.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(country);
                                setIsCountryDropdownOpen(false);
                                setCountrySearch('');
                              }}
                              className={`w-full px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/60 transition-colors text-left ${
                                selectedCountry.code === country.code ? 'bg-amber-400/10 text-amber-300 font-bold' : 'text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-base">{country.flag}</span>
                                <span className="truncate">{country.name}</span>
                              </div>
                              <span className="text-[11px] font-mono text-slate-400 ml-2 shrink-0">{country.dialCode}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile Phone Number */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                <div className="flex rounded-xl overflow-hidden border border-slate-800 focus-within:border-amber-400/60 focus-within:ring-1 focus-within:ring-amber-400/40 bg-[#0B0F17] transition-all">
                  <div className="px-3 py-2.5 bg-[#141B27] border-r border-slate-800 text-slate-300 text-xs font-mono font-semibold flex items-center gap-1.5 shrink-0 select-none">
                    <span>{selectedCountry.flag}</span>
                    <span className="text-amber-400">{selectedCountry.dialCode}</span>
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder={selectedCountry.code === 'NG' ? '801 234 5678' : 'Phone number'}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40 transition-all"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400 focus:ring-offset-0"
              />
              <label htmlFor="terms" className="text-[11px] text-slate-400 leading-tight">
                I agree to the <span className="text-amber-400 hover:underline">Terms of Service</span>, <span className="text-amber-400 hover:underline">Privacy Policy</span>, and Risk Disclosure statement.
              </label>
            </div>
          )}

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-[#F5BA31] hover:bg-[#ffc842] active:scale-[0.99] text-slate-950 font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'register' ? 'Register & Open Dashboard' : 'Sign In to IQ-PLUS'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security badges */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-4 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 256-Bit SSL Encryption
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ISO/IEC 27001
          </span>
        </div>
      </div>
    </div>
  );
};
