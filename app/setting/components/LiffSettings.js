"use client";

import { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Alert,
  Paper,
  Grid,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

const LiffSettings = () => {
  const [config, setConfig] = useState({
    channelAccessToken: "",
    channelSecret: "",
    liffIds: {
      parcels: "",
      reports: "",
      billing: "",
      cleaning: "",
      maintenance: "",
    },
  });
  const [editMode, setEditMode] = useState({
    channel: false,
    parcels: false,
    reports: false,
    billing: false,
    cleaning: false,
    maintenance: false,
  });
  const [tempValues, setTempValues] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [successes, setSuccesses] = useState({});

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/user/line-config");
      const data = await response.json();
      if (data.lineConfig) {
        setConfig(data.lineConfig);
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        fetch: "Failed to load LINE configuration",
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

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
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
                    label={`${
                      key.charAt(0).toUpperCase() + key.slice(1)
                    } LIFF ID`}
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
                    {key.charAt(0).toUpperCase() + key.slice(1)} LIFF ID updated
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
