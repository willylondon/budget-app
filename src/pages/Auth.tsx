import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';
import { Logo } from '../components/ui/Logo';

export function Auth() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                toast.success('Welcome back to London\'s Ledger Pro!');
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                toast.success('Account created! Please check your email to verify.');
            }
        } catch (error: any) {
            toast.error(error.message || 'An error occurred during authentication');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-[400px]">
                <div className="flex flex-col items-center mb-8">
                    <Logo className="w-16 h-16 drop-shadow-xl mb-4" />
                    <div className="flex items-center text-[14px] font-bold tracking-widest uppercase opacity-90 leading-none mb-1">
                        <span className="text-textPrimary">London's</span>
                        <span className="text-[#F89B5F] ml-1">Ledger</span>
                    </div>
                    <div className="font-mono text-primary text-[12px] bg-primary/10 tracking-widest px-3 py-1 rounded-full mt-2 border border-primary/20">PRO CLOUD</div>
                </div>

                <Card>
                    <div className="text-xl font-bold font-mono text-center mb-6">
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className="block text-xs text-textMuted mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl px-4 py-3 text-sm bg-border/50 border border-border outline-none focus:border-primary transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-textMuted mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl px-4 py-3 text-sm bg-border/50 border border-border outline-none focus:border-primary transition-colors"
                                required
                            />
                        </div>

                        <Button type="submit" fullWidth disabled={loading}>
                            {loading ? 'Processing...' : (isLogin ? 'Access Ledger' : 'Create Ledger')}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-textMuted">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-primary hover:underline font-medium"
                        >
                            {isLogin ? 'Register here' : 'Sign in'}
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
