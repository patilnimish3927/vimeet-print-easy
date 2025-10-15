import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Printer, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportantNotices } from "@/components/ImportantNotices";

interface LayoutProps {
  children: ReactNode;
  showNotices?: boolean;
  onQrClick?: () => void;
}

export const Layout = ({ children, showNotices = true, onQrClick }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Printer className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">ViMEET Print Bringers</h1>
                <p className="text-sm text-muted-foreground">Your Campus Printing Solution</p>
              </div>
            </Link>
            {onQrClick && (
              <Button
                variant="outline"
                size="icon"
                onClick={onQrClick}
                className="rounded-full"
              >
                <QrCode className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {showNotices && <ImportantNotices />}

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            <strong>For any queries, please contact: 8390952568</strong>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Kindly send a WhatsApp message before calling. I may not be able to answer calls if I am busy.
          </p>
        </div>
      </footer>
    </div>
  );
};