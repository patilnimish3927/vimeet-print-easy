import { useState } from "react";
import { QrCode, Phone, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  totalPages: number;
  qrCodeUrl?: string;
  upiId?: string;
  contactNumber?: string;
}

export const PaymentModal = ({
  open,
  onClose,
  totalPages,
  qrCodeUrl,
  upiId,
  contactNumber
}: PaymentModalProps) => {
  const [showQrDialog, setShowQrDialog] = useState(false);
  const totalCost = totalPages * 1.5;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Payment Information</DialogTitle>
            <DialogDescription className="sr-only">
              View payment details including total cost, UPI ID, and contact information
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6 py-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">₹{totalCost.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  ({totalPages} pages × ₹1.50 per page)
                </p>
              </div>

              {upiId && (
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">UPI ID</p>
                  </div>
                  <p className="text-lg font-semibold text-foreground">{upiId}</p>
                </div>
              )}

              {contactNumber && (
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Contact Number</p>
                  </div>
                  <p className="text-lg font-semibold text-foreground">{contactNumber}</p>
                </div>
              )}

              {qrCodeUrl && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowQrDialog(true)}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  View Payment QR Code
                </Button>
              )}

              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                <p className="text-sm text-center font-medium">
                  ⚠️ Please pay only after we confirm your order on WhatsApp.
                  <br />
                  You can take a screenshot to pay later.
                </p>
              </div>

              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Payment QR Code</DialogTitle>
            <DialogDescription className="sr-only">
              Scan this QR code to complete the payment
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="flex flex-col items-center gap-4 p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">₹{totalCost.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  Scan to pay
                </p>
              </div>
              {qrCodeUrl && (
                <img 
                  src={qrCodeUrl} 
                  alt="Payment QR Code" 
                  className="w-full max-w-md object-contain border-2 border-border rounded-lg"
                />
              )}
              <Button onClick={() => setShowQrDialog(false)} className="w-full">
                Close
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};