import type { Metadata } from "next";

import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";

import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { ErrorBoundary } from "@/components/observability/ErrorBoundary";
import { ClientErrorReporter } from "@/components/observability/ClientErrorReporter";

import { defaultSiteMetadata } from "@/lib/seo";

import "./globals.css";



const geistSans = Geist({

  variable: "--font-geist-sans",

  subsets: ["latin"],

});



const geistMono = Geist_Mono({

  variable: "--font-geist-mono",

  subsets: ["latin"],

});



const display = Cormorant_Garamond({

  variable: "--font-display",

  subsets: ["latin"],

  weight: ["400", "500", "600", "700"],

  style: ["normal", "italic"],

});



export const metadata: Metadata = defaultSiteMetadata;



export default function RootLayout({

  children,

}: {

  children: React.ReactNode;

}) {

  return (

    <html lang="pt-BR">

      <body

        className={`${geistSans.variable} ${geistMono.variable} ${display.variable} min-h-screen antialiased font-sans`}

      >

        <AnalyticsProvider>
          <ErrorBoundary>
            <ClientErrorReporter />
            {children}
          </ErrorBoundary>
        </AnalyticsProvider>

      </body>

    </html>

  );

}

