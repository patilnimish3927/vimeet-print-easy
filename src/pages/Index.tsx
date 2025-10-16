import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Printer, Upload, Settings } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate("/admin");
      } else {
        navigate("/upload");
      }
    }
  }, [user, navigate]);

  return (
    <Layout showNotices={false}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-foreground">
            Welcome to ViMEET Print Bringers
          </h1>
          <p className="text-xl text-muted-foreground">
            Your trusted campus printing solution - Fast, Affordable, Reliable
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Upload className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Easy Upload</CardTitle>
              <CardDescription>
                Simply upload your PDFs and specify your printing requirements
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Printer className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Quick Turnaround</CardTitle>
              <CardDescription>
                Orders ready by next working day - fast and reliable service
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Settings className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Affordable Rates</CardTitle>
              <CardDescription>
                Just ₹1.50 per page - the best rates on campus
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Get Started</CardTitle>
            <CardDescription className="text-center">
              Create an account or login to submit your print jobs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => navigate("/auth")}
            >
              Login / Register
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Index;
