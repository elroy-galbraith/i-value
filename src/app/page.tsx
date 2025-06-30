import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, FileText, Map, MapPin, Upload, Sparkles, Download, ArrowRight } from "lucide-react";
import { Logo } from "@/components/icons";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">
        <div className="flex items-center gap-2">
          <Logo className="size-8 text-primary" />
          <span className="text-xl font-bold">i-Valu Lite</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/dashboard">
            <Button>Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 md:py-32">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">
            Smarter, Faster Property Valuations
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
            Leverage AI to evaluate properties, analyze market data, and generate IVS-compliant reports in minutes, not days.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg">
                Start Your First Valuation <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Feature Image */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 my-16">
            <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl border shadow-lg">
                <Image
                src="https://placehold.co/1200x600.png"
                alt="i-Valu Lite Dashboard Screenshot"
                fill
                className="object-cover"
                data-ai-hint="modern architecture"
                />
            </div>
        </section>


        {/* Features Section */}
        <section className="bg-muted py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">A New Standard in Valuation</h2>
              <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
                Our platform combines cutting-edge AI with industry standards to deliver unparalleled accuracy and efficiency.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <BrainCircuit className="h-8 w-8 text-primary" />
                  <CardTitle>AI-Powered Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Automatically assess property aesthetics and condition from images, providing objective scores to inform your valuation.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <FileText className="h-8 w-8 text-primary" />
                  <CardTitle>IVS-Compliant Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Generate comprehensive, professional reports that adhere to International Valuation Standards with a single click.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <Map className="h-8 w-8 text-primary" />
                  <CardTitle>Market Data Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Seamlessly pull in comparable property data and market trends to ensure your valuation is grounded in real-world evidence.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Get Your Valuation in 4 Simple Steps</h2>
                    <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
                        Our intuitive workflow guides you from property selection to final report.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 mb-4">
                            <MapPin className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">1. Select Property</h3>
                        <p className="text-muted-foreground">Use the interactive map to pinpoint the exact location of your subject property.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 mb-4">
                            <Upload className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">2. Upload Images</h3>
                        <p className="text-muted-foreground">Provide property photos for our AI to analyze and score based on aesthetics and condition.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 mb-4">
                            <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">3. Review AI Insights</h3>
                        <p className="text-muted-foreground">Get an estimated value range and find comparable properties based on all collected data.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 mb-4">
                            <Download className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">4. Generate Report</h3>
                        <p className="text-muted-foreground">Download a complete, IVS-compliant PDF report with all data, images, and maps included.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Final CTA */}
        <section className="bg-muted">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Revolutionize Your Workflow?</h2>
                <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                    Join the future of property valuation. Get started for free and experience the power of AI.
                </p>
                <Link href="/dashboard">
                    <Button size="lg">
                    Get Started Now <ArrowRight className="ml-2" />
                    </Button>
                </Link>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} i-Valu Lite. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
