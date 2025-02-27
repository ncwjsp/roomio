"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Paper,
  Typography,
  Grid,
  Button,
  Box,
  Card,
  CardContent,
  IconButton,
  Chip,
  LinearProgress,
  Alert,
  Stack,
  Divider,
  Collapse,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { format, isBefore, addDays, subMonths } from "date-fns";
import { useRouter } from "next/navigation";
import PaymentTracker from "./components/PaymentTracker";

// Loading Spinner Component
const LoadingSpinner = () => {
  return (
    <div className="w-16 h-16 inline-block overflow-hidden bg-transparent">
      <div className="w-full h-full relative transform scale-100 origin-[0_0]">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute left-[30px] top-[16px] w-[3px] h-[8px] rounded-[2px] bg-[#898f63] origin-[2px_20px]"
            style={{
              transform: `rotate(${i * 30}deg)`,
              animation: `spinner-fade 1s linear infinite`,
              animationDelay: `${-0.0833 * (12 - i)}s`
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes spinner-fade {
          0% { opacity: 1 }
          100% { opacity: 0 }
        }
      `}</style>
    </div>
  );
};

const calculateRentAmount = (moveInDate, roomPrice, partialBillingEnabled) => {
  const billingDate = new Date();
  billingDate.setDate(25);

  // If move-in date is after billing date
  if (moveInDate > billingDate) {
    if (!partialBillingEnabled) {
      return roomPrice; // Charge full month
    }

    // Calculate days until next billing date
    const nextBillingDate = new Date(billingDate);
    nextBillingDate.setMonth(billingDate.getMonth() + 1);

    const daysInMonth = new Date(
      billingDate.getFullYear(),
      billingDate.getMonth() + 1,
      0
    ).getDate();
    const daysStayed = Math.ceil(
      (nextBillingDate - moveInDate) / (1000 * 60 * 60 * 24)
    );

    return Math.round((roomPrice / daysInMonth) * daysStayed);
  }

  return roomPrice; // Full month for regular billing
};

export default function BillingPage() {
  // State declarations
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hasBankDetails, setHasBankDetails] = useState(false);
  const [bills, setBills] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedTab, setSelectedTab] = useState(0);
  const [filters, setFilters] = useState({
    building: "",
    floor: "",
    roomNumber: "",
    status: "",
  });
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [tenantsWithoutBills, setTenantsWithoutBills] = useState({
    count: 0,
    hasNewTenants: false,
  });
  const [completionStatus, setCompletionStatus] = useState({
    total: 0,
    completed: 0,
  });
  
  const router = useRouter();

  // Fetch initial data including bank details and available months
  useEffect(() => {
    const initializePage = async () => {
      try {
        // First check bank details
        const bankResponse = await fetch('/api/settings/bank-details');
        if (!bankResponse.ok) {
          throw new Error('Failed to fetch bank details');
        }
        
        const bankData = await bankResponse.json();
        const hasValidBankDetails = Boolean(
          bankData.bankCode?.trim() && 
          bankData.accountNumber?.trim() && 
          bankData.accountName?.trim()
        );
        setHasBankDetails(hasValidBankDetails);

        // Only fetch billing data if bank details are valid
        if (hasValidBankDetails) {
          const monthsResponse = await fetch("/api/bills/months");
          if (!monthsResponse.ok) {
            throw new Error('Failed to fetch available months');
          }
          
          const monthsData = await monthsResponse.json();
          setAvailableMonths(monthsData.months || []);
        }
      } catch (error) {
        console.error('Error initializing page:', error);
        setError(error.message || 'Failed to initialize page');
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, []);

  // Fetch bills function
  const fetchBills = useCallback(async () => {
    if (!selectedMonth || !hasBankDetails) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/bills?month=${selectedMonth}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bills');
      }
      
      const data = await response.json();
      const billsData = Array.isArray(data) ? data : data.bills || [];

      const formattedBills = billsData.map((bill) => {
        // Get the billing cycle date (25th of the previous month)
        const billingCycleDate = new Date(selectedMonth);
        billingCycleDate.setMonth(billingCycleDate.getMonth() - 1);
        billingCycleDate.setDate(25);

        // Get tenant's lease start date
        const leaseStartDate = bill.roomId?.tenant?.leaseStartDate
          ? new Date(bill.roomId.tenant.leaseStartDate)
          : null;

        // Update isMidMonthMoveIn logic to exclude the 25th
        const isMidMonthMoveIn =
          leaseStartDate &&
          (() => {
            const moveInDay = leaseStartDate.getDate();
            const moveInMonth = leaseStartDate.getMonth();
            const moveInYear = leaseStartDate.getFullYear();

            const cycleDay = billingCycleDate.getDate();
            const cycleMonth = billingCycleDate.getMonth();
            const cycleYear = billingCycleDate.getFullYear();

            // If it's exactly on the 25th, it's not a mid-month move-in
            if (moveInDay === 25) return false;

            // Check if move-in is after billing cycle date
            return (
              moveInYear > cycleYear ||
              (moveInYear === cycleYear && moveInMonth > cycleMonth) ||
              (moveInYear === cycleYear &&
                moveInMonth === cycleMonth &&
                moveInDay > cycleDay)
            );
          })();

        // Calculate utility amounts
        const waterAmount = (bill.waterUsage || 0) * (bill.waterRate || 0);
        const electricityAmount =
          (bill.electricityUsage || 0) * (bill.electricityRate || 0);
        const additionalFeesTotal = Array.isArray(bill.additionalFees)
          ? bill.additionalFees.reduce(
              (sum, fee) => sum + (Number(fee.price) || 0),
              0
            )
          : 0;

        // Calculate total
        const totalAmount =
          (bill.actualRentAmount || bill.rentAmount) +
          waterAmount +
          electricityAmount +
          additionalFeesTotal;

        return {
          ...bill,
          id: bill._id,
          roomNumber: bill.roomId?.roomNumber,
          building: bill.roomId?.floor?.building?.name,
          floor: bill.roomId?.floor?.number,
          moveInDate: leaseStartDate,
          isMidMonthMoveIn,
          rentAmount: bill.actualRentAmount || bill.rentAmount,
          waterAmount,
          electricityAmount,
          waterUsage: bill.waterUsage || 0,
          electricityUsage: bill.electricityUsage || 0,
          totalAmount,
          status: bill.status,
          dueDate: bill.dueDate,
          isLate: bill.dueDate
            ? isBefore(new Date(bill.dueDate), new Date())
            : false,
          lateCharge: bill.lateCharge || 0,
          isPartialBill: bill.rentAmount !== bill.actualRentAmount,
        };
      });

      setBills(formattedBills);
      setCompletionStatus({
        total: formattedBills.length,
        completed: formattedBills.filter((bill) => bill.status === "completed")
          .length,
      });
    } catch (error) {
      console.error('Error fetching bills:', error);
      setError(error.message || 'Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, hasBankDetails]);

  // Fetch bills when month changes
  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  useEffect(() => {
    if (bills.length > 0) {
      const uniqueBuildings = [
        ...new Set(bills.map((bill) => bill.building).filter(Boolean)),
      ];
      setBuildings(uniqueBuildings.sort());

      // Extract floor numbers from room numbers
      const uniqueFloors = [
        ...new Set(
          bills
            .map((bill) => {
              const match = bill.roomNumber?.match(/[A-Z](\d)(\d{2})/);
              return match ? match[1] : null;
            })
            .filter(Boolean)
        ),
      ];
      setFloors(uniqueFloors.sort((a, b) => a - b));
    }
  }, [bills]);

  const handleMonthChange = (event) => {
    const [year, month] = event.target.value.split("-");
    const newDate = new Date(parseInt(year), parseInt(month) - 1, 1); // Add day 1
    setSelectedMonth(format(newDate, "yyyy-MM"));
  };

  const handleCreateBills = async () => {
    try {
      // Format the date properly for the selected month
      const [year, month] = selectedMonth.split("-");
      const billingDate = new Date(parseInt(year), parseInt(month) - 1, 25);
      
      // Ensure the date is valid
      if (isNaN(billingDate.getTime())) {
        throw new Error("Invalid billing date");
      }

      const response = await fetch("/api/bills/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          billingDate: format(billingDate, "yyyy-MM-dd"),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create bills");
      }

      await fetchBills(); // Refresh bills after creation
      setSuccess("Bills created successfully!");
    } catch (error) {
      console.error("Error creating bills:", error);
      setError(error.message);
    }
  };

  const handleEditBill = (billId) => {
    router.push(`/billings/${billId}`);
  };

  const handleSendBills = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bills/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bills: bills.filter(
            (bill) =>
              bill.status === "completed" && bill.paymentStatus === "null"
          ),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update bills");
      }

      const result = await response.json();
      setSuccess("Bills have been marked as pending payment!");
      await fetchBills();
    } catch (error) {
      console.error("Error updating bills:", error);
      setError("Failed to update bills");
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = bills.filter((bill) => {
    const matchesBuilding =
      !filters.building || bill.building === filters.building;

    // Extract floor number from room number for comparison
    const billFloorMatch = bill.roomNumber?.match(/[A-Z](\d)(\d{2})/);
    const billFloor = billFloorMatch ? billFloorMatch[1] : null;
    const matchesFloor = !filters.floor || billFloor === filters.floor;

    const matchesRoom =
      !filters.roomNumber ||
      bill.roomNumber.toLowerCase().includes(filters.roomNumber.toLowerCase());
    const matchesStatus =
      !filters.status ||
      (filters.status === "filled"
        ? bill.status === "completed"
        : bill.status !== "completed");

    return matchesBuilding && matchesFloor && matchesRoom && matchesStatus;
  });

  const isCurrentMonth = (date) => {
    const now = new Date();
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  // Add a new function to check for new tenants
  const checkForNewTenants = async () => {
    try {
      const response = await fetch(
        `/api/tenant/check-new?month=${selectedMonth}`
      );
      const data = await response.json();
      setTenantsWithoutBills({
        count: data.count || 0,
        hasNewTenants: data.hasNewTenants || false,
      });
    } catch (error) {
      console.error("Error checking for new tenants:", error);
      setTenantsWithoutBills({ count: 0, hasNewTenants: false });
    }
  };

  useEffect(() => {
    if (selectedMonth) {
      checkForNewTenants();
    }
  }, [selectedMonth]);

  // Add this helper function
  const isMidMonthMoveIn = (moveInDate, billingDate) => {
    const moveIn = new Date(moveInDate);
    const billing = new Date(billingDate);
    billing.setDate(25); // Set to billing cycle date

    // If move-in is after billing date of current month
    if (moveIn > billing) {
      return true;
    }
    return false;
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleUpdatePaymentStatus = (billId, newStatus) => {
    setBills(
      bills.map((bill) =>
        bill.id === billId ? { ...bill, paymentStatus: newStatus } : bill
      )
    );
  };

  // Add this useEffect to clear success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '80vh',
          width: '100%'
        }}
      >
        <LoadingSpinner />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert 
          severity="error"
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      </Container>
    );
  }

  if (!hasBankDetails) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert 
          severity="warning"
          sx={{ 
            mb: 2,
            '& .MuiAlert-icon': {
              color: '#889F63'
            }
          }}
        >
          Please set up your bank account details before using the billing system.
        </Alert>
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}
        >
          <Typography variant="h6" gutterBottom>
            Bank Account Setup Required
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            To use the billing system, you need to configure your bank account details first.
            This ensures smooth payment processing for your tenants.
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push('/setting')}
            sx={{
              bgcolor: '#898F63',
              '&:hover': {
                bgcolor: '#7A8F53',
              },
            }}
          >
            Configure Bank Account
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs value={selectedTab} onChange={handleTabChange}>
            <Tab label="Bills" />
            <Tab label="Payment Tracking" />
          </Tabs>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: "600" }}
            >
              Billing Management{" "}
              <span style={{ fontSize: "18px" }}>(25th of each month)</span>
            </Typography>

            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Select Month</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  label="Select Month"
                  size="small"
                >
                  {availableMonths.map((option) => (
                    <MenuItem key={option} value={option}>
                      {format(new Date(option + "-01"), "MMMM yyyy")}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {console.log("Current state:", {
                isCurrentMonth: isCurrentMonth(new Date(selectedMonth + "-01")),
                tenantsWithoutBills,
                selectedMonth,
              })}
              {isCurrentMonth(new Date(selectedMonth + "-01")) &&
                tenantsWithoutBills.hasNewTenants &&
                tenantsWithoutBills.count > 0 && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateBills}
                    sx={{
                      bgcolor: "#898f63",
                      "&:hover": { bgcolor: "#707454" },
                      borderRadius: "12px",
                    }}
                  >
                    Create Bills for New Tenants ({tenantsWithoutBills.count})
                  </Button>
                )}
            </Box>
          </Stack>
        </Box>

        {selectedTab === 0 ? (
          <>
            <Card sx={{ mb: 3, borderRadius: "12px" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Filters
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Building</InputLabel>
                      <Select
                        value={filters.building}
                        label="Building"
                        onChange={(e) =>
                          setFilters({ ...filters, building: e.target.value })
                        }
                      >
                        <MenuItem value="">All Buildings</MenuItem>
                        {buildings.map((building) => (
                          <MenuItem key={building} value={building}>
                            {building}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Floor</InputLabel>
                      <Select
                        value={filters.floor}
                        label="Floor"
                        onChange={(e) =>
                          setFilters({ ...filters, floor: e.target.value })
                        }
                      >
                        <MenuItem value="">All Floors</MenuItem>
                        {floors.map((floor) => (
                          <MenuItem key={floor} value={floor}>
                            Floor {floor}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Search Room"
                      value={filters.roomNumber}
                      onChange={(e) =>
                        setFilters({ ...filters, roomNumber: e.target.value })
                      }
                      placeholder="Enter room number"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filters.status}
                        label="Status"
                        onChange={(e) =>
                          setFilters({ ...filters, status: e.target.value })
                        }
                      >
                        <MenuItem value="">All Status</MenuItem>
                        <MenuItem value="filled">Filled</MenuItem>
                        <MenuItem value="unfilled">Unfilled</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3, borderRadius: "12px" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Completion Status
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {completionStatus.completed} / {completionStatus.total}{" "}
                    rooms filled
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={
                      (completionStatus.completed / completionStatus.total) *
                      100
                    }
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: "#f5f5f5",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: "#898f63",
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>

            <Grid container spacing={3}>
              {filteredBills.map((bill) => (
                <Grid item xs={12} md={6} lg={4} key={bill.id}>
                  <Card
                    sx={{
                      borderRadius: "16px",
                      transition: "all 0.3s ease",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      overflow: "visible",
                      "&:hover": {
                        transform: "translateY(-8px)",
                        boxShadow: "0 12px 20px -10px rgba(0,0,0,0.2)",
                      },
                      ...(bill.isMidMonthMoveIn && {
                        "&:before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: "4px",
                          background:
                            "linear-gradient(90deg, #898f63 0%, #b5bd89 100%)",
                          borderRadius: "16px 16px 0 0",
                        },
                      }),
                    }}
                  >
                    <CardContent
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                      }}
                    >
                      <Stack spacing={2} sx={{ flex: 1 }}>
                        <Box>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ fontWeight: 600 }}
                          >
                            Building {bill.building} - Room {bill.roomNumber}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ flexWrap: "wrap", gap: 1 }}
                          >
                            <Chip
                              label={
                                bill.status.charAt(0).toUpperCase() +
                                bill.status.slice(1)
                              }
                              color={
                                bill.status === "completed"
                                  ? "success"
                                  : "warning"
                              }
                              size="small"
                              sx={{
                                borderRadius: "8px",
                                fontWeight: 500,
                                backgroundColor:
                                  bill.status === "completed"
                                    ? "#1b5e20"
                                    : "#ed6c02",
                                "& .MuiChip-label": {
                                  color: "white",
                                },
                              }}
                            />
                            {bill.paymentStatus === "pending" && (
                              <Chip
                                label="Payment Pending"
                                color="info"
                                size="small"
                                sx={{
                                  borderRadius: "8px",
                                  fontWeight: 500,
                                  backgroundColor: "#FF8A23",
                                  "& .MuiChip-label": {
                                    color: "white",
                                  },
                                }}
                              />
                            )}
                            {bill.isMidMonthMoveIn && (
                              <Chip
                                label="Mid-Month Move-in"
                                size="small"
                                sx={{
                                  borderRadius: "8px",
                                  backgroundColor: "#898f63",
                                  fontWeight: 500,
                                  "& .MuiChip-label": {
                                    color: "white",
                                  },
                                }}
                              />
                            )}
                          </Stack>
                        </Box>

                        <Box>
                          <Typography
                            color="text.secondary"
                            variant="body2"
                            sx={{ mb: 0.5 }}
                          >
                            Room Price
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, color: "#2c3e50" }}
                          >
                            ฿{bill.rentAmount?.toLocaleString()}
                          </Typography>
                          {bill.isMidMonthMoveIn && bill.moveInDate && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: "inline-block",
                                background:
                                  "linear-gradient(90deg, #898f63 0%, #b5bd89 100%)",
                                color: "white",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                mt: 1,
                                fontWeight: 500,
                              }}
                            >
                              Move-in:{" "}
                              {format(new Date(bill.moveInDate), "MMM d, yyyy")}
                            </Typography>
                          )}
                        </Box>

                        <Divider />

                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography color="text.secondary" variant="body2">
                              Water Usage
                            </Typography>
                            <Typography variant="h6">
                              {bill.waterRate
                                ? `฿${(
                                    bill.waterUsage * bill.waterRate
                                  ).toLocaleString()}`
                                : "Rate not set"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {bill.waterUsage} units
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography color="text.secondary" variant="body2">
                              Electricity Usage
                            </Typography>
                            <Typography variant="h6">
                              {bill.electricityRate
                                ? `฿${(
                                    bill.electricityUsage * bill.electricityRate
                                  ).toLocaleString()}`
                                : "Rate not set"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {bill.electricityUsage} units
                            </Typography>
                          </Grid>
                        </Grid>

                        {bill.additionalFees &&
                          bill.additionalFees.length > 0 && (
                            <>
                              <Divider />
                              <Box>
                                <Typography
                                  color="text.secondary"
                                  variant="body2"
                                  gutterBottom
                                >
                                  Additional Fees
                                </Typography>
                                <Stack spacing={1}>
                                  {bill.additionalFees.map((fee, index) => (
                                    <Box
                                      key={index}
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        bgcolor: "background.default",
                                        p: 1,
                                        borderRadius: 1,
                                      }}
                                    >
                                      <Typography variant="body2">
                                        {fee.name}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        sx={{ fontWeight: "medium" }}
                                      >
                                        ฿
                                        {(
                                          Number(fee.price) || 0
                                        ).toLocaleString()}
                                      </Typography>
                                    </Box>
                                  ))}
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      mt: 1,
                                      pt: 1,
                                      borderTop:
                                        "1px dashed rgba(0, 0, 0, 0.12)",
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      Total Additional Fees
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: "medium" }}
                                    >
                                      ฿
                                      {bill.additionalFees
                                        .reduce(
                                          (sum, fee) =>
                                            sum + (Number(fee.price) || 0),
                                          0
                                        )
                                        .toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Box>
                            </>
                          )}

                        <Divider />

                        <Box sx={{ mt: 2 }}>
                          <Typography color="text.secondary" variant="body2">
                            Total Amount
                          </Typography>
                          <Typography variant="h6" color="black" fontWeight={600}>
                            ฿
                            {(
                              bill.rentAmount +
                              (bill.waterRate
                                ? bill.waterUsage * bill.waterRate
                                : 0) +
                              (bill.electricityRate
                                ? bill.electricityUsage * bill.electricityRate
                                : 0)
                            ).toLocaleString()}
                          </Typography>
                        </Box>
                      </Stack>

                      <Button
                        variant="outlined"
                        startIcon={
                          bill.status === "completed" ? (
                            <VisibilityIcon />
                          ) : (
                            <EditIcon />
                          )
                        }
                        onClick={() => handleEditBill(bill.id)}
                        fullWidth
                        sx={{
                          mt: 2,
                          borderRadius: "8px",
                          borderColor: "#898f63",
                          color: "#898f63",
                          "&:hover": {
                            borderColor: "#707454",
                            bgcolor: "rgba(137, 143, 99, 0.04)",
                          },
                        }}
                      >
                        {bill.status === "completed"
                          ? "View Details"
                          : "Fill Details"}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {filteredBills.length === 0 && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography color="text.secondary">
                  No bills found matching the current filters
                </Typography>
              </Box>
            )}

            {bills.length > 0 && (
              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  onClick={handleSendBills}
                  disabled={
                    completionStatus.completed !== completionStatus.total
                  }
                  sx={{
                    bgcolor: "#898f63",
                    "&:hover": { bgcolor: "#707454" },
                    borderRadius: "12px",
                  }}
                >
                  Send Bills to Tenants
                </Button>
              </Box>
            )}
          </>
        ) : (
          <PaymentTracker
            bills={filteredBills}
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
          />
        )}
      </Box>

      {success && (
        <Alert
          severity="success"
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
        >
          {success}
        </Alert>
      )}
    </Container>
  );
}
