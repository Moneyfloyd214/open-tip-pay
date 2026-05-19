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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  CheckCircle,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type Tip, Variant_fiat_crypto } from "../backend";
import { useGetTipsReceived } from "../hooks/useQueries";

interface TaxReportExportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TaxReportExport({
  open,
  onOpenChange,
}: TaxReportExportProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [reportFormat, setReportFormat] = useState<"pdf" | "csv">("pdf");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: tipsReceived, isLoading } = useGetTipsReceived();

  const months = [
    { value: "all", label: "All Months" },
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

  const filterTipsByPeriod = (tips: Tip[]) => {
    return tips.filter((tip) => {
      const tipDate = new Date(Number(tip.timestamp) / 1000000);
      const tipYear = tipDate.getFullYear();
      const tipMonth = tipDate.getMonth() + 1;

      const yearMatch = tipYear === Number.parseInt(selectedYear);
      const monthMatch =
        selectedMonth === "all" || tipMonth === Number.parseInt(selectedMonth);

      return yearMatch && monthMatch;
    });
  };

  const categorizeIncome = (tips: Tip[]) => {
    const professional = tips.filter((tip) => tip.professional);
    const gifts = tips.filter((tip) => !tip.professional);

    const professionalTotal =
      professional.reduce((sum, tip) => sum + Number(tip.amount), 0) / 100;
    const giftsTotal =
      gifts.reduce((sum, tip) => sum + Number(tip.amount), 0) / 100;

    return {
      professional,
      gifts,
      professionalTotal,
      giftsTotal,
      totalIncome: professionalTotal + giftsTotal,
    };
  };

  const generatePDFContent = (
    categorized: ReturnType<typeof categorizeIncome>,
  ) => {
    const monthName =
      months.find((m) => m.value === selectedMonth)?.label || "All Months";
    const period =
      selectedMonth === "all"
        ? `${selectedYear}`
        : `${monthName} ${selectedYear}`;

    return `
═══════════════════════════════════════════════════════════════
                    OPENTIP TAX REPORT
                  Digital Income Compliance 2026
═══════════════════════════════════════════════════════════════

REPORTING PERIOD: ${period}
GENERATED: ${format(new Date(), "PPpp")}

───────────────────────────────────────────────────────────────
                    INCOME SUMMARY
───────────────────────────────────────────────────────────────

Professional Income (Taxable):        $${categorized.professionalTotal.toFixed(2)}
Gifts (Non-Taxable):                  $${categorized.giftsTotal.toFixed(2)}
                                      ─────────────────
TOTAL INCOME:                         $${categorized.totalIncome.toFixed(2)}

───────────────────────────────────────────────────────────────
              PROFESSIONAL INCOME TRANSACTIONS
                    (${categorized.professional.length} transactions)
───────────────────────────────────────────────────────────────

${categorized.professional
  .map((tip, index) => {
    const date = new Date(Number(tip.timestamp) / 1000000);
    const amount = Number(tip.amount) / 100;
    const currencyType =
      tip.currencyType === Variant_fiat_crypto.crypto ? "Crypto" : "Fiat";
    return `${index + 1}. ${format(date, "MMM dd, yyyy HH:mm")}
   Amount: $${amount.toFixed(2)} (${currencyType})
   Note: ${tip.message || "No message"}
   `;
  })
  .join("\n")}

───────────────────────────────────────────────────────────────
                    GIFT TRANSACTIONS
                    (${categorized.gifts.length} transactions)
───────────────────────────────────────────────────────────────

${categorized.gifts
  .map((tip, index) => {
    const date = new Date(Number(tip.timestamp) / 1000000);
    const amount = Number(tip.amount) / 100;
    const currencyType =
      tip.currencyType === Variant_fiat_crypto.crypto ? "Crypto" : "Fiat";
    return `${index + 1}. ${format(date, "MMM dd, yyyy HH:mm")}
   Amount: $${amount.toFixed(2)} (${currencyType})
   Note: ${tip.message || "No message"}
   `;
  })
  .join("\n")}

───────────────────────────────────────────────────────────────
                    COMPLIANCE NOTES
───────────────────────────────────────────────────────────────

2026 Digital Income Compliance Requirements:
• Professional service income is generally taxable
• Personal gifts under certain thresholds may be non-taxable
• Consult with a tax professional for specific guidance
• Keep this report for your tax records

This report was generated by Open Tip Pay and reflects transactions
recorded on the platform. For complete tax compliance, please
consult with a qualified tax professional.

═══════════════════════════════════════════════════════════════
© 2025 Open Tip Pay. Built with love using caffeine.ai
═══════════════════════════════════════════════════════════════
    `.trim();
  };

  const generateCSVContent = (
    categorized: ReturnType<typeof categorizeIncome>,
  ) => {
    const allTips = [...categorized.professional, ...categorized.gifts];

    const header = "Date,Time,Amount,Currency Type,Category,Message\n";
    const rows = allTips
      .map((tip) => {
        const date = new Date(Number(tip.timestamp) / 1000000);
        const amount = (Number(tip.amount) / 100).toFixed(2);
        const currencyType =
          tip.currencyType === Variant_fiat_crypto.crypto ? "Crypto" : "Fiat";
        const category = tip.professional ? "Professional Income" : "Gift";
        const message = (tip.message || "No message").replace(/,/g, ";");

        return `${format(date, "yyyy-MM-dd")},${format(date, "HH:mm:ss")},${amount},${currencyType},${category},"${message}"`;
      })
      .join("\n");

    const summary = `\n\nSUMMARY\nProfessional Income,$${categorized.professionalTotal.toFixed(2)}\nGifts,$${categorized.giftsTotal.toFixed(2)}\nTotal Income,$${categorized.totalIncome.toFixed(2)}`;

    return header + rows + summary;
  };

  const handleGenerateReport = async () => {
    if (!tipsReceived) {
      toast.error("No transaction data available");
      return;
    }

    setIsGenerating(true);

    try {
      const filteredTips = filterTipsByPeriod(tipsReceived);

      if (filteredTips.length === 0) {
        toast.error("No transactions found for the selected period");
        setIsGenerating(false);
        return;
      }

      const categorized = categorizeIncome(filteredTips);

      const monthName =
        months.find((m) => m.value === selectedMonth)?.label || "All";
      const fileName = `OpenTipPay_TaxReport_${monthName}_${selectedYear}`;

      let content: string;
      let mimeType: string;
      let extension: string;

      if (reportFormat === "pdf") {
        content = generatePDFContent(categorized);
        mimeType = "text/plain";
        extension = "txt";
      } else {
        content = generateCSVContent(categorized);
        mimeType = "text/csv";
        extension = "csv";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Tax report downloaded as ${extension.toUpperCase()}!`);

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (error: any) {
      console.error("Report generation error:", error);
      toast.error(error.message || "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const getPreviewStats = () => {
    if (!tipsReceived) return null;

    const filteredTips = filterTipsByPeriod(tipsReceived);
    const categorized = categorizeIncome(filteredTips);

    return categorized;
  };

  const previewStats = getPreviewStats();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-navy-light/95 backdrop-blur-xl border-teal/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <img
              src="/assets/generated/tax-report-icon.dim_32x32.png"
              alt="Tax Report"
              className="h-6 w-6"
            />
            Export for Tax Season
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Generate professional PDF and CSV reports separating gifts from
            professional income
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Period Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month" className="text-white">
                Month
              </Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger
                  id="month"
                  className="bg-navy-dark/50 border-teal/30 text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-navy-dark border-teal/30">
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
                  className="bg-navy-dark/50 border-teal/30 text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-navy-dark border-teal/30">
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

          {/* Format Selection */}
          <div className="space-y-2">
            <Label className="text-white">Report Format</Label>
            <Tabs
              value={reportFormat}
              onValueChange={(v) => setReportFormat(v as "pdf" | "csv")}
            >
              <TabsList className="grid w-full grid-cols-2 bg-navy-dark/50">
                <TabsTrigger
                  value="pdf"
                  className="data-[state=active]:bg-teal"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  PDF
                </TabsTrigger>
                <TabsTrigger
                  value="csv"
                  className="data-[state=active]:bg-teal"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  CSV
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Preview Stats */}
          {previewStats && (
            <div className="glassmorphism rounded-lg p-4 border border-teal/30 space-y-3">
              <div className="flex items-center gap-2 text-teal">
                <CheckCircle className="h-5 w-5" />
                <p className="font-medium">Report Preview</p>
              </div>

              <div className="space-y-2 text-sm text-white">
                <div className="flex justify-between">
                  <span className="text-white/70">Professional Income:</span>
                  <span className="font-medium text-teal">
                    ${previewStats.professionalTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Gifts:</span>
                  <span className="font-medium">
                    ${previewStats.giftsTotal.toFixed(2)}
                  </span>
                </div>
                <div className="h-px bg-teal/30 my-2" />
                <div className="flex justify-between">
                  <span className="text-white/70 font-semibold">
                    Total Income:
                  </span>
                  <span className="font-bold text-teal">
                    ${previewStats.totalIncome.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Transactions:</span>
                  <span className="text-white/80">
                    {previewStats.professional.length +
                      previewStats.gifts.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating || isLoading}
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
                <Download className="mr-2 h-5 w-5" />
                Generate & Download Report
              </>
            )}
          </Button>

          {/* Compliance Notice */}
          <div className="rounded-lg bg-teal/10 border border-teal/30 p-3">
            <p className="text-xs text-white/80 leading-relaxed">
              <strong className="text-teal">
                📋 2026 Digital Income Compliance:
              </strong>{" "}
              This report separates professional income from gifts for tax
              purposes. Professional service payments are generally taxable.
              Consult with a tax professional for specific guidance.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
