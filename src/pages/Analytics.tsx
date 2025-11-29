import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, Users, Activity, Target, Beaker, 
  Calendar, CheckCircle, XCircle, Clock, Crown
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  status: 'pending' | 'approved' | 'rejected';
  role: 'admin' | 'user';
  created_at: string;
}
interface UserAnalytics {
  user_id: string;
  login_count: number;
  reports_generated: number;
  compounds_analyzed: number;
  targets_discovered: number;
  last_login_at: string;
  created_at: string;
}
interface ReportsData {
  id: string;
  user_id: string;
  disease_name: string;
  targets_count: number;
  compounds_count: number;
  created_at: string;
}
const COLORS = ['hsl(144 61% 32%)', 'hsl(152 72% 46%)', 'hsl(160 84% 39%)', 'hsl(142 76% 36%)', 'hsl(38 92% 50%)', 'hsl(199 89% 48%)'];
export default function Analytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics[]>([]);
  const [reportsData, setReportsData] = useState<ReportsData[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (profileError) throw profileError;
      setCurrentUserProfile(profile);
      setIsAdmin(profile.role === 'admin');
      if (profile.role === 'admin') {
        const [usersRes, analyticsRes, reportsRes] = await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
          supabase.from('user_analytics').select('*'),
          supabase.from('reports').select('*')
        ]);
        if (usersRes.error) throw usersRes.error;
        if (analyticsRes.error) throw analyticsRes.error;
        if (reportsRes.error) throw reportsRes.error;
        setUserProfiles(usersRes.data || []);
        setUserAnalytics(analyticsRes.data || []);
        setReportsData(reportsRes.data || []);
      } else {
        const [analyticsRes, reportsRes] = await Promise.all([
          supabase.from('user_analytics').select('*').eq('user_id', user?.id),
          supabase.from('reports').select('*').eq('user_id', user?.id)
        ]);
        if (analyticsRes.error) throw analyticsRes.error;
        if (reportsRes.error) throw reportsRes.error;
        setUserAnalytics(analyticsRes.data || []);
        setReportsData(reportsRes.data || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const updateUserStatus = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('user_id', userId);
      if (error) throw error;
      toast({
        title: "Success",
        description: `User ${status} successfully`,
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  const getUserActivityData = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
    return last30Days.map(date => {
      const reportsOnDate = reportsData.filter(report => 
        report.created_at.startsWith(date)
      );
      const usersOnDate = new Set(reportsData.filter(report => 
        report.created_at.startsWith(date)
      ).map(r => r.user_id)).size;
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: usersOnDate,
        reports: reportsOnDate.length,
        compounds: reportsOnDate.reduce((sum, r) => sum + r.compounds_count, 0),
        targets: reportsOnDate.reduce((sum, r) => sum + r.targets_count, 0)
      };
    });
  };
  const getDiseaseDistributionData = () => {
    const diseaseCount = reportsData.reduce((acc, report) => {
      acc[report.disease_name] = (acc[report.disease_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(diseaseCount).map(([name, value]) => ({
      name,
      value
    }));
  };
  const getCompoundsTargetsData = () => {
    const diseaseStats = reportsData.reduce((acc, report) => {
      if (!acc[report.disease_name]) {
        acc[report.disease_name] = { targets: 0, compounds: 0, reports: 0 };
      }
      acc[report.disease_name].targets += report.targets_count;
      acc[report.disease_name].compounds += report.compounds_count;
      acc[report.disease_name].reports += 1;
      return acc;
    }, {} as Record<string, { targets: number; compounds: number; reports: number }>);
    return Object.entries(diseaseStats)
      .sort(([,a], [,b]) => (b.targets + b.compounds) - (a.targets + a.compounds))
      .slice(0, 10)
      .map(([name, stats]) => ({
        disease: name.length > 15 ? name.slice(0, 15) + '...' : name,
        targets: stats.targets,
        compounds: stats.compounds,
        reports: stats.reports,
        efficiency: stats.reports > 0 ? Math.round((stats.targets + stats.compounds) / stats.reports) : 0
      }));
  };
  const getUserPerformanceData = () => {
    if (!isAdmin) return [];
    const userStats = userAnalytics.map(analytics => {
      const profile = userProfiles.find(p => p.user_id === analytics.user_id);
      return {
        name: profile?.full_name?.split(' ')[0] || 'Unknown',
        reports: analytics.reports_generated,
        compounds: analytics.compounds_analyzed,
        targets: analytics.targets_discovered,
        logins: analytics.login_count,
        score: analytics.reports_generated * 10 + analytics.compounds_analyzed * 2 + analytics.targets_discovered * 5
      };
    }).sort((a, b) => b.score - a.score).slice(0, 8);
    return userStats;
  };
  const getMonthlyTrendData = () => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: date.toISOString().slice(0, 7),
        name: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      };
    }).reverse();
    return last6Months.map(({ month, name }) => {
      const monthReports = reportsData.filter(report => 
        report.created_at.startsWith(month)
      );
      const uniqueUsers = new Set(monthReports.map(r => r.user_id)).size;
      return {
        month: name,
        reports: monthReports.length,
        users: uniqueUsers,
        compounds: monthReports.reduce((sum, r) => sum + r.compounds_count, 0),
        targets: monthReports.reduce((sum, r) => sum + r.targets_count, 0)
      };
    });
  };
  const getUserPersonalTrendData = () => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: date.toISOString().slice(0, 7),
        name: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      };
    }).reverse();
    return last6Months.map(({ month, name }) => {
      const monthReports = reportsData.filter(report => 
        report.user_id === user?.id && report.created_at.startsWith(month)
      );
      return {
        month: name,
        reports: monthReports.length
      };
    });
  };
  const getUserCompoundAssociationData = () => {
    const userReports = reportsData.filter(r => r.user_id === user?.id);
    const diseaseStats = userReports.reduce((acc, report) => {
      if (!acc[report.disease_name]) {
        acc[report.disease_name] = { targets: 0, compounds: 0 };
      }
      acc[report.disease_name].targets += report.targets_count;
      acc[report.disease_name].compounds += report.compounds_count;
      return acc;
    }, {} as Record<string, { targets: number; compounds: number }>);
    return Object.entries(diseaseStats).map(([name, stats]) => ({
      disease: name.length > 12 ? name.slice(0, 12) + '...' : name,
      score: stats.compounds > 0 ? Math.round((stats.targets / stats.compounds) * 100) : 0
    }));
  };
  const getUserEfficiencyData = () => {
    return reportsData
      .filter(r => r.user_id === user?.id)
      .map(report => ({
        date: new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        efficiency: report.compounds_count > 0 ? Math.round((report.targets_count / report.compounds_count) * 100) / 100 : 0
      }));
  };
  const getUserFocusDistribution = () => {
    const userReports = reportsData.filter(r => r.user_id === user?.id);
    const diseaseCount = userReports.reduce((acc, report) => {
      acc[report.disease_name] = (acc[report.disease_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(diseaseCount).map(([name, value]) => ({
      name: name.length > 15 ? name.slice(0, 15) + '...' : name,
      value
    }));
  };
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground">
              {isAdmin ? 'System-wide analytics and user management' : 'Your personal analytics'}
            </p>
          </div>
          {isAdmin && (
            <Badge variant="secondary" className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
              <Crown className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          )}
        </div>
        <Tabs defaultValue={isAdmin ? "overview" : "personal"} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto bg-card border shadow-sm">
            {isAdmin && (
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Overview
              </TabsTrigger>
            )}
            <TabsTrigger value="personal" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Personal
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Users
              </TabsTrigger>
            )}
          </TabsList>
          {isAdmin && (
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{userProfiles.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {userProfiles.filter(u => u.status === 'approved').length} approved
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                    <Activity className="h-4 w-4 text-secondary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-secondary">{reportsData.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Generated this month
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Compounds Analyzed</CardTitle>
                    <Beaker className="h-4 w-4 text-accent" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-accent">
                      {reportsData.reduce((sum, r) => sum + r.compounds_count, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total analyzed
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Targets Discovered</CardTitle>
                    <Target className="h-4 w-4 text-success" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">
                      {reportsData.reduce((sum, r) => sum + r.targets_count, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total discovered
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      30-Day Activity Trend
                    </CardTitle>
                    <CardDescription>Daily activity metrics over the last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={getUserActivityData()}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="reports" 
                          stroke="hsl(144 61% 32%)" 
                          strokeWidth={3}
                          dot={{ fill: 'hsl(144 61% 32%)', strokeWidth: 2, r: 4 }}
                          name="Reports"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="compounds" 
                          stroke="hsl(152 72% 46%)" 
                          strokeWidth={3}
                          dot={{ fill: 'hsl(152 72% 46%)', strokeWidth: 2, r: 4 }}
                          name="Compounds"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="targets" 
                          stroke="hsl(160 84% 39%)" 
                          strokeWidth={3}
                          dot={{ fill: 'hsl(160 84% 39%)', strokeWidth: 2, r: 4 }}
                          name="Targets"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-secondary" />
                      Disease Research Distribution
                    </CardTitle>
                    <CardDescription>Most researched diseases by frequency</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={getDiseaseDistributionData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getDiseaseDistributionData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-accent" />
                      6-Month Trend Analysis
                    </CardTitle>
                    <CardDescription>Research activity trends over 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={getMonthlyTrendData()}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="reports" 
                          stackId="1" 
                          stroke="hsl(221 83% 53%)" 
                          fill="hsl(221 83% 53% / 0.6)" 
                          name="Reports"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="users" 
                          stackId="2" 
                          stroke="hsl(185 65% 50%)" 
                          fill="hsl(185 65% 50% / 0.6)" 
                          name="Active Users"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                {isAdmin && (
                  <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-success" />
                        User Performance Ranking
                      </CardTitle>
                      <CardDescription>Top performing users by research activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={getUserPerformanceData()} layout="horizontal">
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={80} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="score" fill="hsl(142 76% 36%)" name="Performance Score" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
              <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Beaker className="h-5 w-5 text-accent" />
                    Disease Research Comparison
                  </CardTitle>
                  <CardDescription>Comprehensive analysis of targets, compounds, and research efficiency</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={450}>
                    <BarChart data={getCompoundsTargetsData()}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="disease" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="targets" fill="hsl(221 83% 53%)" name="Targets Discovered" />
                      <Bar dataKey="compounds" fill="hsl(260 60% 55%)" name="Compounds Analyzed" />
                      <Bar dataKey="reports" fill="hsl(185 65% 50%)" name="Research Reports" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-warning" />
                    Research Efficiency Analysis
                  </CardTitle>
                  <CardDescription>Compounds per target ratio - higher values indicate better efficiency</CardDescription>
                </CardHeader>
                <CardContent>
                   <ResponsiveContainer width="100%" height={400}>
                     <LineChart data={getUserEfficiencyData()}>
                       <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                       <XAxis 
                         dataKey="date" 
                         angle={-45}
                         textAnchor="end"
                         height={80}
                         tick={{ fontSize: 11 }}
                       />
                       <YAxis label={{ value: 'Efficiency Ratio', angle: -90, position: 'insideLeft' }} />
                       <Tooltip 
                         contentStyle={{ 
                           backgroundColor: 'hsl(var(--card))', 
                           border: '1px solid hsl(var(--border))',
                           borderRadius: '8px'
                         }} 
                         formatter={(value, name) => [
                           typeof value === 'number' ? value.toFixed(2) : value,
                           name === 'efficiency' ? 'Efficiency Ratio' : name
                         ]}
                       />
                       <Line 
                         type="monotone" 
                         dataKey="efficiency" 
                         stroke="hsl(160 84% 39%)" 
                         strokeWidth={3}
                         dot={{ fill: 'hsl(160 84% 39%)', strokeWidth: 2, r: 5 }}
                         name="Efficiency"
                       />
                     </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          <TabsContent value="personal" className="space-y-4">
            {}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Reports</CardTitle>
                  <Activity className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {userAnalytics.find(a => a.user_id === user?.id)?.reports_generated || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Generated reports
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Compounds</CardTitle>
                  <Beaker className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">
                    {userAnalytics.find(a => a.user_id === user?.id)?.compounds_analyzed || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Analyzed compounds
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Targets</CardTitle>
                  <Target className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">
                    {userAnalytics.find(a => a.user_id === user?.id)?.targets_discovered || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Discovered targets
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Login Count</CardTitle>
                  <Calendar className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    {userAnalytics.find(a => a.user_id === user?.id)?.login_count || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total logins
                  </p>
                </CardContent>
              </Card>
            </div>
            {}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Beaker className="h-5 w-5 text-primary" />
                    Your Research History
                  </CardTitle>
                  <CardDescription>Your reports over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={getUserPersonalTrendData()}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="reports" 
                        stroke="hsl(144 61% 32%)" 
                        fill="hsl(144 61% 32% / 0.2)" 
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-secondary" />
                    Compound Association Scores
                  </CardTitle>
                  <CardDescription>Success rate of your compound analyses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getUserCompoundAssociationData()}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="disease" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar 
                        dataKey="score" 
                        fill="hsl(152 72% 46%)" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    Research Efficiency
                  </CardTitle>
                  <CardDescription>Targets per compound ratio over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getUserEfficiencyData()}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="efficiency" 
                        stroke="hsl(160 84% 39%)" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(160 84% 39%)', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-success" />
                    Research Focus Distribution
                  </CardTitle>
                  <CardDescription>Your focus areas by frequency</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getUserFocusDistribution()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="hsl(144 61% 32%)"
                        dataKey="value"
                      >
                        {getUserFocusDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {isAdmin && (
            <TabsContent value="users" className="space-y-4">
              <Card className="border-0 bg-gradient-to-br from-card to-muted/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    User Management
                  </CardTitle>
                  <CardDescription>Approve or reject user access</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userProfiles.map((profile) => (
                      <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="font-semibold">{profile.full_name}</h4>
                            <p className="text-sm text-muted-foreground">{profile.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined: {new Date(profile.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={
                                profile.status === 'approved' ? 'default' : 
                                profile.status === 'rejected' ? 'destructive' : 'secondary'
                              }
                              className={
                                profile.status === 'approved' ? 'bg-success' : 
                                profile.status === 'rejected' ? 'bg-destructive' : 'bg-warning'
                              }
                            >
                              {profile.status}
                            </Badge>
                            {profile.role === 'admin' && (
                              <Badge variant="secondary" className="bg-primary text-primary-foreground">
                                <Crown className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                        </div>
                        {profile.status === 'pending' && (
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={() => updateUserStatus(profile.user_id, 'approved')}
                              className="bg-success hover:bg-success/80"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => updateUserStatus(profile.user_id, 'rejected')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}