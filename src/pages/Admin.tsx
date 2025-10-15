import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, CheckCircle, LogOut } from "lucide-react";
import JSZip from "jszip";

interface PrintJob {
  id: string;
  user_id: string;
  submission_timestamp: string;
  total_pages: number;
  print_instructions: string;
  status: string;
  users: {
    name: string;
    mobile_number: string;
  };
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [upiId, setUpiId] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!user.is_admin) {
      navigate("/upload");
      return;
    }
    loadJobs();
    loadSettings();
  }, [user, navigate]);

  const loadJobs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("print_jobs")
      .select(`
        *,
        users (name, mobile_number)
      `)
      .eq("status", "Pending")
      .order("submission_timestamp", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load print jobs"
      });
    } else {
      setJobs(data as PrintJob[]);
    }
    setIsLoading(false);
  };

  const loadSettings = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("*");
    
    if (data) {
      const settings = data.reduce((acc: any, curr: any) => {
        acc[curr.setting_key] = curr.setting_value;
        return acc;
      }, {});
      setUpiId(settings.upi_id || "");
      setContactNumber(settings.contact_number || "");
    }
  };

  const downloadJobFiles = async (jobId: string) => {
    try {
      // Get all files for this job
      const { data: files, error } = await supabase
        .from("job_files")
        .select("*")
        .eq("job_id", jobId);

      if (error) throw error;

      const zip = new JSZip();
      
      for (const file of files || []) {
        const { data: fileData } = await supabase.storage
          .from("print-files")
          .download(file.file_url);

        if (fileData) {
          zip.file(file.original_filename, fileData);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `job-${jobId}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Files downloaded successfully"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error.message
      });
    }
  };

  const markAsCompleted = async (jobId: string) => {
    const { error } = await supabase
      .from("print_jobs")
      .update({ status: "Completed" })
      .eq("id", jobId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update job status"
      });
    } else {
      toast({
        title: "Success",
        description: "Job marked as completed"
      });
      loadJobs();
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Upload QR code if provided
      let qrCodeUrl = "";
      if (qrCodeFile) {
        const filePath = `qr-codes/${Date.now()}-${qrCodeFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("print-files")
          .upload(filePath, qrCodeFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("print-files")
          .getPublicUrl(filePath);

        qrCodeUrl = publicUrl;
      }

      // Update settings
      const updates = [
        { setting_key: "upi_id", setting_value: upiId },
        { setting_key: "contact_number", setting_value: contactNumber }
      ];

      if (qrCodeUrl) {
        updates.push({ setting_key: "qr_code_url", setting_value: qrCodeUrl });
      }

      for (const update of updates) {
        await supabase
          .from("app_settings")
          .upsert(update);
      }

      toast({
        title: "Success",
        description: "Settings updated successfully"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (!user || !user.is_admin) {
    return null;
  }

  return (
    <Layout showNotices={false}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Admin Dashboard</h2>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="jobs">Pending Jobs</TabsTrigger>
            <TabsTrigger value="settings">Site Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <CardTitle>Pending Print Jobs</CardTitle>
                <CardDescription>
                  Manage and process pending print requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center text-muted-foreground">Loading...</p>
                ) : jobs.length === 0 ? (
                  <p className="text-center text-muted-foreground">No pending jobs</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User Name</TableHead>
                          <TableHead>Mobile</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Pages</TableHead>
                          <TableHead>Instructions</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobs.map((job) => (
                          <TableRow key={job.id}>
                            <TableCell>{job.users.name}</TableCell>
                            <TableCell>{job.users.mobile_number}</TableCell>
                            <TableCell>
                              {new Date(job.submission_timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>{job.total_pages}</TableCell>
                            <TableCell>{job.print_instructions || "None"}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadJobFiles(job.id)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => markAsCompleted(job.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Complete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Site Settings</CardTitle>
                <CardDescription>
                  Update payment and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qr-code">Payment QR Code</Label>
                  <Input
                    id="qr-code"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setQrCodeFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upi">UPI ID</Label>
                  <Input
                    id="upi"
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="example@upi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Mobile Number</Label>
                  <Input
                    id="contact"
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="10-digit mobile number"
                  />
                </div>
                <Button onClick={handleSaveSettings} className="w-full">
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}