import { motion } from "framer-motion";
import { User, Phone, MapPin, Stethoscope, Award, Calendar, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import mfnLogo from "@/assets/mfn-logo.png";

interface LiveProfilePreviewProps {
  name: string;
  phone: string;
  city: string;
  dob: string;
  roleType: string;
  licenseId: string;
  experienceYears: string;
  email: string;
  specialties: string[];
}

const LiveProfilePreview = (props: LiveProfilePreviewProps) => {
  const { t, isRTL } = useLanguage();
  const { name, phone, city, dob, roleType, licenseId, experienceYears, email, specialties } = props;

  const initials = name
    ? name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("")
    : "?";

  const roleLabel = roleType ? t(`role_type.${roleType}`) : (isRTL ? "التخصص" : "Specialty");

  return (
    <motion.div
      initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-6"
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-primary/10 via-card to-primary/5 backdrop-blur-xl shadow-xl">
        {/* Decorative blobs */}
        <div className="absolute -top-12 -end-12 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-12 -start-12 h-32 w-32 rounded-full bg-success/20 blur-3xl" />

        <div className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <img src={mfnLogo} alt="MFN" className="h-7" />
            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
              {isRTL ? "معاينة حية" : "Live Preview"}
            </span>
          </div>

          {/* Avatar + Name */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg">
                {initials.toUpperCase()}
              </div>
              {roleType && (
                <div className="absolute -bottom-1 -end-1 h-7 w-7 rounded-full bg-success text-success-foreground flex items-center justify-center shadow-md">
                  <Stethoscope className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
            <h3 className="mt-3 font-bold text-lg text-foreground">
              {name || (isRTL ? "اسمك سيظهر هنا" : "Your name appears here")}
            </h3>
            <p className="text-sm text-primary font-medium mt-0.5">{roleLabel}</p>
          </div>

          {/* Info rows */}
          <div className="space-y-2.5 text-sm">
            <PreviewRow icon={<Phone className="h-3.5 w-3.5" />} value={phone} placeholder={isRTL ? "رقم الهاتف" : "Phone"} dir="ltr" />
            <PreviewRow icon={<Mail className="h-3.5 w-3.5" />} value={email} placeholder={isRTL ? "البريد" : "Email"} dir="ltr" />
            <PreviewRow icon={<MapPin className="h-3.5 w-3.5" />} value={city} placeholder={isRTL ? "المدينة" : "City"} />
            <PreviewRow icon={<Calendar className="h-3.5 w-3.5" />} value={dob} placeholder={isRTL ? "تاريخ الميلاد" : "Date of Birth"} dir="ltr" />
            <PreviewRow icon={<Award className="h-3.5 w-3.5" />} value={licenseId} placeholder={isRTL ? "رقم الرخصة" : "License #"} dir="ltr" />
            {experienceYears && (
              <PreviewRow icon={<User className="h-3.5 w-3.5" />} value={`${experienceYears} ${isRTL ? "سنة خبرة" : "years exp."}`} placeholder="" />
            )}
          </div>

          {specialties.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">{isRTL ? "التخصصات" : "Specialties"}</p>
              <div className="flex flex-wrap gap-1.5">
                {specialties.map((s) => (
                  <span
                    key={s}
                    className="text-[11px] font-medium px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                  >
                    {t(`specialty.${s}`)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const PreviewRow = ({
  icon,
  value,
  placeholder,
  dir,
}: {
  icon: React.ReactNode;
  value: string;
  placeholder: string;
  dir?: "ltr" | "rtl";
}) => (
  <div className="flex items-center gap-2">
    <span className="h-7 w-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
      {icon}
    </span>
    <span
      className={`flex-1 truncate ${value ? "text-foreground font-medium" : "text-muted-foreground/60 italic"}`}
      dir={dir}
    >
      {value || placeholder}
    </span>
  </div>
);

export default LiveProfilePreview;
