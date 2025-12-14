
import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from '../hooks/useTranslation';
import { Logo } from '../components/Logo';
import { Button, Input, Card } from '../components/common/UIComponents';
import { ArrowRight } from 'lucide-react';

const { Link, useNavigate, Navigate } = ReactRouterDOM as any;

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (isAuthenticated) {
      return <Navigate to="/app/dashboard" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email);
    navigate('/app/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
       <div className="w-12 h-12 mb-8"><Logo /></div>
       <Card className="w-full max-w-md p-8">
           <h2 className="text-2xl font-bold text-center mb-2">{t('auth.welcomeBack')}</h2>
           <p className="text-center text-gray-500 text-sm mb-8">{t('auth.signInSubtitle')}</p>
           
           <form onSubmit={handleSubmit} className="space-y-4">
              <Input 
                label={t('auth.emailLabel')}
                type="email" 
                placeholder="you@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Input 
                label={t('auth.passwordLabel')}
                type="password" 
                placeholder="••••••••" 
                required
              />
              <Button type="submit" className="w-full mt-4" icon={<ArrowRight size={16} className="rtl:rotate-180"/>}>{t('auth.signInBtn')}</Button>
           </form>
           
           <div className="mt-6 text-center text-xs text-gray-500">
              {t('auth.noAccount')} <Link to="/signup" className="font-bold text-black hover:underline">{t('auth.signUpLink')}</Link>
           </div>
       </Card>
    </div>
  );
};

export const SignupPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuthStore();
    const [email, setEmail] = useState('');

    // Redirect if already logged in
    if (isAuthenticated) {
        return <Navigate to="/app/dashboard" replace />;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login(email);
        navigate('/app/dashboard');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
           <div className="w-12 h-12 mb-8"><Logo /></div>
           <Card className="w-full max-w-md p-8">
               <h2 className="text-2xl font-bold text-center mb-2">{t('auth.createAccount')}</h2>
               <p className="text-center text-gray-500 text-sm mb-8">{t('auth.signUpSubtitle')}</p>
               
               <form onSubmit={handleSubmit} className="space-y-4">
                  <Input label={t('auth.fullNameLabel')} placeholder="John Architect" required />
                  <Input 
                    label={t('auth.emailLabel')} 
                    type="email" 
                    placeholder="you@example.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <Input label={t('auth.passwordLabel')} type="password" placeholder="••••••••" required />
                  <Button type="submit" className="w-full mt-4">{t('auth.createAccountBtn')}</Button>
               </form>
               
               <div className="mt-6 text-center text-xs text-gray-500">
                  {t('auth.hasAccount')} <Link to="/login" className="font-bold text-black hover:underline">{t('auth.signInLink')}</Link>
               </div>
           </Card>
        </div>
    );
};
