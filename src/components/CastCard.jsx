import { initials, seeded } from "../utils/helpers";

const ROLES = ["Lead", "Supporting", "Featured", "Special appearance"];

export default function CastCard({ name, index = 0 }) {
  const hue = Math.floor(seeded(index + name.length) * 360);

  return (
    <div className="w-32 shrink-0 text-center">
      <div
        className="mx-auto grid h-32 w-32 place-items-center rounded-2xl border border-border font-display text-2xl font-bold"
        style={{
          backgroundImage: `linear-gradient(150deg, hsl(${hue} 60% 32%), hsl(${(hue + 45) % 360} 50% 14%))`,
        }}
      >
        {initials(name)}
      </div>
      <p className="mt-3 truncate text-sm font-semibold">{name}</p>
      <p className="text-xs text-muted-foreground">{ROLES[index % ROLES.length]}</p>
    </div>
  );
}
