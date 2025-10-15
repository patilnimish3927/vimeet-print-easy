import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const totalCost = totalPages * 1.5;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Payment Information</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">₹{totalCost.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              ({totalPages} pages × ₹1.50)
            </p>
          </div>

          {qrCodeUrl && (
            <div className="flex justify-center">
              <img 
                src={qrCodeUrl} 
                alt="Payment QR Code" 
                className="w-64 h-64 object-contain border-2 border-border rounded-lg"
              />
            </div>
          )}

          {upiId && (
            <div className="text-center p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground">UPI ID</p>
              <p className="text-lg font-semibold text-foreground">{upiId}</p>
            </div>
          )}

          {contactNumber && (
            <div className="text-center p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground">Contact Number</p>
              <p className="text-lg font-semibold text-foreground">{contactNumber}</p>
            </div>
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
      </DialogContent>
    </Dialog>
  );
};