"use client";

// pages/tenant/add.js
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Modal, Button, TextField, Grid, CircularProgress, Alert, Snackbar, List, ListItem, ListItemText } from '@mui/material';

const AddTenant = () => {
  // State variables
  const [showModal, setShowModal] = useState(false);
  const [showMoveRoomModal, setShowMoveRoomModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
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
  const [availableRooms, setAvailableRooms] = useState([]); // List of available rooms
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

  // Function to fetch the list of available rooms
  const fetchAvailableRooms = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/rooms"); // Endpoint to fetch available rooms
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAvailableRooms(data.rooms);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch the list of available users and rooms on component mount
  useEffect(() => {
    fetchLineFriends();
    fetchAvailableRooms();
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

  const handleMoveRoom = async (roomId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tenant/${selectedTenant.id}/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId }),
      });

      if (!response.ok) {
        throw new Error("Failed to move tenant");
      }

      const data = await response.json();
      console.log("Tenant moved:", data);
      setSuccess(true);
      setShowMoveRoomModal(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button variant="contained" color="primary" onClick={() => setShowModal(true)}>
        Add Tenant
      </Button>
      <List>
        {usersList.map((user) => (
          <ListItem button key={user.id} onClick={() => { setSelectedTenant(user); setShowMoveRoomModal(true); }}>
            <ListItemText primary={user.name} />
          </ListItem>
        ))}
      </List>
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
      <Modal open={showMoveRoomModal} onClose={() => setShowMoveRoomModal(false)}>
        <div style={{ padding: '20px', backgroundColor: 'white', margin: 'auto', marginTop: '10%', width: '50%' }}>
          <h2>Move Room for {selectedTenant?.name}</h2>
          {loading && <CircularProgress />}
          {error && <Alert severity="error">{error}</Alert>}
          <List>
            {availableRooms.map((room) => (
              <ListItem button key={room.id} onClick={() => handleMoveRoom(room.id)}>
                <ListItemText primary={`Room ${room.number}`} />
              </ListItem>
            ))}
          </List>
          <Button variant="outlined" color="secondary" fullWidth onClick={() => setShowMoveRoomModal(false)}>
            Back
          </Button>
        </div>
      </Modal>
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        message="Operation successful"
      />
    </div>
  );
};

AddTenant.propTypes = {
  // Define prop types if any props are passed to this component
};

export default AddTenant;
