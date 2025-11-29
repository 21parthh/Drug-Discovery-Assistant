import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Target, 
  Pill, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Beaker,
  Database
} from 'lucide-react';
import type { DrugDiscoveryResult, TargetResult, HitCompound } from '@/lib/drugDiscovery';
interface DrugDiscoveryResultsProps {
  result: DrugDiscoveryResult;
}
const ScoreBar: React.FC<{ score: number; label: string }> = ({ score, label }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{score.toFixed(3)}</span>
    </div>
    <Progress value={score * 100} className="h-2" />
  </div>
);
const CompoundCard: React.FC<{ compound: HitCompound; index: number }> = ({ compound, index }) => (
  <Card className="border border-border/50 hover:border-primary/20 transition-all duration-200 hover:shadow-md">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center">
          <Pill className="h-4 w-4 mr-2 text-accent" />
          Compound {index + 1}
        </CardTitle>
        <Badge variant="outline" className="text-xs">
          {compound.molecule_chembl_id || 'Unknown ID'}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {compound.smiles && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">SMILES Structure</p>
          <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">
            {compound.smiles}
          </code>
        </div>
      )}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Bioactivity</p>
        <div className="text-sm">
          <span className="font-medium">{compound.bioactivity.type || 'Unknown'}</span>
          {compound.bioactivity.value && (
            <span className="ml-2 text-muted-foreground">
              {compound.bioactivity.value} {compound.bioactivity.units || ''}
            </span>
          )}
        </div>
      </div>
      {compound.analysis && !compound.analysis.error && (
        <div className="space-y-3 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">Molecular Properties</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>MW: {compound.analysis.MolWt}</div>
            <div>LogP: {compound.analysis.LogP}</div>
            <div>TPSA: {compound.analysis.TPSA}</div>
            <div>HBD/HBA: {compound.analysis.HBD}/{compound.analysis.HBA}</div>
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            <Badge 
              variant={compound.analysis.Lipinski_violations <= 1 ? "default" : "destructive"}
              className="text-xs"
            >
              Lipinski: {compound.analysis.Lipinski_violations} violations
            </Badge>
            {compound.analysis.Lead_like && (
              <Badge variant="outline" className="text-xs">
                Lead-like
              </Badge>
            )}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);
const TargetCard: React.FC<{ target: TargetResult; index: number }> = ({ target, index }) => (
  <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">{target.symbol}</CardTitle>
            <CardDescription className="text-sm">
              Target Protein #{index + 1}
            </CardDescription>
          </div>
        </div>
        {target.score && (
          <Badge className="bg-primary/10 text-primary border-primary/20">
            Score: {target.score.toFixed(3)}
          </Badge>
        )}
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium text-muted-foreground">Ensembl ID</p>
          <p className="font-mono">{target.ensembl}</p>
        </div>
        <div>
          <p className="font-medium text-muted-foreground">ChEMBL ID</p>
          <p className="font-mono">{target.chembl_target_id || 'Not found'}</p>
        </div>
      </div>
      {target.score && (
        <ScoreBar score={target.score} label="Association Score" />
      )}
      <Separator />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold flex items-center">
            <Beaker className="h-4 w-4 mr-2 text-secondary" />
            Hit Compounds
          </h4>
          <Badge variant="secondary">
            {target.hits.length} compounds
          </Badge>
        </div>
        {target.chembl_error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>ChEMBL Error</AlertTitle>
            <AlertDescription className="text-sm">
              {target.chembl_error}
            </AlertDescription>
          </Alert>
        )}
        {target.hits.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {target.hits.slice(0, 6).map((compound, idx) => (
              <CompoundCard key={idx} compound={compound} index={idx} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hit compounds found for this target</p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);
export const DrugDiscoveryResults: React.FC<DrugDiscoveryResultsProps> = ({ result }) => {
  if (result.error) {
    return (
      <Alert className="max-w-2xl mx-auto">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Discovery Failed</AlertTitle>
        <AlertDescription>{result.error}</AlertDescription>
      </Alert>
    );
  }
  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 mr-3 text-accent" />
            Discovery Complete
          </CardTitle>
          <CardDescription className="text-lg">
            <strong>{result.disease_name}</strong> • {result.targets.length} targets identified
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-8 text-sm">
            <div className="text-center">
              <p className="font-bold text-xl text-primary">{result.targets.length}</p>
              <p className="text-muted-foreground">Target Proteins</p>
            </div>
            <Separator orientation="vertical" className="h-12" />
            <div className="text-center">
              <p className="font-bold text-xl text-secondary">
                {result.targets.reduce((sum, target) => sum + target.hits.length, 0)}
              </p>
              <p className="text-muted-foreground">Hit Compounds</p>
            </div>
            <Separator orientation="vertical" className="h-12" />
            <div className="text-center">
              <p className="font-bold text-xl text-accent">
                {result.targets.filter(t => t.chembl_target_id).length}
              </p>
              <p className="text-muted-foreground">ChEMBL Matches</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {}
      <div className="space-y-8">
        {result.targets.map((target, index) => (
          <TargetCard key={target.ensembl} target={target} index={index} />
        ))}
      </div>
    </div>
  );
};