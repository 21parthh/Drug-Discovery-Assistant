import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, Download, Share, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { DrugDiscoveryResult } from '@/lib/drugDiscovery';
interface ReportGeneratorProps {
  result: DrugDiscoveryResult;
}
export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ result }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string>('');
  const [error, setError] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const generateReport = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { discoveryResult: result }
      });
      if (error) throw error;
      if (data.report) {
        setReport(data.report);
        if (user) {
          const compoundsCount = result.targets.reduce((sum, target) => sum + target.hits.length, 0);
          const targetsCount = result.targets.length;
          const { error: saveError } = await supabase
            .from('reports')
            .insert({
              user_id: user.id,
              disease_name: result.disease_name,
              report_content: data.report,
              targets_count: targetsCount,
              compounds_count: compoundsCount
            });
          if (saveError) {
            console.error('Error saving report:', saveError);
            toast({
              title: "Report generated but failed to save to history",
              description: saveError.message,
              variant: "destructive",
            });
          } else {
            try {
              const { error: analyticsError } = await supabase.rpc('update_user_analytics', {
                _user_id: user.id,
                _reports_increment: 1,
                _compounds_increment: compoundsCount,
                _targets_increment: targetsCount
              });
              if (analyticsError) {
                console.error('Error updating analytics:', analyticsError);
              }
            } catch (error) {
              console.error('Error calling analytics function:', error);
            }
            toast({
              title: "Report generated and saved to history!",
              description: "Your comprehensive research report is ready.",
            });
          }
        } else {
          toast({
            title: "Report generated successfully!",
            description: "Your comprehensive research report is ready.",
          });
        }
      } else {
        throw new Error('No report generated');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to generate report');
      toast({
        title: "Report generation failed",
        description: error.message || 'Please try again later.',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drug-discovery-report-${result.disease_name?.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Report downloaded",
      description: "The report has been saved to your downloads folder.",
    });
  };
  const copyToClipboard = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report);
      toast({
        title: "Copied to clipboard",
        description: "The report has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard. Please try downloading instead.",
        variant: "destructive",
      });
    }
  };
  return (
    <Card className="w-full max-w-4xl mx-auto border-0 shadow-xl bg-gradient-to-br from-card to-muted/20">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
            <FileText className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Research Report</CardTitle>
        </div>
        <CardDescription className="text-lg">
          Generate a comprehensive analysis report for <strong>{result.disease_name}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!report && (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Generate a detailed research report with AI-powered analysis of your discovery results.
              The report will include target identification analysis, hit discovery results, 
              compound analysis, and recommendations for next steps.
            </p>
            <Button
              onClick={generateReport}
              disabled={isGenerating}
              size="lg"
              className="px-8 py-3 bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  Generate Research Report
                </>
              )}
            </Button>
          </div>
        )}
        {report && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
              <Button onClick={downloadReport} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
              <Button onClick={copyToClipboard} variant="outline">
                <Share className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </Button>
              <Button onClick={() => setReport('')} variant="outline">
                Generate New Report
              </Button>
            </div>
            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Generated Report Preview</CardTitle>
                <CardDescription>
                  Comprehensive analysis for {result.disease_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
                    {report}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};