import { siteConfig } from "@/lib/home";
import { SectionHeader } from "@/components/home/section-header";

export function FAQSection() {
  // Temporary mock data since faqSection is not defined in siteConfig
  const faqSection = {
    title: "Questions fréquentes",
    description: "Tout ce que vous devez savoir sur Orchestra Connect",
    faqs: []
  };

  return (
    <section
      id="faq"
      className="flex flex-col items-center justify-center w-full py-20 relative"
    >
      <div className="border-x mx-auto relative w-full max-w-6xl px-6">
        <SectionHeader>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
            {faqSection.title}
          </h2>
          <p className="text-muted-foreground text-center text-balance font-medium">
            {faqSection.description}
          </p>
        </SectionHeader>

        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            Bientôt disponible
          </div>
        </div>
      </div>
    </section>
  );
}
