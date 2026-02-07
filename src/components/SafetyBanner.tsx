import { ShieldAlert, HardHat, Eye, Footprints } from "lucide-react";

const safetyItems = [
  { icon: Footprints, label: "Steel Toe Shoes/Boots" },
  { icon: HardHat, label: "Hi-Vis Vest" },
  { icon: Eye, label: "Safety Eyewear" },
];

const SafetyBanner = () => {
  return (
    <div className="safety-banner rounded-lg p-4 animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="h-6 w-6 text-safety-yellow-foreground" />
        <h2 className="text-lg font-bold tracking-tight text-safety-yellow-foreground uppercase">
          Required PPE
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {safetyItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 bg-safety-yellow-foreground/10 rounded-md px-3 py-2"
          >
            <item.icon className="h-5 w-5 text-safety-yellow-foreground flex-shrink-0" />
            <span className="text-sm font-semibold text-safety-yellow-foreground">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SafetyBanner;
