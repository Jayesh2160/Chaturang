import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { UserPlus, Sparkles } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    rating: '1200',
  });
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
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email address is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    const ratingVal = parseInt(formData.rating, 10);
    if (formData.rating && (isNaN(ratingVal) || ratingVal < 100 || ratingVal > 3500)) {
      newErrors.rating = 'Rating must be a number between 100 and 3500';
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
      await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        rating: parseInt(formData.rating, 10),
      });
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setApiError(
        err.response?.data?.message || 
        (err.response?.data?.errors ? Object.values(err.response.data.errors).join(', ') : 'Registration failed. Try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-height-screen flex flex-col items-center justify-center px-4 py-12 md:py-24">
      {/* Floating Header */}
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
            <UserPlus className="w-6 h-6 text-violet-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Join Chaturang and start your targeted learning journey
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
              label="Username"
              id="username"
              name="username"
              placeholder="e.g. magnus_carlsen"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              disabled={isLoading}
            />

            <Input
              label="Email Address"
              id="email"
              name="email"
              type="email"
              placeholder="e.g. magnus@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
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

            <Input
              label="Your Current Chess Rating (Approx)"
              id="rating"
              name="rating"
              type="number"
              placeholder="e.g. 1200"
              value={formData.rating}
              onChange={handleChange}
              error={errors.rating}
              disabled={isLoading}
            />

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign Up
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-xs text-zinc-400">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>

      {/* Feature highlight */}
      <div className="w-full max-w-md mt-6 p-4 rounded-xl border border-zinc-800/40 bg-zinc-950/20 text-zinc-400 flex gap-3 text-xs leading-relaxed">
        <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <span className="font-semibold text-zinc-300 block mb-0.5">Rating Calibration</span>
          We use your approximate chess rating to tailor puzzle generators, suggest opening study material, and adjust Stockfish analysis depth recommendations.
        </div>
      </div>
    </div>
  );
};
