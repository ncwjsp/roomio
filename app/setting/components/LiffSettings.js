"use client";

import { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Alert,
  Paper,
  Grid,
  Typography,
  CircularProgress,
  Box,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import { useSession } from "next-auth/react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

const LiffSettings = () => {
  const { data: session, status } = useSession();
  console.log("Session status:", status);
  console.log("Full session object:", session);
  console.log("User data:", session?.user);

  const [config, setConfig] = useState({
    channelAccessToken: "",
    channelSecret: "",
    liffIds: {
      cleaning: "",
      maintenance: "",
      reports: "",
      parcels: "",
      billing: "",
      announcement: "",
      schedule: "",
      tasks: "",
    },
  });

  const [editMode, setEditMode] = useState({
    channel: false,
    cleaning: false,
    maintenance: false,
    parcels: false,
    billing: false,
    announcement: false,
    schedule: false,
    tasks: false,
  });

  const [tempValues, setTempValues] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [successes, setSuccesses] = useState({});
  const [copySuccess, setCopySuccess] = useState({});

  useEffect(() => {
    if (status === "loading") return;

    if (session?.user?.id) {
      console.log("Using user ID:", session.user.id);
      fetchConfig(session.user.id);
    } else {
      console.log("No user ID found in session");
      setIsLoading(false);
      setErrors((prev) => ({ ...prev, fetch: "Not authenticated" }));
    }
  }, [session, status]);

  const fetchConfig = async (userId) => {
    console.log("Fetching config for user ID:", userId);
    try {
      const response = await fetch(`/api/user/line-config?id=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch configuration");
      }

      const data = await response.json();
      if (data.lineConfig) {
        setConfig({
          channelAccessToken: data.lineConfig.channelAccessToken || "",
          channelSecret: data.lineConfig.channelSecret || "",
          liffIds: {
            cleaning: data.lineConfig.liffIds?.cleaning || "",
            maintenance: data.lineConfig.liffIds?.maintenance || "",
            parcels: data.lineConfig.liffIds?.parcels || "",
            billing: data.lineConfig.liffIds?.billing || "",
            announcement: data.lineConfig.liffIds?.announcement || "",
            schedule: data.lineConfig.liffIds?.schedule || "",
            tasks: data.lineConfig.liffIds?.tasks || "",
          },
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setErrors((prev) => ({
        ...prev,
        fetch: error.message || "Failed to load LINE configuration",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (section) => {
    setTempValues((prev) => ({
      ...prev,
      [section]:
        section === "channel"
          ? {
              channelAccessToken: config.channelAccessToken,
              channelSecret: config.channelSecret,
            }
          : config.liffIds[section],
    }));
    setEditMode((prev) => ({ ...prev, [section]: true }));
    setErrors((prev) => ({ ...prev, [section]: null }));
    setSuccesses((prev) => ({ ...prev, [section]: false }));
  };

  const handleCancel = (section) => {
    if (section === "channel") {
      setConfig((prev) => ({
        ...prev,
        channelAccessToken: tempValues.channel?.channelAccessToken || "",
        channelSecret: tempValues.channel?.channelSecret || "",
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        liffIds: {
          ...prev.liffIds,
          [section]: tempValues[section] || "",
        },
      }));
    }
    setEditMode((prev) => ({ ...prev, [section]: false }));
  };

  const handleChannelUpdate = async (e) => {
    e.preventDefault();
    setErrors((prev) => ({ ...prev, channel: null }));
    setSuccesses((prev) => ({ ...prev, channel: false }));

    try {
      const response = await fetch("/api/user/line-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineConfig: {
            ...config,
            channelAccessToken: config.channelAccessToken,
            channelSecret: config.channelSecret,
          },
        }),
      });

      if (!response.ok)
        throw new Error("Failed to update channel configuration");

      setSuccesses((prev) => ({ ...prev, channel: true }));
      setEditMode((prev) => ({ ...prev, channel: false }));
      setTimeout(() => {
        setSuccesses((prev) => ({ ...prev, channel: false }));
      }, 3000);
    } catch (error) {
      setErrors((prev) => ({ ...prev, channel: error.message }));
    }
  };

  const handleLiffIdUpdate = async (key) => {
    setErrors((prev) => ({ ...prev, [key]: null }));
    setSuccesses((prev) => ({ ...prev, [key]: false }));

    try {
      const response = await fetch("/api/user/line-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineConfig: {
            ...config,
            liffIds: {
              ...config.liffIds,
              [key]: config.liffIds[key],
            },
          },
        }),
      });

      if (!response.ok) throw new Error(`Failed to update ${key} LIFF ID`);

      setSuccesses((prev) => ({ ...prev, [key]: true }));
      setEditMode((prev) => ({ ...prev, [key]: false }));
      setTimeout(() => {
        setSuccesses((prev) => ({ ...prev, [key]: false }));
      }, 3000);
    } catch (error) {
      setErrors((prev) => ({ ...prev, [key]: error.message }));
    }
  };

  const handleCopy = (key, url) => {
    navigator.clipboard.writeText(url);
    setCopySuccess((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopySuccess((prev) => ({ ...prev, [key]: false }));
    }, 3000);
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "300px",
          width: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="space-y-6">
      {/* Webhook URL */}
      <Paper className="p-6 mb-6">
        <Typography variant="h6" className="mb-4">
          Webhook URL
        </Typography>
        <div className="flex items-center space-x-2">
          <TextField
            fullWidth
            label="Webhook URL"
            value={`${window.location.origin}/api/line?id=${
              session?.user?.id || ""
            }`}
            InputProps={{
              readOnly: true,
            }}
          />
          <Button
            variant="outlined"
            onClick={() =>
              handleCopy(
                "webhook-url",
                `${window.location.origin}/api/line?id=${
                  session?.user?.id || ""
                }`
              )
            }
            startIcon={
              copySuccess["webhook-url"] ? <CheckIcon /> : <ContentCopyIcon />
            }
          >
            {copySuccess["webhook-url"] ? "Copied!" : "Copy"}
          </Button>
        </div>
      </Paper>
      {/* LIFF URLs */}
      <Paper className="p-6 mb-6">
        <Typography variant="h6" className="mb-4">
          LIFF URLs
        </Typography>
        <Grid container spacing={3}>
          {[
            { key: "cleaning", label: "Cleaning URL" },
            { key: "maintenance", label: "Maintenance URL" },
            { key: "parcels", label: "Parcels URL" },
            { key: "billing", label: "Billing URL" },
            { key: "announcement", label: "Announcement URL" },
            { key: "schedule", label: "Schedule URL" },
            { key: "tasks", label: "Tasks URL" },
          ].map(({ key, label }) => (
            <Grid item xs={12} key={key}>
              <div className="flex items-center space-x-2">
                <TextField
                  fullWidth
                  label={label}
                  value={`${window.location.origin}/line/${key}?id=${
                    session?.user?.id || ""
                  }`}
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={() =>
                    handleCopy(
                      `url-${key}`,
                      `${window.location.origin}/line/${key}?id=${
                        session?.user?.id || ""
                      }`
                    )
                  }
                  startIcon={
                    copySuccess[`url-${key}`] ? (
                      <CheckIcon />
                    ) : (
                      <ContentCopyIcon />
                    )
                  }
                >
                  {copySuccess[`url-${key}`] ? "Copied!" : "Copy"}
                </Button>
              </div>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Channel Configuration */}
      <Paper className="p-6">
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h6">Channel Configuration</Typography>
          {!editMode.channel ? (
            <Button
              startIcon={<EditIcon />}
              onClick={() => handleEdit("channel")}
              color="primary"
            >
              Edit
            </Button>
          ) : null}
        </div>
        <form onSubmit={handleChannelUpdate} className="space-y-4">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Channel Access Token"
                value={config.channelAccessToken || ""}
                onChange={(e) =>
                  setConfig({ ...config, channelAccessToken: e.target.value })
                }
                disabled={!editMode.channel}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Channel Secret"
                value={config.channelSecret || ""}
                onChange={(e) =>
                  setConfig({ ...config, channelSecret: e.target.value })
                }
                disabled={!editMode.channel}
              />
            </Grid>
          </Grid>
          {errors.channel && (
            <Alert severity="error" className="mt-2">
              {errors.channel}
            </Alert>
          )}
          {successes.channel && (
            <Alert severity="success" className="mt-2">
              Channel configuration updated successfully
            </Alert>
          )}
          {editMode.channel && (
            <div className="flex space-x-2 mt-4">
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
              >
                Save Changes
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleCancel("channel")}
                startIcon={<CancelIcon />}
              >
                Cancel
              </Button>
            </div>
          )}
        </form>
      </Paper>

      {/* LIFF IDs */}
      <Paper className="p-6">
        <Typography variant="h6" className="mb-4">
          LIFF IDs
        </Typography>
        <Grid container spacing={3}>
          {Object.entries(config.liffIds).map(([key, value]) => (
            <Grid item xs={12} key={key}>
              <div className="flex flex-col space-y-2">
                <div className="flex items-end space-x-2">
                  <TextField
                    fullWidth
                    label={`${key.charAt(0).toUpperCase() + key.slice(1)}`}
                    value={value || ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        liffIds: {
                          ...config.liffIds,
                          [key]: e.target.value,
                        },
                      })
                    }
                    disabled={!editMode[key]}
                    helperText={`ID for ${key
                      .replace(/([A-Z])/g, " $1")
                      .toLowerCase()}`}
                  />
                  {!editMode[key] ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleEdit(key)}
                      startIcon={<EditIcon />}
                    >
                      Edit
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleLiffIdUpdate(key)}
                        startIcon={<SaveIcon />}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => handleCancel(key)}
                        startIcon={<CancelIcon />}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
                {errors[key] && (
                  <Alert severity="error" className="mt-1">
                    {errors[key]}
                  </Alert>
                )}
                {successes[key] && (
                  <Alert severity="success" className="mt-1">
                    {key.charAt(0).toUpperCase() + key.slice(1)} updated
                    successfully
                  </Alert>
                )}
              </div>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </div>
  );
};

export default LiffSettings;
