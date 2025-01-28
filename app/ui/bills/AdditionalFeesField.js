import { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

export default function AdditionalFeesField({ value, onChange }) {
  const handleAdd = () => {
    onChange([...value, { name: '', price: '' }]);
  };

  const handleRemove = (index) => {
    const newFees = value.filter((_, i) => i !== index);
    onChange(newFees);
  };

  const handleChange = (index, field, newValue) => {
    const newFees = value.map((fee, i) => {
      if (i === index) {
        return { ...fee, [field]: newValue };
      }
      return fee;
    });
    onChange(newFees);
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Additional Fees
      </Typography>
      <Stack spacing={2}>
        {value.map((fee, index) => (
          <Paper
            key={index}
            sx={{
              p: 2,
              bgcolor: 'background.default',
              position: 'relative'
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Fee Name"
                value={fee.name}
                onChange={(e) => handleChange(index, 'name', e.target.value)}
                size="small"
                fullWidth
                placeholder="e.g., Parking Fee"
              />
              <TextField
                label="Price"
                value={fee.price}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d+$/.test(value)) {
                    handleChange(index, 'price', value);
                  }
                }}
                size="small"
                type="number"
                InputProps={{
                  startAdornment: '฿',
                }}
                sx={{ width: '150px' }}
              />
              <IconButton
                onClick={() => handleRemove(index)}
                color="error"
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Stack>
          </Paper>
        ))}
        <Button
          startIcon={<AddIcon />}
          onClick={handleAdd}
          variant="outlined"
          sx={{
            borderColor: '#898f63',
            color: '#898f63',
            '&:hover': {
              borderColor: '#707454',
              bgcolor: 'rgba(137, 143, 99, 0.04)',
            },
          }}
        >
          Add Fee
        </Button>
      </Stack>
    </Box>
  );
} 