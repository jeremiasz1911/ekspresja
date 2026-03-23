import Image from "next/image";

type Props = {
  title: string;
  description?: string;
  compact?: boolean;
};

export function PublicPageHeader({ title, description, compact = false }: Props) {
  return (
    <section className={compact ? "mb-6" : "mb-8"}>
      <div className="rounded-2xl border bg-white p-4 shadow-sm md:p-5">
        <div className="flex items-center gap-2">
          <Image
            src="/logoEkspresja.png"
            alt="Ekspresja.net"
            width={320}
            height={90}
            className="h-7 w-auto object-contain md:h-8"
          />
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Ekspresja.net</p>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 md:text-3xl">{title}</h1>
        {description ? <p className="mt-2 text-sm text-zinc-600">{description}</p> : null}
      </div>
    </section>
  );
}
