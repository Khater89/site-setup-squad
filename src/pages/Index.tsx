import SafetyBanner from "@/components/SafetyBanner";
import ContactCard from "@/components/ContactCard";
import MeetingInfo from "@/components/MeetingInfo";
import DocumentLinks from "@/components/DocumentLinks";
import { Wrench, Radio } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-2xl py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Wrench className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                Herc Rentals
              </h1>
              <div className="flex items-center gap-1.5">
                <Radio className="h-3 w-3 text-success animate-pulse-glow" />
                <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                  Field Dispatch
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-2xl py-6 space-y-6">
        {/* Safety Banner */}
        <SafetyBanner />

        {/* Contacts Grid */}
        <section>
          <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 px-1">
            Contacts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ContactCard
              title="Site Contact / Herc PM"
              name="Haleigh Wiley"
              email="Haleigh.Wiley@HercRentals.com"
              phone="(404) 805-5938"
              delay="100"
            />
            <ContactCard
              title="Acuative PM"
              name="Molly Dunston"
              phone="440-580-3715"
              delay="150"
            />
          </div>
        </section>

        {/* Meeting Info */}
        <MeetingInfo />

        {/* Document Links */}
        <DocumentLinks />

        {/* Footer */}
        <footer className="pt-4 pb-8 border-t border-border">
          <p className="text-[10px] font-mono text-muted-foreground text-center uppercase tracking-widest">
            Herc Rentals — Field Operations
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
