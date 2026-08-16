import { createFileRoute } from "@tanstack/react-router";
import { JnuCampus } from "@/components/jnu-campus/JnuCampus";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JNU Campus — Ambient Campus Radio" },
      {
        name: "description",
        content:
          "An ambient now-playing experience for the JNU campus community. Stream nostalgic Hindi melodies against a painterly illustration of hostel nights at Jawaharlal Nehru University.",
      },
      { property: "og:title", content: "JNU Campus — Ambient Campus Radio" },
      {
        property: "og:description",
        content:
          "An ambient now-playing experience for the JNU campus community — hostel nights, dhaba hour, and campus after dark.",
      },
      { property: "og:image", content: "/jnu-campus-bg.png" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JnuCampus,
});
