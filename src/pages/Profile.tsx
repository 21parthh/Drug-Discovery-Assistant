import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Mail, Building, FileText, Save } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  organization: string | null;
  research_focus: string | null;
  avatar_url: string | null;
}
export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
  }, [user, navigate]);
  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !profile) return;
    setIsSaving(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const updates = {
      full_name: formData.get('fullName') as string,
      organization: formData.get('organization') as string,
      research_focus: formData.get('researchFocus') as string,
    };
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);
      if (error) throw error;
      setProfile({ ...profile, ...updates });
      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert>
          <AlertDescription>Profile not found. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border shadow-sm">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto bg-primary rounded-full flex items-center justify-center mb-4">
              <User className="h-10 w-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Your Profile</CardTitle>
            <CardDescription>
              Manage your research profile and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-6" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={profile.email || ''}
                      className="pl-10"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="fullName"
                      defaultValue={profile.full_name || ''}
                      placeholder="Enter your full name"
                      className="pl-10"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="organization"
                    defaultValue={profile.organization || ''}
                    placeholder="University, Company, or Institution"
                    className="pl-10"
                    disabled={isSaving}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Research Focus</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    name="researchFocus"
                    defaultValue={profile.research_focus || ''}
                    placeholder="Describe your research interests and focus areas..."
                    className="pl-10 min-h-[100px]"
                    disabled={isSaving}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </form>
            <div className="mt-6 pt-6 border-t border-border">
              <div className="text-center text-sm text-muted-foreground">
                <p>Profile ID: {profile.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}