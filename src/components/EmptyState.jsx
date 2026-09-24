import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function EmptyState({
  icon: Icon = Sparkles,
  title = "Nothing here yet",
  description,
  actionLabel,
  actionTo = "/discover",
  onAction,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass card-elevated mx-auto flex max-w-xl flex-col items-center rounded-3xl px-8 py-14 text-center"
    >
      <div
        className="mb-6 grid h-20 w-20 place-items-center rounded-3xl"
        style={{ backgroundImage: "var(--gradient-primary)" }}
      >
        <Icon className="h-9 w-9 text-primary-foreground" aria-hidden="true" />
      </div>
      <h3 className="font-display text-2xl font-semibold">{title}</h3>
      {description && <p className="mt-3 text-sm text-muted-foreground">{description}</p>}
      {actionLabel &&
        (onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="btn-primary mt-7 rounded-full px-6 py-3 text-sm font-semibold"
          >
            {actionLabel}
          </button>
        ) : (
          <Link
            to={actionTo}
            className="btn-primary mt-7 rounded-full px-6 py-3 text-sm font-semibold"
          >
            {actionLabel}
          </Link>
        ))}
    </motion.div>
  );
}
