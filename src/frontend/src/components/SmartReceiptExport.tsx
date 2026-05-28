import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { CircleCheck as CheckCircle, Download, FileText, Loader as Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SmartReceiptExportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SmartReceiptExport({
  open,
  onOpenChange,
}: SmartReceiptExportProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<any>(null);

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleGenerateReceipt = async () => {
    setIsGenerating(true);
    setGeneratedReceipt(null);
    try {
      // Stub receipt — replace with Supabase query when tip data is wired
      const stub = {
        professionalTips: [],
        totalAmount: BigInt(0),
        generatedAt: BigInt(Date.now()) * BigInt(1_000_000),
      };
      setGeneratedReceipt(stub);
      toast.success("Smart Receipt generated successfully!");
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate receipt");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!generatedReceipt) return;

    // Generate PDF content (simplified - in production would use a proper PDF library)
    const monthName = months.find((m) => m.value === selectedMonth)?.label;
    const totalAmount = Number(generatedReceipt.totalAmount) / 100;
    const tipCount = generatedReceipt.professionalTips.length;

    const pdfContent = `
Open Tip Pay - Tax-Ready Summary
${monthName} ${selectedYear}

Professional Service Transactions
Total Earnings: $${totalAmount.toFixed(2)}
Number of Transactions: ${tipCount}

Transaction Details:
${generatedReceipt.professionalTips
  .map((tip: any, index: number) => {
    const date = new Date(Number(tip.timestamp) / 1000000);
    const amount = Number(tip.amount) / 100;
    return `${index + 1}. ${format(date, "MMM dd, yyyy")} - $${amount.toFixed(2)} - ${tip.message || "No message"}`;
  })
  .join("\n")}

Generated: ${format(new Date(Number(generatedReceipt.generatedAt) / 1000000), "PPpp")}

This document summarizes professional service payments received through Open Tip Pay.
For tax purposes, please consult with a tax professional.

© 2025 Open Tip Pay. Built with love using caffeine.ai
    `.trim();

    // Create and download text file (in production, would generate actual PDF)
    const blob = new Blob([pdfContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `OpenTipPay_TaxSummary_${monthName}_${selectedYear}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Receipt downloaded!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-xl border-teal/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-teal" />
            Smart Receipt Export
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Generate tax-ready summaries of your professional service earnings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month" className="text-white">
                Month
              </Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger
                  id="month"
                  className="bg-muted/50 border-teal/30 text-foreground"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-teal/30">
                  {months.map((month) => (
                    <SelectItem
                      key={month.value}
                      value={month.value}
                      className="text-white"
                    >
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year" className="text-white">
                Year
              </Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger
                  id="year"
                  className="bg-muted/50 border-teal/30 text-foreground"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-teal/30">
                  {years.map((year) => (
                    <SelectItem
                      key={year}
                      value={year.toString()}
                      className="text-white"
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {generatedReceipt && (
            <div className="glassmorphism rounded-lg p-4 border border-teal/30 space-y-3">
              <div className="flex items-center gap-2 text-teal">
                <CheckCircle className="h-5 w-5" />
                <p className="font-medium">Receipt Generated</p>
              </div>

              <div className="space-y-2 text-sm text-foreground">
                <div className="flex justify-between">
                  <span className="text-white/70">Period:</span>
                  <span className="font-medium">
                    {months.find((m) => m.value === selectedMonth)?.label}{" "}
                    {selectedYear}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Professional Tips:</span>
                  <span className="font-medium">
                    {generatedReceipt.professionalTips.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Total Amount:</span>
                  <span className="font-medium text-teal">
                    ${(Number(generatedReceipt.totalAmount) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Generated:</span>
                  <span className="font-medium text-xs">
                    {format(
                      new Date(Number(generatedReceipt.generatedAt) / 1000000),
                      "PPp",
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Button
              onClick={handleGenerateReceipt}
              disabled={isGenerating}
              className="w-full bg-teal hover:bg-teal-dark text-white font-semibold shadow-lg shadow-teal/30"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Generate Receipt
                </>
              )}
            </Button>

            {generatedReceipt && (
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                className="w-full border-teal/30 bg-muted/50 text-white hover:bg-teal/20"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                Download PDF
              </Button>
            )}
          </div>

          <div className="rounded-lg bg-teal/10 border border-teal/30 p-3">
            <p className="text-xs text-white/80">
              💡 <strong>Tax Tip:</strong> Smart Receipts automatically group
              all transactions marked as "professional service" for easy tax
              reporting. Consult with a tax professional for guidance.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
