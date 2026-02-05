import type { Metadata } from "next";
import { Montserrat, Merriweather, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"


const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-serif",
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tg-News Agent Dashboard",
  description: "Agentic workflow management for Tg-News",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} ${merriweather.variable} ${sourceCodePro.variable} antialiased`}
      >
        <SidebarProvider>
          {/* 桌面端显示侧边栏，移动端隐藏 */}
          <div className="hidden md:block">
            <AppSidebar />
          </div>

          <SidebarInset>
            {/* 头部在桌面端保留用于可能的面包屑等，移动端可以简化 */}
            <header className="flex h-10 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-10">
              <div className="flex items-center gap-2 px-4">
              </div>
            </header>

            {/* 内容区域：移动端底部留出空间给导航栏 */}
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0 pb-20 md:pb-4">
              {children}
            </div>
          </SidebarInset>

          {/* 移动端底部导航 */}
          <MobileNav />
        </SidebarProvider>
      </body>
    </html>
  );
}
