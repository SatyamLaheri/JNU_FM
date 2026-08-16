import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { playlist } from "../data/playlist";

import appCss from "../styles.css?url";
import { CampusBackground } from "../components/jnu-campus/CampusBackground";

const SITE_URL = import.meta.env.VITE_SITE_URL || "http://localhost:3000";

const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: "JNU Campus",
      alternateName: "जे.एन.यू.",
      description:
        "JNU Campus is an ambient campus radio experience for the JNU community — nostalgic Hindi music against a painterly illustration of hostel nights.",
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: `${SITE_URL}/`,
      name: "JNU Campus — Ambient Campus Radio",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: "An ambient now-playing experience for the JNU campus community with nostalgic Hindi music.",
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#webapp`,
      url: `${SITE_URL}/`,
      name: "JNU Campus Radio",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "All",
      browserRequirements: "Requires JavaScript and HTML5 Audio",
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Jawaharlal Nehru University",
      alternateName: "JNU",
      url: "https://www.jnu.ac.in",
    },
    {
      "@type": "MusicPlaylist",
      "@id": `${SITE_URL}/#playlist`,
      name: "Nostalgic Hindi Playlist — JNU Campus",
      description: "Campus radio playlist: classic old Hindi songs, 90s Bollywood hits, and nostalgic hostel-night melodies.",
      numTracks: playlist.length,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: playlist.map((track, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "MusicRecording",
            name: track.title,
            byArtist: track.artist,
            inAlbum: track.album,
            datePublished: track.year ? String(track.year) : undefined,
            url: `${SITE_URL}/?song=${track.id}`,
            image: `${SITE_URL}${track.cover}`,
          },
        })),
      },
      track: playlist.map((track, index) => ({
        "@type": "MusicRecording",
        name: track.title,
        position: index + 1,
        url: `${SITE_URL}${track.audio}`,
        image: `${SITE_URL}${track.cover}`,
        byArtist: {
          "@type": "MusicGroup",
          name: track.artist,
        },
        inAlbum: track.album ? {
          "@type": "MusicAlbum",
          name: track.album,
        } : undefined,
      })),
    },
  ],
};

function NotFoundComponent() {
  return (
    <main className="relative min-h-svh w-full overflow-hidden bg-black select-none flex items-center justify-center p-4">
      <CampusBackground />
      <div
        className="pointer-events-none fixed inset-0 z-1 bg-linear-to-b from-black/45 via-black/20 to-black/65"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="glass-panel relative flex flex-col items-center gap-6 rounded-[26px] border border-white/20 bg-ink/80 p-8 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[0.6rem] font-bold tracking-[0.2em] text-cream/40 uppercase">
              JNU CAMPUS
            </span>
            <h1 className="font-display text-[3.6rem] sm:text-[4.5rem] tracking-wide text-cream leading-none">
              404
            </h1>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <h2 className="text-[1.05rem] font-semibold text-cream leading-tight">
              "Looks like this ride took a wrong turn."
            </h2>
            <p className="text-[0.78rem] text-cream/55 leading-relaxed">
              The stop you're looking for doesn't exist.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col w-full gap-3 mt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 py-2.5 text-[0.8rem] font-semibold text-cream transition-all duration-200 hover:border-white/35 hover:bg-white/12 active:scale-98 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cream/50"
            >
              Back to JNU Campus
            </Link>
            <a
              href="https://www.jnu.ac.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 text-[0.7rem] font-medium text-cream/55 hover:text-cream transition-colors py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cream/50"
            >
              Visit JNU Campus ↗
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "JNU Campus — Ambient Campus Radio" },
      {
        name: "description",
        content:
          "An ambient now-playing experience for the JNU campus community. Stream nostalgic Hindi melodies against a painterly illustration of hostel nights at Jawaharlal Nehru University.",
      },
      {
        name: "keywords",
        content:
          "JNU, Jawaharlal Nehru University, JNU campus, campus radio, hostel nights, Hindi music, nostalgic Bollywood, JNU Campus",
      },
      { name: "author", content: "JNU Campus Community" },
      { name: "publisher", content: "JNU Campus" },
      { name: "theme-color", content: "#8B0000" },
      { name: "robots", content: "index, follow" },
      {
        property: "og:title",
        content: "JNU Campus — Ambient Campus Radio",
      },
      {
        property: "og:description",
        content:
          "An ambient now-playing experience for the JNU campus community — hostel nights, dhaba hour, and campus after dark.",
      },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:image", content: `${SITE_URL}/jnu-campus-bg.png` },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "JNU Campus" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "JNU Campus — Ambient Campus Radio",
      },
      {
        name: "twitter:description",
        content:
          "An ambient now-playing experience for the JNU campus community — hostel nights, dhaba hour, and campus after dark.",
      },
      { name: "twitter:image", content: `${SITE_URL}/jnu-campus-bg.png` },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(jsonLdData),
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "canonical", href: `${SITE_URL}/` },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Rozha+One&family=Noto+Sans+Devanagari:wght@700&display=swap",
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/favicon.svg" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
