import { ThemeProvider } from "@/components/home/theme-provider";
import { siteConfig } from "@/lib/site";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "black",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: "OrchestraConnect AI est un assistant intelligent qui vous aide à accomplir vos tâches quotidiennes. Grâce à une conversation naturelle, il devient votre compagnon numérique pour la recherche, l'analyse de données et les défis quotidiens.",
  keywords: ["AI", "intelligence artificielle", "assistant IA", "conciergerie B2B", "recherche", "analyse de données", "OrchestraConnect"],
  authors: [{ name: "OrchestraConnect", url: "https://orchestraconnect.fr" }],
  creator: "OrchestraConnect",
  publisher: "OrchestraConnect",
  category: "Technology",
  applicationName: "OrchestraConnect AI",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "OrchestraConnect AI - Assistant intelligent pour votre entreprise",
    description: "OrchestraConnect AI est un assistant intelligent qui vous aide à accomplir vos tâches quotidiennes et à simplifier votre vie professionnelle.",
    url: siteConfig.url,
    siteName: "OrchestraConnect AI",
    images: [{
      url: "/banner.png",
      width: 1200,
      height: 630,
      alt: "OrchestraConnect AI - Assistant intelligent pour votre entreprise",
      type: "image/png",
    }],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OrchestraConnect AI - Assistant intelligent pour votre entreprise",
    description: "OrchestraConnect AI est un assistant intelligent qui vous aide à accomplir vos tâches quotidiennes et à simplifier votre vie professionnelle.",
    creator: "@orchestraconnect",
    site: "@orchestraconnect",
    images: [{
      url: "/banner.png",
      width: 1200,
      height: 630,
      alt: "OrchestraConnect AI - Assistant intelligent pour votre entreprise",
    }],
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "any" },
    ],
    shortcut: "/favicon.png",
  },
  // manifest: "/manifest.json",
  alternates: {
    canonical: siteConfig.url,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-PCHSN4M2');`}
        </Script>
        {/* End Google Tag Manager */}
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans bg-background`}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PCHSN4M2"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Providers>
            {children}
            <Toaster />
          </Providers>
          <Analytics />
          <GoogleAnalytics gaId="G-6ETJFB3PT3" />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
