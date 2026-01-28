"use client"
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter()
  const handleChange = (e : React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        setError(data.error || data.message || 'Sign up failed');
      }
      localStorage.setItem(process.env.NEXT_PUBLIC_COOKIE_NAME as string, data.token )
      setSuccess(true);
      setFormData({ email: '', password: '', name: '' });
      
      setTimeout(() => {
        router.replace('/')
      }, 1500);

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter" && !isLoading) {
    handleSubmit();
  }
};

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-zinc-800 rounded-lg shadow-xl p-8 border border-zinc-700">
          <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#e0e0e0' }}>
            Sign Up 
          </h1>
          <p className="text-zinc-400 text-center mb-8">
            Create your account to get started
          </p>

          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: '#e0e0e0' }}>
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all disabled:opacity-50"
                style={{ color: '#e0e0e0' }}
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#e0e0e0' }}>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all disabled:opacity-50"
                style={{ color: '#e0e0e0' }}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#e0e0e0' }}>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all disabled:opacity-50"
                style={{ color: '#e0e0e0' }}
                placeholder="Enter your password (min 6 characters)"
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-900/30 border border-green-800 rounded-lg p-3">
                <p className="text-green-400 text-sm">Account created successfully! Redirecting...</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style={{ 
                backgroundColor: '#e0e0e0',
                color: '#18181b'
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Sign Up'
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-zinc-400 text-sm">
              Already have an account?{' '}
              <a href="/signin" className="font-medium hover:underline" style={{ color: '#e0e0e0' }}>
                Sign In
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}