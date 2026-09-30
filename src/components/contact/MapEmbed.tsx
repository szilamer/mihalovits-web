"use client";

import Link from "next/link";
import { useState } from "react";
import { MapPin } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";

/** Google Maps is only contacted after an explicit click, so no visitor data reaches Google by default. */
export function MapEmbed({ query, title }: { query: string; title: string }) {
  const [loaded, setLoaded] = useState(false);
  const frame = "h-72 w-full rounded-[calc(1.75rem-0.375rem)]";

  return (
    <div className="mt-10 rounded-[1.75rem] bg-ink/5 p-1.5 ring-1 ring-ink/6">
      {loaded ? (
        <iframe
          title={title}
          src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed&hl=hu`}
          referrerPolicy="strict-origin-when-cross-origin"
          className={`${frame} grayscale-[35%] contrast-[1.05]`}
        />
      ) : (
        <div className={`${frame} flex flex-col items-center justify-center gap-5 bg-white px-6 text-center`}>
          <p className="max-w-[42ch] text-[13px] leading-relaxed text-muted">
            A térkép a Google Maps szolgáltatásból töltődik be, ekkor a Google technikai adatokat (pl. IP-címet) kap.
            Részletek az{" "}
            <Link href="/adatkezeles" className="font-medium text-ink underline decoration-sky decoration-2 underline-offset-4">
              adatkezelési tájékoztatóban
            </Link>
            .
          </p>
          <Button tone="ghost" type="button" onClick={() => setLoaded(true)} icon={<MapPin size={16} weight="bold" />}>
            Térkép betöltése
          </Button>
        </div>
      )}
    </div>
  );
}
