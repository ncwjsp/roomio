"use client";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Box,
  Divider,
} from "@mui/material";

const Register = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    lineConfig: {
      channelAccessToken: "",
      channelSecret: "",
      liffIds: {
        parcels: "",
        reports: "",
        billing: "",
        cleaning: "",
        maintenance: "",
        announcement: "",
        schedule: "",
        tasks: "",
      },
    },
  });
  const [error, setError] = useState(null);

  const steps = ["Account Information", "LINE Configuration"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("line.")) {
      const [_, ...parts] = name.split(".");
      if (parts.length === 1) {
        setFormData((prev) => ({
          ...prev,
          lineConfig: {
            ...prev.lineConfig,
            [parts[0]]: value,
          },
        }));
      } else if (parts.length === 2 && parts[0] === "liffIds") {
        setFormData((prev) => ({
          ...prev,
          lineConfig: {
            ...prev.lineConfig,
            liffIds: {
              ...prev.lineConfig.liffIds,
              [parts[1]]: value,
            },
          },
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      setCurrentStep(1);
      setError(null);
    }
  };

  const handleBack = () => {
    setCurrentStep(0);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep === 0) {
      handleNext();
      return;
    }

    try {
      // Create rich menus first
      const richMenuResponse = await fetch("/api/richmenu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelAccessToken: formData.lineConfig.channelAccessToken,
          channelSecret: formData.lineConfig.channelSecret,
          liffIds: formData.lineConfig.liffIds,
        }),
      });

      const { tenantRichMenuId, staffRichMenuId } =
        await richMenuResponse.json();

      // Register user with rich menu IDs
      const response = await fetch("/api/auth/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          lineConfig: {
            ...formData.lineConfig,
            tenantRichMenuId,
            staffRichMenuId,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/login");
      } else {
        setError(data.error || "Failed to register");
        if (data.error === "Email is already in use") {
          setCurrentStep(0);
        }
      }
    } catch (err) {
      setError("Failed to register. Please try again.");
    }
  };

  return (
    <Container
      component="main"
      maxWidth="lg"
      sx={{
        py: 4,
        minHeight: "100vh", // Full viewport height
        display: "flex",
        alignItems: "center", // Vertical center
        justifyContent: "center", // Horizontal center
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          width: "100%", // Take full width of container
          maxWidth: "1000px", // Limit maximum width
        }}
      >
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Room<span style={{ color: "black" }}>io</span>
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Apartment Management System
          </Typography>
        </Box>

        <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Typography color="error" sx={{ mb: 2, textAlign: "center" }}>
            {error}
          </Typography>
        )}

        <form onSubmit={handleSubmit}>
          {currentStep === 0 ? (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="LINE Channel Access Token"
                  name="line.channelAccessToken"
                  value={formData.lineConfig.channelAccessToken}
                  onChange={handleChange}
                  required
                  helperText="Found in LINE Developers Console → Messaging API → Channel access token"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="LINE Channel Secret"
                  name="line.channelSecret"
                  value={formData.lineConfig.channelSecret}
                  onChange={handleChange}
                  required
                  helperText="Found in LINE Developers Console → Basic settings → Channel secret"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    LIFF IDs Configuration
                  </Typography>
                </Divider>
              </Grid>

              {Object.keys(formData.lineConfig.liffIds).map((key, index) => (
                <Grid item xs={12} sm={6} key={key}>
                  <TextField
                    fullWidth
                    label={`${
                      key.charAt(0).toUpperCase() + key.slice(1)
                    } LIFF ID`}
                    name={`line.liffIds.${key}`}
                    value={formData.lineConfig.liffIds[key]}
                    onChange={handleChange}
                    required
                    helperText={`LIFF ID for ${
                      key.charAt(0).toUpperCase() + key.slice(1)
                    } feature`}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            {currentStep === 1 && (
              <Button onClick={handleBack} variant="outlined">
                Back
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: "#898f63",
                "&:hover": { bgcolor: "#707454" },
                ml: currentStep === 1 ? "auto" : 0,
                width: currentStep === 0 ? "100%" : "auto",
              }}
            >
              {currentStep === 0 ? "Next" : "Register"}
            </Button>
          </Box>
        </form>

        <Typography
          variant="body2"
          color="textSecondary"
          align="center"
          sx={{ mt: 3 }}
        >
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#898f63" }}>
            Login
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
};

export default Register;
