import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  Button,
  Stack,
  Divider,
} from "@mui/material";
import { format } from "date-fns";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useRouter } from "next/navigation";

const BillCard = ({ bill }) => {
  const router = useRouter();

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Typography variant="h6" component="div">
            Room {bill.roomId?.roomNumber || "Loading..."}
          </Typography>
          <Stack direction="row" spacing={1}>
            {bill.status === "completed" && (
              <Chip
                label="Completed"
                size="small"
                sx={{
                  bgcolor: "#898f63",
                  color: "white",
                  fontWeight: "medium",
                }}
              />
            )}
            {bill.paymentStatus === "pending" && (
              <Chip
                label="Payment Pending"
                size="small"
                sx={{
                  bgcolor: "#ed6c02",
                  color: "white",
                }}
              />
            )}
          </Stack>
        </Box>

        <Typography color="text.secondary" gutterBottom>
          Room Price
        </Typography>
        <Typography variant="h5" sx={{ mb: 2 }}>
          ฿{bill.rentAmount?.toLocaleString()}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontStyle: "italic", mb: 2 }}
        >
          Move-in: {format(new Date(bill.roomId?.tenant?.leaseStartDate), "MMM d, yyyy")}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography color="text.secondary" variant="body2">
              Water Usage
            </Typography>
            <Typography variant="h6">฿{bill.waterAmount?.toLocaleString()}</Typography>
            <Typography variant="caption" color="text.secondary">
              {bill.waterUsage} units
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography color="text.secondary" variant="body2">
              Electricity Usage
            </Typography>
            <Typography variant="h6">
              ฿{bill.electricityAmount?.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {bill.electricityUsage} units
            </Typography>
          </Grid>
        </Grid>

        {/* Additional Fees Section */}
        {bill.additionalFees?.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ my: 1 }} />
            <Typography color="text.secondary" variant="body2" gutterBottom>
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
                  }}
                >
                  <Typography variant="body2">{fee.name}</Typography>
                  <Typography variant="body2">
                    ฿{Number(fee.price).toLocaleString()}
                  </Typography>
                </Box>
              ))}
              {/* Total Additional Fees */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  pt: 1,
                  borderTop: "1px dashed rgba(0, 0, 0, 0.12)",
                }}
              >
                <Typography variant="body2" fontWeight="medium">
                  Total Additional Fees
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  ฿{bill.additionalFees.reduce((sum, fee) => sum + Number(fee.price || 0), 0).toLocaleString()}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            Total Amount
          </Typography>
          <Typography variant="h6" color="primary">
            ฿{bill.totalAmount?.toLocaleString()}
          </Typography>
        </Box>

        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={() => router.push(`/billings/${bill._id}`)}
            sx={{
              borderColor: "#898f63",
              color: "#898f63",
              "&:hover": {
                borderColor: "#707454",
                bgcolor: "rgba(137, 143, 99, 0.04)",
              },
            }}
          >
            View Details
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default BillCard;
