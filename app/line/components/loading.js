import {
  CircularProgress,
  Box,
} from "@mui/material";

function Loading() {
  return    (
  <Box display="flex" justifyContent="center" alignItems="center" p={4}>
    <CircularProgress size={24} sx={{ color: '#889F63' }} />
  </Box>
  )
}

export default Loading;