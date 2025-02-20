import {
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Stack,
  Box,
  FormControl,
  Select,
  MenuItem,
  Modal,
  IconButton,
  Link,
  Paper,
} from "@mui/material";
import { format } from "date-fns";
import PaidIcon from "@mui/icons-material/Paid";
import PendingIcon from "@mui/icons-material/Pending";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useMemo } from "react";

const PaymentTracker = ({ bills, onUpdatePaymentStatus, buildings = [] }) => {
  const [openSlip, setOpenSlip] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);

  // Filter states
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Get unique floors for selected building
  const availableFloors = useMemo(() => {
    if (selectedBuilding === "all") {
      return [...new Set(bills.map((bill) => bill.roomId?.floor?.name))].filter(
        Boolean
      );
    }
    return [
      ...new Set(
        bills
          .filter(
            (bill) => bill.roomId?.floor?.building?.name === selectedBuilding
          )
          .map((bill) => bill.roomId?.floor?.name)
      ),
    ].filter(Boolean);
  }, [bills, selectedBuilding]);

  // Filter bills
  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const buildingMatch =
        selectedBuilding === "all" ||
        bill.roomId?.floor?.building?.name === selectedBuilding;
      const floorMatch =
        selectedFloor === "all" || bill.roomId?.floor?.name === selectedFloor;
      const statusMatch =
        selectedStatus === "all" || bill.paymentStatus === selectedStatus;
      return buildingMatch && floorMatch && statusMatch;
    });
  }, [bills, selectedBuilding, selectedFloor, selectedStatus]);

  const handleStatusChange = async (billId, newStatus) => {
    try {
      const response = await fetch(`/api/bills/${billId}/payment-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentStatus: newStatus,
          paymentDate: newStatus === "paid" ? new Date().toISOString() : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update payment status");
      onUpdatePaymentStatus(billId, newStatus);
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  const handleOpenSlip = (bill, slipUrl) => {
    setSelectedBill(bill);
    setSelectedSlip(slipUrl);
    setOpenSlip(true);
  };

  const handleCloseSlip = () => {
    setOpenSlip(false);
    setSelectedSlip(null);
    setSelectedBill(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return <PaidIcon />;
      case "pending":
        return <PendingIcon />;
      default:
        return <SendIcon />;
    }
  };

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6" sx={{ fontSize: "1.1rem", fontWeight: 500 }}>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <Select
                  value={selectedBuilding}
                  onChange={(e) => {
                    setSelectedBuilding(e.target.value);
                    setSelectedFloor("all"); // Reset floor when building changes
                  }}
                  sx={{
                    ".MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(0, 0, 0, 0.15)",
                    },
                    borderRadius: 1.5,
                  }}
                >
                  <MenuItem value="all">All Buildings</MenuItem>
                  {[
                    ...new Set(
                      bills.map((bill) => bill.roomId?.floor?.building?.name)
                    ),
                  ]
                    .filter(Boolean)
                    .map((building) => (
                      <MenuItem key={building} value={building}>
                        {building}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <Select
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(e.target.value)}
                  sx={{
                    ".MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(0, 0, 0, 0.15)",
                    },
                    borderRadius: 1.5,
                  }}
                >
                  <MenuItem value="all">All Floors</MenuItem>
                  {availableFloors.map((floor) => (
                    <MenuItem key={floor} value={floor}>
                      {floor}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  sx={{
                    ".MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(0, 0, 0, 0.15)",
                    },
                    borderRadius: 1.5,
                  }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="null">Not Sent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        {filteredBills.map((bill) => (
          <Grid item xs={12} md={6} lg={4} key={bill.id}>
            <Card sx={{ height: "100%", p: 1, borderRadius: 2 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: "1.1rem", fontWeight: 500 }}
                  >
                    Room {bill.roomNumber}
                  </Typography>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body1" color="text.secondary">
                      {format(new Date(bill.month), "MMMM yyyy")}
                    </Typography>
                    <Typography
                      variant="h6"
                      color="black"
                      sx={{ fontWeight: 500 }}
                    >
                      ฿{bill.totalAmount.toLocaleString()}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      size="small"
                      icon={getStatusIcon(bill.paymentStatus)}
                      label={
                        bill.paymentStatus === "null"
                          ? "Not Sent"
                          : bill.paymentStatus
                      }
                      color={getStatusColor(bill.paymentStatus)}
                      sx={{
                        bgcolor:
                          bill.paymentStatus === "paid" ? "#4caf50" : undefined,
                        color:
                          bill.paymentStatus === "paid" ? "white" : undefined,
                        textTransform: "capitalize",
                        "& .MuiChip-label": {
                          color: "white",
                        },
                      }}
                    />
                    {bill.status === "completed" && (
                      <FormControl size="small">
                        <Select
                          value={bill.paymentStatus}
                          onChange={(e) =>
                            handleStatusChange(bill.id, e.target.value)
                          }
                          sx={{
                            minWidth: 120,
                            ".MuiOutlinedInput-notchedOutline": {
                              borderColor: "rgba(0, 0, 0, 0.15)",
                            },
                          }}
                        >
                          <MenuItem value="null">Not Sent</MenuItem>
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="paid">Paid</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </Stack>

                  {bill.paymentStatus === "paid" && (
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        Paid on:{" "}
                        {format(new Date(bill.paymentDate), "MMM d, yyyy")}
                      </Typography>
                      {bill.slipData && (
                        <Link
                          component="button"
                          variant="body2"
                          onClick={() => handleOpenSlip(bill, bill.slipData)}
                          sx={{
                            alignSelf: "flex-start",
                            textTransform: "uppercase",
                            color: "#1976d2",
                            textDecoration: "none",
                            "&:hover": {
                              textDecoration: "underline",
                            },
                          }}
                        >
                          VIEW SLIP
                        </Link>
                      )}
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Modal
        open={openSlip}
        onClose={handleCloseSlip}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            position: "relative",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            pt: 5,
            borderRadius: 2,
            maxWidth: "90vw",
            maxHeight: "90vh",
          }}
        >
          <IconButton
            onClick={handleCloseSlip}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>

          {selectedBill && (
            <Typography variant="subtitle1" gutterBottom>
              Payment Slip - Room {selectedBill.roomNumber}
            </Typography>
          )}

          <img
            src={selectedSlip}
            alt="Payment Slip"
            style={{
              maxWidth: "100%",
              maxHeight: "calc(90vh - 100px)",
              objectFit: "contain",
            }}
          />
        </Box>
      </Modal>
    </Stack>
  );
};

export default PaymentTracker;
