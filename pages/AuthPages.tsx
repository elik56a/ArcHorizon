
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Logo } from '../components/Logo';
import { Button, Input, Card } from '../components/common/UIComponents';
import { ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email);
    navigate('/app/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
       <div className="w-12 h-12 mb-8"><Logo /></div>
       <Card className="w-full max-w-md p-8">
           <h2 className="text-2xl font-bold text-center mb-2">Welcome back</h2>
           <p className="text-center text-gray-500 text-sm mb-8">Sign in to your account to continue</p>
           
           <form onSubmit={handleSubmit} className="space-y-4">
              <Input 
                label="Email Address" 
                type="email" 
                placeholder="you@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Input 
                label="Password" 
                type="password" 
                placeholder="••••••••" 
                required
              />
              <Button type="submit" className="w-full mt-4" icon={<ArrowRight size={16}/>}>Sign In</Button>
           </form>
           
           <div className="mt-6 text-center text-xs text-gray-500">
              Don't have an account? <Link to="/signup" className="font-bold text-black hover:underline">Sign up</Link>
           </div>
       </Card>
    </div>
  );
};

export const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login(email);
        navigate('/app/dashboard');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
           <div className="w-12 h-12 mb-8"><Logo /></div>
           <Card className="w-full max-w-md p-8">
               <h2 className="text-2xl font-bold text-center mb-2">Create your account</h2>
               <p className="text-center text-gray-500 text-sm mb-8">Start building your dream projects today</p>
               
               <form onSubmit={handleSubmit} className="space-y-4">
                  <Input label="Full Name" placeholder="John Architect" required />
                  <Input 
                    label="Email Address" 
                    type="email" 
                    placeholder="you@example.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <Input label="Password" type="password" placeholder="••••••••" required />
                  <Button type="submit" className="w-full mt-4">Create Account</Button>
               </form>
               
               <div className="mt-6 text-center text-xs text-gray-500">
                  Already have an account? <Link to="/login" className="font-bold text-black hover:underline">Sign in</Link>
               </div>
           </Card>
        </div>
    );
};
