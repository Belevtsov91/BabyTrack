import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BabyProfileProps {
  name: string;
  birthDate: Date;
  avatarUrl?: string;
}

function calculateAge(birthDate: Date): string {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - birthDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return `${diffDays} д`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} нед`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} мес`;
  } else {
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    if (months > 0) {
      return `${years} г, ${months} мес`;
    }
    return `${years} г`;
  }
}

export function BabyProfile({ name, birthDate, avatarUrl }: BabyProfileProps) {
  const navigate = useNavigate();
  const age = calculateAge(birthDate);
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <button
      onClick={() => navigate("/baby-profile")}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-card/50 transition-colors active:scale-98"
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center overflow-hidden ring-2 ring-primary/20">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg font-semibold text-primary">{initials}</span>
        )}
      </div>
      <div className="flex flex-col items-start">
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-semibold text-foreground">{name}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className="text-sm text-muted-foreground">{age}</span>
      </div>
    </button>
  );
}
