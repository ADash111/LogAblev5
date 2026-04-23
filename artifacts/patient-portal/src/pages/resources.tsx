import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, ExternalLink, Activity } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type Reference = {
  title: string;
  authors: string;
  citation: string;
  url: string;
  source: string;
};

const REFERENCES: Reference[] = [
  {
    authors: "Alder, Steve.",
    title: "Effects of Poor Communication in Healthcare.",
    citation:
      'Alder, Steve. "Effects of Poor Communication in Healthcare." The HIPAA Journal, 2 Apr. 2025.',
    url: "https://www.hipaajournal.com/effects-of-poor-communication-in-healthcare/",
    source: "The HIPAA Journal",
  },
  {
    authors: "Griffin, Ashley C., and Arlene E. Chung.",
    title:
      "Health Tracking and Information Sharing in the Patient-Centered Era: A Health Information National Trends Survey (HINTS) Study.",
    citation:
      'Griffin, Ashley C., and Arlene E. Chung. "Health Tracking and Information Sharing in the Patient-Centered Era: A Health Information National Trends Survey (HINTS) Study." AMIA Annual Symposium Proceedings, vol. 2019, Mar. 2020, p. 1041.',
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7153080/",
    source: "AMIA Annual Symposium Proceedings",
  },
  {
    authors: "Howick, Jeremy, et al.",
    title:
      "How Does Communication Affect Patient Safety? Protocol for a Systematic Review and Logic Model.",
    citation:
      'Howick, Jeremy, et al. "How Does Communication Affect Patient Safety? Protocol for a Systematic Review and Logic Model." BMJ Open, vol. 14, no. 5, BMJ, May 2024, pp. 1–8.',
    url: "https://doi.org/10.1136/bmjopen-2024-085312",
    source: "BMJ Open",
  },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="border-b border-border/40 bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">Why LogAble Exists</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 flex-1 max-w-3xl">
        {/* Intro */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <BookOpen className="h-4 w-4" /> Further Reading
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            The cost of poor doctor–patient communication
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Miscommunication between clinicians and patients drives medication errors, missed diagnoses,
            and worse outcomes. LogAble was built to close that gap with shared records, vital
            tracking, and direct messaging. The peer-reviewed research and reporting below explore the
            problem in depth.
          </p>
        </div>

        {/* References */}
        <div className="space-y-4">
          {REFERENCES.map((ref, i) => (
            <Card key={i} className="hover-elevate overflow-hidden border border-border/60">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="hidden sm:flex h-10 w-10 rounded-lg bg-primary/10 text-primary items-center justify-center flex-shrink-0 font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">
                      {ref.source}
                    </p>
                    <h3 className="font-semibold text-lg leading-snug mb-2">{ref.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{ref.authors}</p>
                    <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-md border border-border/40 mb-4 leading-relaxed">
                      {ref.citation}
                    </p>
                    <a href={ref.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="rounded-full">
                        Read article <ExternalLink className="h-3 w-3 ml-2" />
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-10">
          External links open in a new tab. LogAble is not affiliated with the publishers above.
        </p>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/40 bg-background">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-primary">
            <Activity className="h-4 w-4" />
            <span className="font-semibold">LogAble</span>
          </div>
          <Link href="/" className="hover:text-foreground">
            Back to home
          </Link>
        </div>
      </footer>
    </div>
  );
}
