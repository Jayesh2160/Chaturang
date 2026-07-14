import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { LogIn, HelpCircle } from 'lucide-react';

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
    <div className="min-height-screen flex flex-col items-center justify-center px-4 py-12 md:py-24">
      {/* Visual Floating Chess piece background logo */}
      <div className="absolute top-10 flex items-center gap-2 select-none">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-sky-400 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <span className="font-display font-extrabold text-white text-xl">Ch</span>
        </div>
        <span className="font-display font-bold text-2xl tracking-wider text-white">Chaturang</span>
      </div>

      <Card className="w-full max-w-md glass-panel relative overflow-hidden mt-8">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
        
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mb-2">
            <LogIn className="w-6 h-6 text-violet-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Enter your credentials to access your dashboard
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {apiError && (
              <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-medium animate-fadeIn">
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
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-xs text-zinc-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>

      {/* Rationale widget */}
      <div className="w-full max-w-md mt-6 p-4 rounded-xl border border-zinc-800/40 bg-zinc-950/20 text-zinc-400 flex gap-3 text-xs leading-relaxed">
        <HelpCircle className="w-5 h-5 text-violet-400 shrink-0" />
        <div>
          <span className="font-semibold text-zinc-300 block mb-0.5">Why Chaturang?</span>
          Chaturang parses your chess records, isolates patterns in your blunders, and tells you what to study. Register to start importing your games.
        </div>
      </div>
    </div>
  );
};
