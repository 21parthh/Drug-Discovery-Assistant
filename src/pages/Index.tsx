import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/DashboardLayout';
import { DrugDiscoveryForm } from '@/components/DrugDiscoveryForm';
import { DrugDiscoveryResults } from '@/components/DrugDiscoveryResults';
import { ReportGenerator } from '@/components/ReportGenerator';
import { ReportHistory } from '@/components/ReportHistory';
import { LandingSection } from '@/components/LandingSection';
import { Beaker, Target, Pill, BarChart3 } from 'lucide-react';
import { runDrugDiscoveryPipeline, type DrugDiscoveryResult } from '@/lib/drugDiscovery';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DrugDiscoveryResult | null>(null);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const handleSearch = async (diseaseName: string, options: { targetsToFetch: number; hitsPerTarget: number }) => {
    setIsLoading(true);
    setResults(null);
    toast({
      title: "Drug Discovery Started",
      description: `Analyzing targets for ${diseaseName}...`,
    });
    try {
      const result = await runDrugDiscoveryPipeline(
        diseaseName,
        options.targetsToFetch,
        options.hitsPerTarget
      );
      setResults(result);
      if (result.error) {
        toast({
          title: "Discovery Failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Discovery Complete!",
          description: `Found ${result.targets.length} targets with ${result.targets.reduce((sum, target) => sum + target.hits.length, 0)} compounds`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        title: "Discovery Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setResults({ error: errorMessage, targets: [] });
    } finally {
      setIsLoading(false);
    }
  };
  const handleGetStarted = () => {
    if (user) {
      setShowDiscovery(true);
    } else {
      navigate('/auth');
    }
  };
  if (!showDiscovery && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        {}
        <header className="border-b border-border/40 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
                  <Beaker className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Drug Discovery Platform</h1>
                  <p className="text-sm text-muted-foreground">AI-Powered Pharmaceutical Research</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center space-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span>Target Identification</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Pill className="h-4 w-4 text-secondary" />
                    <span>Hit Discovery</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-accent" />
                    <span>Compound Analysis</span>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/auth')}
                  variant="outline"
                  size="sm"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </header>
        {}
        <main className="container mx-auto px-4 py-16">
          <LandingSection 
            onGetStarted={handleGetStarted}
            onSignIn={() => navigate('/auth')}
            isAuthenticated={!!user}
          />
        </main>
      </div>
    );
  }
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Tabs defaultValue="discovery" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto bg-card border shadow-sm">
            <TabsTrigger value="discovery" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Drug Discovery
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Report History
            </TabsTrigger>
          </TabsList>
          <TabsContent value="discovery" className="space-y-6 mt-6">
            <DrugDiscoveryForm onSearch={handleSearch} isLoading={isLoading} />
            {results && !results.error && (
              <div className="space-y-6">
                <DrugDiscoveryResults result={results} />
                <ReportGenerator result={results} />
              </div>
            )}
            {results?.error && <DrugDiscoveryResults result={results} />}
          </TabsContent>
          <TabsContent value="history" className="mt-6">
            <ReportHistory />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};
export default Index;