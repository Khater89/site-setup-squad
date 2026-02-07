import { FileText, ExternalLink, BookOpen, ClipboardList } from "lucide-react";

const documents = [
  {
    title: "Step-by-Step Instructions",
    description: "Links, signoff sheets & document uploads",
    url: "https://app.smartsheet.com/b/form/0a379ac3ba1e4853856a07c616714c1a",
    icon: ClipboardList,
    tag: "Smartsheet",
  },
  {
    title: "Installation Guide",
    description: "Herc Rentals – Acuative Run Book",
    url: "https://intranet.telsource.net/technotes/Site-and-Client-Information/H/Herc%20Rentals/Run%20Book/Herc%20Rentals%20-%20Acuative%20Run%20Book.docx",
    icon: BookOpen,
    tag: "Intranet",
  },
];

const DocumentLinks = () => {
  return (
    <div className="space-y-3 animate-slide-up" style={{ animationDelay: "300ms" }}>
      <div className="flex items-center gap-2 mb-1">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
          Circuit Info & Documents
        </h3>
      </div>
      {documents.map((doc) => (
        <a
          key={doc.title}
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-card rounded-lg border border-border p-4 card-glow hover:card-glow-hover transition-all duration-300 group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <doc.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {doc.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{doc.description}</p>
                <span className="inline-block mt-2 text-[10px] font-mono font-semibold uppercase tracking-widest bg-secondary text-muted-foreground px-2 py-0.5 rounded">
                  {doc.tag}
                </span>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors mt-1" />
          </div>
        </a>
      ))}
    </div>
  );
};

export default DocumentLinks;
