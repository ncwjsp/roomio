"use client";

// pages/tenant/add.js
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Modal, Button, TextField, Grid, CircularProgress, Alert, Snackbar } from '@mui/material';

const AddTenant = () => {
  // State variables
  const [showModal, setShowModal] = useState(true); // Set to true to show modal by default
  const [selectedUserId, setSelectedUserId] = useState("");
  const [tenantData, setTenantData] = useState({
    name: "",
    email: "",
    phone: "",
    lineId: "",
    pfp: "",
    room: "",
    leaseStartDate: "",
    leaseEndDate: "",
    depositAmount: "",
  });
  const [friendName, setFriendName] = useState("");
  const [friendDate, setFriendDate] = useState("");
  const [usersList, setUsersList] = useState([]); // List of available users for userId
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Function to fetch the list of available users
  const fetchLineFriends = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/friend"); // Endpoint to fetch users
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUsersList(data.friends);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch the list of available users on component mount
  useEffect(() => {
    fetchLineFriends();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTenantData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/tenant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tenantData),
      });

      if (!response.ok) {
        throw new Error("Failed to add tenant");
      }

      const data = await response.json();
      console.log("Tenant added:", data);
      setSuccess(true);
      setShowModal(false);
      setTenantData({
        name: "",
        email: "",
        phone: "",
        lineId: "",
        pfp: "",
        room: "",
        leaseStartDate: "",
        leaseEndDate: "",
        depositAmount: "",
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <div style={{ padding: '20px', backgroundColor: 'white', margin: 'auto', marginTop: '10%', width: '50%' }}>
          <h2>Add Tenant</h2>
          {loading && <CircularProgress />}
          {error && <Alert severity="error">{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Name"
                  name="name"
                  value={tenantData.name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={tenantData.email}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Phone"
                  name="phone"
                  value={tenantData.phone}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Line ID"
                  name="lineId"
                  value={tenantData.lineId}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Profile Picture URL"
                  name="pfp"
                  value={tenantData.pfp}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Room"
                  name="room"
                  value={tenantData.room}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Lease Start Date"
                  name="leaseStartDate"
                  type="date"
                  value={tenantData.leaseStartDate}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Lease End Date"
                  name="leaseEndDate"
                  type="date"
                  value={tenantData.leaseEndDate}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Deposit Amount"
                  name="depositAmount"
                  type="number"
                  value={tenantData.depositAmount}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
                  Submit
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button variant="outlined" color="secondary" fullWidth onClick={() => setShowModal(false)}>
                  Back
                </Button>
              </Grid>
            </Grid>
          </form>
        </div>
      </Modal>
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        message="Tenant added successfully"
      />
    </div>
  );
};

AddTenant.propTypes = {
  // Define prop types if any props are passed to this component
};

export default AddTenant;
