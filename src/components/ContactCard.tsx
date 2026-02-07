import { Phone, Mail, User } from "lucide-react";

interface ContactCardProps {
  title: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  delay?: string;
}

const ContactCard = ({ title, name, email, phone, role, delay = "0" }: ContactCardProps) => {
  return (
    <div
      className="bg-card rounded-lg border border-border p-4 card-glow hover:card-glow-hover transition-shadow duration-300 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="text-sm font-semibold text-foreground">{name}</p>
        </div>
      </div>
      {role && (
        <p className="text-xs text-muted-foreground mb-3">{role}</p>
      )}
      <div className="space-y-2">
        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-2 text-sm text-info hover:text-primary transition-colors group"
          >
            <Mail className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
            <span className="truncate font-mono text-xs">{email}</span>
          </a>
        )}
        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-2 text-sm text-success hover:text-primary transition-colors group"
          >
            <Phone className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
            <span className="font-mono text-xs">{phone}</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default ContactCard;
