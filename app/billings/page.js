"use client";
import { useState, useEffect } from "react";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

const BillingPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completionStatus, setCompletionStatus] = useState({
    total: 0,
    completed: 0,
  });
  const [buildings, setBuildings] = useState([]);
  const [filters, setFilters] = useState({
    building: "",
    floor: "",
    roomNumber: "",
    status: "",
  });
  const [floors, setFloors] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchBills();
  }, [currentMonth]);

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
              // Extract the floor number from the room number (e.g., "A103" -> "1")
              const match = bill.roomNumber?.match(/[A-Z](\d)(\d{2})/);
              return match ? parseInt(match[1], 10) : null;
            })
            .filter((floor) => floor !== null)
        ),
      ];

      console.log("Extracted floors:", uniqueFloors);
      setFloors(uniqueFloors.sort((a, b) => a - b));
    }
  }, [bills]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bills");
      const data = await response.json();

      // Handle both formats (array or object with bills property)
      const billsData = Array.isArray(data) ? data : data.bills || [];

      console.log("Raw bill data example:", {
        roomId: billsData[0]?.roomId,
        floor: billsData[0]?.roomId?.floor,
        floorNumber: billsData[0]?.roomId?.floor?.number,
      });

      const formattedBills = billsData.map((bill) => {
        // Ensure we have a valid floor number
        const floorNumber = bill.roomId?.floor?.number;
        console.log("Raw floor number:", floorNumber, typeof floorNumber);

        const additionalFeesTotal = Array.isArray(bill.additionalFees)
          ? bill.additionalFees.reduce(
              (sum, fee) => sum + (Number(fee.price) || 0),
              0
            )
          : 0;

        return {
          id: bill._id,
          roomNumber: bill.roomId?.roomNumber,
          building: bill.roomId?.floor?.building?.name,
          floor: floorNumber ? parseInt(floorNumber, 10) : null, // Parse floor number more carefully
          roomPrice: bill.rentAmount,
          waterUsage: bill.waterUsage || 0,
          waterAmount: (bill.waterUsage || 0) * bill.waterRate,
          electricityUsage: bill.electricityUsage || 0,
          electricityAmount:
            (bill.electricityUsage || 0) * bill.electricityRate,
          additionalFees: Array.isArray(bill.additionalFees)
            ? bill.additionalFees
            : [],
          totalAmount:
            bill.rentAmount +
            (bill.waterUsage || 0) * bill.waterRate +
            (bill.electricityUsage || 0) * bill.electricityRate +
            additionalFeesTotal,
          status: bill.status,
        };
      });

      console.log(
        "Formatted bills with floors:",
        formattedBills.map((b) => ({
          floor: b.floor,
          rawFloor: b.roomId?.floor?.number,
        }))
      );

      setBills(formattedBills);
      setCompletionStatus({
        total: formattedBills.length,
        completed: formattedBills.filter((bill) => bill.status === "completed")
          .length,
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching bills:", error);
      setError("Failed to fetch bills");
      setLoading(false);
    }
  };

  const handleCreateBills = async () => {
    try {
      const response = await fetch("/api/bills/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month: format(currentMonth, "yyyy-MM"),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create bills");
      }

      fetchBills();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleEditBill = (billId) => {
    router.push(`/billings/${billId}`);
  };

  const handleSendBills = async () => {
    try {
      const response = await fetch("/api/bills/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bills }),
      });

      if (!response.ok) {
        throw new Error("Failed to send bills");
      }

      const data = await response.json();
      // Show success message
      alert("Bills sent successfully to tenants!");
    } catch (error) {
      console.error("Error sending bills:", error);
      // Show error message
      alert("Failed to send bills to tenants");
    }
  };

  const filteredBills = bills.filter((bill) => {
    const matchesBuilding =
      !filters.building || bill.building === filters.building;

    // Extract floor from room number for filtering
    const floorMatch = bill.roomNumber?.match(/[A-Z](\d)(\d{2})/);
    const billFloor = floorMatch ? parseInt(floorMatch[1], 10) : null;
    const matchesFloor = !filters.floor || billFloor === Number(filters.floor);

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

  if (loading) {
    return (
      <Box sx={{ width: "100%", mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Typography variant="h4" component="h1" sx={{ fontWeight: "medium" }}>
            Billing Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateBills}
            disabled={bills.length > 0}
            sx={{
              bgcolor: "#898f63",
              "&:hover": { bgcolor: "#707454" },
              borderRadius: "12px",
            }}
          >
            Create Bills for {format(currentMonth, "MMMM yyyy")}
          </Button>
        </Stack>

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

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 3, borderRadius: "12px" }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Completion Status
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                {completionStatus.completed} / {completionStatus.total} rooms
                filled
              </Typography>
              <LinearProgress
                variant="determinate"
                value={
                  (completionStatus.completed / completionStatus.total) * 100
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
                  borderRadius: "12px",
                  transition: "transform 0.2s",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent
                  sx={{ flex: 1, display: "flex", flexDirection: "column" }}
                >
                  <Stack spacing={2} sx={{ height: "100%" }}>
                    <Box>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 2 }}
                      >
                        <Typography variant="h6">
                          Building {bill.building} - Room {bill.roomNumber}
                        </Typography>
                        <Chip
                          label={
                            bill.status === "completed" ? "Complete" : "Pending"
                          }
                          color={
                            bill.status === "completed" ? "success" : "warning"
                          }
                          size="small"
                        />
                      </Stack>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Stack spacing={2}>
                        <Box>
                          <Typography color="text.secondary" variant="body2">
                            Room Price
                          </Typography>
                          <Typography variant="h6">
                            ฿{bill.roomPrice.toLocaleString()}
                          </Typography>
                        </Box>

                        <Divider />

                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography color="text.secondary" variant="body2">
                              Water Usage
                            </Typography>
                            <Typography>
                              ฿{bill.waterAmount.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {bill.waterUsage} units
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography color="text.secondary" variant="body2">
                              Electricity Usage
                            </Typography>
                            <Typography>
                              ฿{bill.electricityAmount.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
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

                        <Box>
                          <Typography color="text.secondary">
                            Total Amount
                          </Typography>
                          <Typography variant="h5" sx={{ color: "#898f63" }}>
                            ฿{bill.totalAmount.toLocaleString()}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

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
                        borderRadius: "8px",
                        borderColor: "#898f63",
                        color: "#898f63",
                        "&:hover": {
                          borderColor: "#707454",
                          bgcolor: "rgba(137, 143, 99, 0.04)",
                        },
                        mt: "auto",
                      }}
                    >
                      {bill.status === "completed"
                        ? "View Details"
                        : "Fill Details"}
                    </Button>
                  </Stack>
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
              disabled={completionStatus.completed !== completionStatus.total}
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
      </Box>
    </Container>
  );
};

export default BillingPage;
