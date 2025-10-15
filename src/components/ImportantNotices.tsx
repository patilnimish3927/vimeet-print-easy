import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const ImportantNotices = () => {
  const notices = [
    "For best results, please combine all images into a single PDF before uploading.",
    "We do not edit files. Please ensure your documents are final.",
    "Turnaround Time: Orders placed today will be ready for pickup the next working day.",
    "Service is closed on college holidays. Orders will not be processed on holidays or the day before.",
    "We will contact you on WhatsApp to confirm your order before printing. Please pay only after you receive our confirmation.",
    "Minimum order size is 4 pages. Max 4 PDF files per submission."
  ];

  return (
    <div className="bg-[hsl(var(--notice-bg))] text-[hsl(var(--notice-fg))] py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h3 className="font-bold text-lg">IMPORTANT INFORMATION</h3>
            <ul className="space-y-1.5 text-sm">
              {notices.map((notice, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[hsl(var(--notice-fg))] mt-1">•</span>
                  <span>{notice}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};