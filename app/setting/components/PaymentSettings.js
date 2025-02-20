import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";

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
};

const PaymentSettings = () => {
  const [bankDetails, setBankDetails] = useState({
    bankCode: "",
    accountNumber: "",
    accountName: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const response = await fetch("/api/settings/bank-details");
      const data = await response.json();
      if (response.ok) {
        setBankDetails(data);
      }
    } catch (error) {
      setError("Failed to load bank details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/settings/bank-details", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bankDetails),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        throw new Error("Failed to update bank details");
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBankDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
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
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Payment Settings
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Bank</InputLabel>
              <Select
                name="bankCode"
                value={bankDetails.bankCode}
                onChange={handleChange}
                required
                label="Bank"
              >
                {Object.entries(THAI_BANKS).map(([key, bank]) => (
                  <MenuItem key={key} value={bank.code}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          backgroundColor: bank.color,
                          borderRadius: "50%",
                        }}
                      />
                      <Typography>{bank.thai_name}</Typography>
                      <Typography color="textSecondary" sx={{ ml: 1 }}>
                        ({bank.nice_name})
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              name="accountNumber"
              label="Account Number"
              value={bankDetails.accountNumber}
              onChange={handleChange}
              required
              inputProps={{
                pattern: "[0-9]*",
                maxLength: 15,
              }}
              helperText="Enter your bank account number"
            />

            <TextField
              name="accountName"
              label="Account Name (English)"
              value={bankDetails.accountName}
              onChange={handleChange}
              required
              helperText="Enter the name as it appears on your bank account"
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Bank details updated successfully
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              sx={{ 
                mt: 2,
                backgroundColor: "#898F63",
                color: "white",
                "&:hover": {
                  backgroundColor: "#777c54"
                }
              }}
            >
              Save Bank Details
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default PaymentSettings;
