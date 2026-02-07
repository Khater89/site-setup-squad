import { Video, Info } from "lucide-react";

const MeetingInfo = () => {
  return (
    <div className="bg-card rounded-lg border border-border p-4 card-glow animate-slide-up" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-full bg-info/15 flex items-center justify-center">
          <Video className="h-4 w-4 text-info" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
          MS Teams Meeting
        </h3>
      </div>
      <div className="bg-secondary rounded-md p-3 border border-border">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-secondary-foreground leading-relaxed">
            Meeting invite sent to assigned Field Engineer via email from{" "}
            <span className="font-mono text-primary">@hercrentals.com</span> domain.
            <br />
            <span className="font-semibold text-foreground mt-1 block">
              JOIN THIS MEETING AT APPOINTMENT TIME.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MeetingInfo;
