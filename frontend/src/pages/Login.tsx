import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { LogIn } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ usernameOrEmail: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setApiError(null);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.usernameOrEmail.trim()) {
      newErrors.usernameOrEmail = 'Username or email is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setApiError(null);
    try {
      await login({
        usernameOrEmail: formData.usernameOrEmail.trim(),
        password: formData.password,
      });
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setApiError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative">
      {/* Visual Floating Chess piece background logo linking to Landing */}
      <Link to="/" className="absolute top-10 flex items-center gap-2 select-none hover:opacity-90 transition-opacity">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-violet-600 to-sky-400 flex items-center justify-center shadow-md">
          <span className="font-display font-extrabold text-white text-sm">Ch</span>
        </div>
        <span className="font-display font-bold text-lg tracking-wider text-white">Chaturang</span>
      </Link>

      <Card className="w-full max-w-sm bg-zinc-950 border-white/5 rounded-2xl relative overflow-hidden mt-8 shadow-2xl p-6">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 text-white">
            <LogIn className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <CardTitle className="text-xl font-bold font-display text-white">Welcome Back</CardTitle>
          <CardDescription className="text-zinc-400 text-xs mt-1">
            Enter your credentials to study chess blunder patterns
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {apiError && (
              <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 text-xs font-semibold text-left">
                {apiError}
              </div>
            )}

            <Input
              label="Username or Email"
              id="usernameOrEmail"
              name="usernameOrEmail"
              placeholder="e.g. magnus123"
              value={formData.usernameOrEmail}
              onChange={handleChange}
              error={errors.usernameOrEmail}
              disabled={isLoading}
            />

            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              disabled={isLoading}
            />

            <Button
              type="submit"
              className="w-full mt-4"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center pt-6 mt-4 border-t border-white/5">
          <p className="text-xs text-zinc-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-white hover:underline font-semibold transition-colors">
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
