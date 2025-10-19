import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PaymentModal } from "@/components/PaymentModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PDFDocument } from "pdf-lib";
import { Upload as UploadIcon, FileText, LogOut } from "lucide-react";

export default function Upload() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const [files, setFiles] = useState<File[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [instructions, setInstructions] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [submittedPages, setSubmittedPages] = useState(0);
  const [appSettings, setAppSettings] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (user.role === 'admin') {
      navigate("/admin");
      return;
    }
    loadAppSettings();
  }, [user, navigate]);

  const loadAppSettings = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("*");
    
    if (data) {
      const settings = data.reduce((acc: any, curr: any) => {
        acc[curr.setting_key] = curr.setting_value;
        return acc;
      }, {});
      
      // Get public URL for QR code if it exists
      if (settings.qr_code_url) {
        const { data: { publicUrl } } = supabase.storage
          .from("qr-codes")
          .getPublicUrl(settings.qr_code_url);
        settings.qr_code_url = publicUrl;
      }
      
      setAppSettings(settings);
    }
  };

  const countPdfPages = async (file: File): Promise<number> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      return pdfDoc.getPageCount();
    } catch (error) {
      console.error("Error counting pages:", error);
      toast({
        variant: "destructive",
        title: "PDF Error",
        description: `Failed to process ${file.name}. Please try another file.`
      });
      return 0;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length > 4) {
      toast({
        variant: "destructive",
        title: "Too Many Files",
        description: "Maximum 4 PDF files allowed per submission"
      });
      return;
    }

    // Validate all files are PDFs
    const invalidFiles = selectedFiles.filter(f => !f.type.includes("pdf"));
    if (invalidFiles.length > 0) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Only PDF files are allowed"
      });
      return;
    }

    setFiles(selectedFiles);

    // Count total pages
    let pageCount = 0;
    for (const file of selectedFiles) {
      const pages = await countPdfPages(file);
      pageCount += pages;
    }
    setTotalPages(pageCount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (totalPages < 4) {
      toast({
        variant: "destructive",
        title: "Insufficient Pages",
        description: "Minimum order size is 4 pages"
      });
      return;
    }

    setIsUploading(true);
    const submittedPages = totalPages; // Save before resetting

    try {
      // Create print job
      const { data: jobData, error: jobError } = await supabase
        .from("print_jobs")
        .insert({
          user_id: user!.id,
          total_pages: submittedPages,
          print_instructions: instructions,
          status: "Pending"
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Upload files
      for (const file of files) {
        const filePath = `${user!.id}/${jobData.id}/${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from("print-files")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("print-files")
          .getPublicUrl(filePath);

        // Create job file record
        await supabase
          .from("job_files")
          .insert({
            job_id: jobData.id,
            file_url: filePath,
            original_filename: file.name
          });
      }

      toast({
        title: "Success!",
        description: "Your print job has been submitted successfully"
      });
      
      // Reset form
      setFiles([]);
      setTotalPages(0);
      setInstructions("");
      
      // Show payment modal with saved page count
      setSubmittedPages(submittedPages);
      setShowPayment(true);
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (!user || user.role === 'admin') {
    return null;
  }

  return (
    <Layout onQrClick={() => setShowPayment(true)}>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold">Upload Print Files</h2>
            <p className="text-muted-foreground mt-1">Welcome, {user.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New Print Job</CardTitle>
            <CardDescription>
              Upload your PDF files and specify printing requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="files">PDF Files (Max 4 files)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    id="files"
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="files" className="cursor-pointer">
                    <UploadIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload PDF files
                    </p>
                  </label>
                </div>
                
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-secondary rounded">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm flex-1">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {files.length > 0 && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-lg font-semibold text-center">
                    Total Pages: <span className="text-primary text-2xl">{totalPages}</span>
                  </p>
                  {totalPages > 0 && totalPages < 4 && (
                    <p className="text-sm text-center text-destructive mt-2">
                      Minimum 4 pages required
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="instructions">Print Instructions</Label>
                <Textarea
                  id="instructions"
                  placeholder="e.g., 2 copies, black & white, A4 size"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={4}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isUploading || totalPages < 4 || files.length === 0}
              >
                {isUploading ? "Submitting..." : "Submit Print Job"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        totalPages={submittedPages}
        qrCodeUrl={appSettings?.qr_code_url}
        upiId={appSettings?.upi_id}
        contactNumber={appSettings?.contact_number}
      />
    </Layout>
  );
}