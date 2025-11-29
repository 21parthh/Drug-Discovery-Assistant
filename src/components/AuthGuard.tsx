import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
interface AuthGuardProps {
  children: React.ReactNode;
}
interface UserProfile {
  status: 'pending' | 'approved' | 'rejected';
  role: 'admin' | 'user';
}
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
  }, [user, authLoading, navigate]);
  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('status, role')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };
  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  if (!profile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Alert className="max-w-md" variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Profile not found. Please contact support.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }
  if (profile.role === 'admin') {
    return <>{children}</>;
  }
  if (profile.status === 'pending') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Alert className="max-w-md">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Your account is pending approval. An administrator will review your research focus and approve your access shortly.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }
  if (profile.status === 'rejected') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Alert className="max-w-md" variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Your account has been rejected. Please contact support for more information.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }
  return <>{children}</>;
}