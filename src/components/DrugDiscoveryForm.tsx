import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Beaker, Loader2 } from 'lucide-react';
interface DrugDiscoveryFormProps {
  onSearch: (diseaseName: string, options: { targetsToFetch: number; hitsPerTarget: number }) => void;
  isLoading: boolean;
}
export const DrugDiscoveryForm: React.FC<DrugDiscoveryFormProps> = ({ onSearch, isLoading }) => {
  const [diseaseName, setDiseaseName] = useState('');
  const [targetsToFetch, setTargetsToFetch] = useState(5);
  const [hitsPerTarget, setHitsPerTarget] = useState(10);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (diseaseName.trim()) {
      onSearch(diseaseName.trim(), { targetsToFetch, hitsPerTarget });
    }
  };
  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-0 bg-gradient-to-br from-card to-muted/20">
      <CardHeader className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
            <Beaker className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Drug Discovery Platform
          </CardTitle>
        </div>
        <CardDescription className="text-lg text-muted-foreground max-w-md mx-auto">
          Discover therapeutic targets and analyze hit compounds for disease research
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Disease or Condition
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="e.g., cancer, diabetes, alzheimer's disease"
                value={diseaseName}
                onChange={(e) => setDiseaseName(e.target.value)}
                className="pl-10 h-12 text-base"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Target Proteins
              </label>
              <Input
                type="number"
                min="1"
                max="10"
                value={targetsToFetch}
                onChange={(e) => setTargetsToFetch(parseInt(e.target.value) || 5)}
                className="h-10"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Compounds per Target
              </label>
              <Input
                type="number"
                min="1"
                max="20"
                value={hitsPerTarget}
                onChange={(e) => setHitsPerTarget(parseInt(e.target.value) || 10)}
                className="h-10"
                disabled={isLoading}
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={!diseaseName.trim() || isLoading}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Discovering Targets...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Start Discovery
              </>
            )}
          </Button>
        </form>
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>Powered by Open Targets Platform and ChEMBL Database</p>
          <p>Results are for research purposes only</p>
        </div>
      </CardContent>
    </Card>
  );
};