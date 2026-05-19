import { BadgeCheck, Building2, ShieldCheck, Sparkles } from "lucide-react";

const trustedBy = [
  {
    name: "King Tech Foundation",
    description: "Product engineering",
    icon: Building2,
  },
  {
    name: "QR operations teams",
    description: "Campaign delivery",
    icon: BadgeCheck,
  },
  {
    name: "Link safety teams",
    description: "Verification workflows",
    icon: ShieldCheck,
  },
  {
    name: "Digital creators",
    description: "Pages and profile links",
    icon: Sparkles,
  },
] as const;

export function TrustedBy() {
  return (
    <section
      className="border-t border-slate-200 bg-white"
      aria-labelledby="trusted-by-title"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-sky-700">
                Trusted by
              </p>
              <h2
                id="trusted-by-title"
                className="mt-1 text-xl font-semibold text-slate-950"
              >
                Teams building safer QR workflows
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              Decode is structured for reliable QR creation, verification,
              page publishing, and scan operations without demo data polluting
              production views.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {trustedBy.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.name}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-sky-700 shadow-sm">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-950">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-sm leading-5 text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
