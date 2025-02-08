"use client";
import { useState, useEffect } from "react";
import { format, addMonths, subDays, isSameMonth } from "date-fns";
import {
  Box,
  CircularProgress,
  Paper,
  Typography,
  Button,
  Snackbar,
  Fade,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

function PaymentPage() {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lineUserId, setLineUserId] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    initializeLiff();
  }, []);

  const initializeLiff = async () => {
    try {
      const { searchParams } = new URL(window.location.href);
      const id = searchParams.get("id"); // landlord's id

      if (!id) {
        throw new Error("ID not provided in URL");
      }

      // Get the billing-specific LIFF ID for this landlord
      const response = await fetch(
        `/api/user/line-config?id=${id}&feature=billing`
      );
      const data = await response.json();

      const billingLiffId = data.lineConfig?.liffIds?.billing;
      if (!billingLiffId) {
        throw new Error("LIFF ID not configured for billing feature");
      }

      const liff = (await import("@line/liff")).default;
      await liff.init({
        liffId: billingLiffId,
      });

      if (!liff.isLoggedIn()) {
        await liff.login();
        return;
      }

      const profile = await liff.getProfile();
      setLineUserId(profile.userId);
      fetchCurrentBill(profile.userId, id);
    } catch (error) {
      console.error("Failed to initialize LIFF:", error);
      setError("Failed to initialize LINE login");
      setLoading(false);
    }
  };

  const fetchCurrentBill = async (userId, landlordId) => {
    try {
      const response = await fetch(
        `/api/tenant/bills/current?lineUserId=${userId}&landlordId=${landlordId}`
      );
      if (!response.ok) throw new Error("Failed to fetch bill");
      const data = await response.json();
      setBill(data);
    } catch (error) {
      setError("Failed to fetch bill details");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setVerificationResult({
        success: false,
        message: "Please upload an image file",
      });
      return;
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setVerificationResult({
        success: false,
        message: "File size should be less than 5MB",
      });
      return;
    }

    setUploadedFile(file);
    setVerificationResult(null);
    // Auto submit when file is selected
    handleSubmit(file);
  };

  const handleSubmit = async (file) => {
    if (!file || !bill || !lineUserId) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("billId", bill._id);
      formData.append("lineUserId", lineUserId);

      // Get landlordId from URL
      const { searchParams } = new URL(window.location.href);
      const landlordId = searchParams.get("id");
      formData.append("landlordId", landlordId);

      const response = await fetch("/api/payment/verify-slip", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.status === 200) {
        setVerificationResult({
          success: true,
          message: "Payment verified successfully",
        });
        // Refresh bill to show updated status
        fetchCurrentBill(lineUserId, landlordId);
      } else {
        let errorMessage = "Failed to verify payment slip";
        if (result.details) {
          const { bankMatch, accountMatch, amountMatch } = result.details;
          if (!bankMatch) errorMessage = "Bank does not match";
          else if (!accountMatch)
            errorMessage = "Account number does not match";
          else if (!amountMatch) errorMessage = "Payment amount does not match";
        }
        setVerificationResult({
          success: false,
          message: errorMessage,
        });
      }
    } catch (error) {
      setVerificationResult({
        success: false,
        message: "Error uploading payment slip",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const formatAccountNumber = (number) => {
    // Format XXX-X-XXXXX-X
    return number.replace(/(\d{3})(\d{1})(\d{5})(\d{1})/, "$1-$2-$3-$4");
  };

  const handleCopyClick = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const defaultPeriod = (bill) => {
    const billMonth = new Date(bill.month);
    const startDate = new Date(billMonth);
    startDate.setDate(25);
    startDate.setMonth(startDate.getMonth() - 1);

    const endDate = new Date(billMonth);
    endDate.setDate(25);

    return {
      start: format(startDate, "MMM d"),
      end: format(endDate, "MMM d"),
      isPartial: false,
    };
  };

  const getRentalPeriod = (bill) => {
    console.log("Full bill object:", bill);

    // Use tenant data from the room instead
    if (!bill.roomId?.tenant?.leaseStartDate) {
      console.log("Tenant or lease start date missing, using default period");
      return defaultPeriod(bill);
    }

    const billMonth = new Date(bill.month);
    const leaseStart = new Date(bill.roomId.tenant.leaseStartDate);

    console.log("Bill month:", format(billMonth, "yyyy-MM-dd"));
    console.log("Lease start:", format(leaseStart, "yyyy-MM-dd"));

    // More precise first month check
    const isFirstMonth =
      billMonth.getFullYear() === leaseStart.getFullYear() &&
      billMonth.getMonth() === leaseStart.getMonth();

    console.log("Is first month:", isFirstMonth);

    if (isFirstMonth) {
      console.log("Calculating first month period");
      // For first month, start from lease start date
      const startDate = leaseStart;
      const endDate = new Date(
        billMonth.getFullYear(),
        billMonth.getMonth(),
        25
      );

      // If lease starts after the 25th, move to next month's 25th
      if (leaseStart.getDate() >= 25) {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      const period = {
        start: format(startDate, "MMM d"),
        end: format(endDate, "MMM d"),
        isPartial: true,
      };

      console.log("Returning period:", period);
      return period;
    }

    console.log("Returning default period");
    return defaultPeriod(bill);
  };

  const renderLeaseInfo = () => {
    if (
      !bill.roomId?.tenant?.leaseStartDate ||
      !bill.roomId?.tenant?.leaseEndDate
    ) {
      return null; // Don't render the lease info section if data is missing
    }

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          marginBottom: "24px",
          backgroundColor: "#f8f9fa",
          padding: "8px",
          borderRadius: "8px",
        }}
      >
        <AccessTimeIcon sx={{ color: "#666", fontSize: "1rem" }} />
        <Typography variant="caption" sx={{ color: "#666" }}>
          Lease:{" "}
          {format(new Date(bill.roomId.tenant.leaseStartDate), "MMM d, yyyy")} -{" "}
          {format(new Date(bill.roomId.tenant.leaseEndDate), "MMM d, yyyy")}
        </Typography>
      </Box>
    );
  };

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "300px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!bill) return <div>No current bill found</div>;

  // Find the bank details from the THAI_BANKS object using landlord's bankCode
  const bankDetails =
    THAI_BANKS[
      Object.keys(THAI_BANKS).find(
        (key) =>
          THAI_BANKS[key].code === bill.roomId.floor.building.createdBy.bankCode
      )
    ];

  return (
    <Box
      sx={{
        maxWidth: "100%",
        margin: "0 auto",
        padding: "16px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          padding: "20px",
          borderRadius: "16px",
          backgroundColor: "white",
          marginBottom: "16px",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            textAlign: "center",
            color: "#2C3639",
            fontWeight: "600",
            marginBottom: "8px",
          }}
        >
          Room {bill.roomId.roomNumber}
        </Typography>

        <Typography
          variant="subtitle1"
          sx={{
            textAlign: "center",
            color: "#666",
            marginBottom: "8px",
          }}
        >
          Bill for {format(new Date(bill.month), "MMMM yyyy")}
        </Typography>

        {/* Lease Period Info */}
        {renderLeaseInfo()}

        <Box sx={{ marginBottom: "24px" }}>
          <Typography
            variant="subtitle1"
            sx={{
              color: "#2C3639",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            Payment Details
          </Typography>

          <Box sx={{ display: "grid", gap: "12px" }}>
            {/* Due Date */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Due Date
              </Typography>
              <Typography variant="body2">
                {format(new Date(bill.dueDate), "MMM d, yyyy")}
              </Typography>
            </Box>

            {/* Room Rent */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                padding: "8px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Room Rent
                </Typography>
                <Typography variant="body2">
                  ฿{bill.actualRentAmount.toLocaleString()}
                </Typography>
              </Box>
              {/* Rental Period */}
              {(() => {
                const period = getRentalPeriod(bill);
                return (
                  <Typography
                    variant="caption"
                    sx={{
                      color: period.isPartial
                        ? "warning.main"
                        : "text.secondary",
                      mt: 0.5,
                    }}
                  >
                    {period.isPartial ? "Partial month: " : "Period: "}
                    {period.start} - {period.end}
                  </Typography>
                );
              })()}
            </Box>

            {/* Water */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                padding: "8px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Water
                </Typography>
                <Typography variant="body2">
                  ฿{bill.waterAmount.toLocaleString()}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  mt: 0.5,
                }}
              >
                {bill.waterUsage} units * {bill.waterRate}
              </Typography>
            </Box>

            {/* Electricity */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                padding: "8px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Electricity
                </Typography>
                <Typography variant="body2">
                  ฿{bill.electricityAmount.toLocaleString()}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  mt: 0.5,
                }}
              >
                {bill.electricityUsage} units * {bill.electricityRate}
              </Typography>
            </Box>

            {/* Additional Fees */}
            {bill.additionalFees?.map((fee, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {fee.name}
                </Typography>
                <Typography variant="body2">
                  ฿{fee.price.toLocaleString()}
                </Typography>
              </Box>
            ))}

            {/* Total Amount */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 0",
                marginTop: "8px",
                borderTop: "2px solid #eee",
                borderBottom: "2px solid #eee",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: "600" }}>
                Total Amount
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: "600" }}>
                ฿{bill.totalAmount.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Bank Details Section */}
        <Paper
          elevation={0}
          sx={{
            padding: "20px",
            borderRadius: "12px",
            backgroundColor: "#f8f9fa",
            marginBottom: "24px",
          }}
        >
          {bankDetails && (
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="subtitle1"
                sx={{
                  color: bankDetails.color,
                  fontWeight: "600",
                  marginBottom: "12px",
                }}
              >
                {bankDetails.thai_name}
              </Typography>
              <Typography variant="body2" sx={{ marginBottom: "4px" }}>
                {bankDetails.nice_name}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  backgroundColor: "white",
                  padding: "8px",
                  borderRadius: "8px",
                  marginY: "8px",
                }}
              >
                {bill.roomId.floor.building.createdBy.accountName}
              </Typography>
              <Box
                onClick={() =>
                  handleCopyClick(
                    bill.roomId.floor.building.createdBy.accountNumber
                  )
                }
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  backgroundColor: "white",
                  padding: "8px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  "&:hover": {
                    backgroundColor: "#f0f0f0",
                  },
                  "&:active": {
                    backgroundColor: "#e0e0e0",
                  },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    letterSpacing: "1px",
                    fontFamily: "monospace",
                  }}
                >
                  {formatAccountNumber(
                    bill.roomId.floor.building.createdBy.accountNumber
                  )}
                </Typography>
                <ContentCopyIcon
                  sx={{
                    fontSize: "1rem",
                    color: "#666",
                    ml: 1,
                  }}
                />
              </Box>
            </Box>
          )}
        </Paper>

        {/* Upload Section */}
        {bill.paymentStatus !== "paid" && (
          <Box sx={{ textAlign: "center" }}>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <label htmlFor="file-upload">
              <Button
                component="span"
                variant="contained"
                startIcon={<CloudUploadIcon />}
                disabled={isVerifying}
                sx={{
                  backgroundColor: "#6A7159",
                  borderRadius: "25px",
                  padding: "10px 24px",
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#565c47",
                  },
                }}
              >
                {isVerifying ? "Verifying..." : "Upload Payment Slip"}
              </Button>
            </label>
          </Box>
        )}

        {/* Verification Result */}
        {verificationResult && (
          <Box
            sx={{
              marginTop: "16px",
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: verificationResult.success
                ? "#e8f5e9"
                : "#ffebee",
              color: verificationResult.success ? "#2e7d32" : "#c62828",
              textAlign: "center",
            }}
          >
            {verificationResult.message}
          </Box>
        )}
      </Paper>

      {/* iOS-style notification */}
      <Fade in={copySuccess}>
        <Box
          sx={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "12px 24px",
            borderRadius: "50px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)", // for Safari
          }}
        >
          <CheckCircleIcon sx={{ fontSize: "20px" }} />
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Copied to clipboard
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
}

// Add the THAI_BANKS object at the top of the file
const THAI_BANKS = {
  bbl: {
    code: "002",
    color: "#1e4598",
    thai_name: "ธนาคารกรุงเทพ",
    nice_name: "Bangkok Bank",
  },
  kbank: {
    code: "004",
    color: "#138f2d",
    thai_name: "ธนาคารกสิกรไทย",
    nice_name: "Kasikornbank",
  },
  ktb: {
    code: "006",
    color: "#1ba5e1",
    thai_name: "ธนาคารกรุงไทย",
    nice_name: "Krungthai Bank",
  },
  tmb: {
    code: "011",
    color: "#1279be",
    thai_name: "ธนาคารทหารไทย",
    nice_name: "TMB Bank",
  },
  scb: {
    code: "014",
    color: "#4e2e7f",
    thai_name: "ธนาคารไทยพาณิชย์",
    nice_name: "Siam Commercial Bank",
  },
  bay: {
    code: "025",
    color: "#fec43b",
    thai_name: "ธนาคารกรุงศรีอยุธยา",
    nice_name: "Bank of Ayudhya (Krungsri)",
  },
  gsb: {
    code: "030",
    color: "#eb198d",
    thai_name: "ธนาคารออมสิน",
    nice_name: "Government Savings Bank",
  },
  // Add more banks as needed
};

export default PaymentPage;
