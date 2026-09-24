import { motion } from "framer-motion";

/** Consistent cinematic page header used by every inner page. */
export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <header className="relative overflow-hidden border-b border-border pt-32 pb-12">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[46rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ backgroundImage: "var(--gradient-primary)" }}
        aria-hidden="true"
      />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative mx-auto max-w-7xl px-4 sm:px-8"
      >
        {eyebrow && (
          <p className="mb-3 text-[11px] font-semibold tracking-[0.28em] text-primary-glow uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl font-black text-balance sm:text-5xl">{title}</h1>
        {description && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </motion.div>
    </header>
  );
}
