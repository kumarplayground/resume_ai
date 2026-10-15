import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "align. | Resume Studio - AI-Powered Resume Customizer",
  description: "Intelligently tailor your resume to any job description. Instant match score, ATS optimization, and missing keywords analysis.",
  keywords: ["resume customizer", "AI resume builder", "ATS optimizer", "job application tailoring"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          id="align-theme-init"
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var stored = localStorage.getItem('align_theme');
                var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (stored === 'dark' || ((!stored || stored === 'system') && systemDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch(e) {}
            })();`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-[#fafafa] dark:bg-[#090c0a] text-gray-900 dark:text-gray-100`}>
        {children}
      </body>
    </html>
  );
}
