import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Pill, 
  BarChart3, 
  ArrowRight,
  Beaker,
  Database,
  Brain,
  Microscope,
  FileText,
  Users
} from 'lucide-react';
interface LandingSectionProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  isAuthenticated: boolean;
}
export const LandingSection: React.FC<LandingSectionProps> = ({ 
  onGetStarted, 
  onSignIn, 
  isAuthenticated 
}) => {
  const features = [
    {
      icon: Target,
      title: "Target Identification",
      description: "AI-powered identification of therapeutic protein targets using Open Targets Platform",
      color: "text-blue-400"
    },
    {
      icon: Pill,
      title: "Hit Discovery",
      description: "Comprehensive compound screening from ChEMBL database with bioactivity analysis",
      color: "text-green-400"
    },
    {
      icon: BarChart3,
      title: "Compound Analysis",
      description: "Molecular property calculation, drug-likeness assessment, and ADMET prediction",
      color: "text-purple-400"
    }
  ];
  const stats = [
    { label: "Protein Targets", value: "100K+", icon: Target },
    { label: "Compounds", value: "2M+", icon: Pill },
    { label: "Disease Areas", value: "500+", icon: Brain },
    { label: "Research Publications", value: "10K+", icon: FileText }
  ];
  return (
    <div className="space-y-16">
      {}
      <section className="text-center space-y-8">
        <div className="space-y-4">
          <Badge variant="outline" className="px-4 py-2 text-sm font-medium border-primary/20 bg-primary/5">
            <Beaker className="h-4 w-4 mr-2" />
            AI-Powered Drug Discovery Platform
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Accelerate
            </span>
            <br />
            <span className="text-foreground">Drug Discovery</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Identify therapeutic targets, discover hit compounds, and analyze molecular properties 
            with our comprehensive AI-driven platform for pharmaceutical research
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            onClick={onGetStarted}
            size="lg"
            className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Start Discovery
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          {!isAuthenticated && (
            <Button 
              onClick={onSignIn}
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg font-semibold"
            >
              <Users className="mr-2 h-5 w-5" />
              Sign In
            </Button>
          )}
        </div>
      </section>
      {}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="text-center border-0 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </section>
      {}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Complete Drug Discovery Pipeline
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From target identification to compound optimization, our platform provides 
            end-to-end solutions for modern pharmaceutical research
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group border-0 bg-gradient-to-br from-card to-muted/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      {}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our streamlined process leverages cutting-edge databases and AI algorithms 
            to accelerate your drug discovery research
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center">
              <Database className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold">1. Disease Query</h3>
            <p className="text-muted-foreground">
              Input your disease or condition of interest to search our comprehensive databases
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center">
              <Target className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold">2. Target Analysis</h3>
            <p className="text-muted-foreground">
              AI identifies and ranks potential therapeutic targets based on disease associations
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center">
              <Microscope className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold">3. Compound Discovery</h3>
            <p className="text-muted-foreground">
              Discover bioactive compounds and analyze their drug-like properties automatically
            </p>
          </div>
        </div>
      </section>
      {}
      <section className="text-center space-y-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          Ready to Transform Your Research?
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Join researchers worldwide who are accelerating drug discovery with our AI-powered platform
        </p>
        <Button 
          onClick={onGetStarted}
          size="lg"
          className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Start Your Discovery Journey
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </section>
    </div>
  );
};