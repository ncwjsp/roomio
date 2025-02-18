// Common color scheme
export const colors = {
  primary: '#889F63',
  primaryDark: '#7A8F53',
  primaryLight: 'rgba(136, 159, 99, 0.08)',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  success: '#4CAF50',
};

// Status color mapping
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "success";
    case "in progress":
      return "info";
    case "pending":
      return "warning";
    case "cancelled":
      return "error";
    default:
      return "default";
  }
};

// Common button styles
export const buttonStyles = {
  primary: {
    contained: {
      bgcolor: colors.primary,
      color: '#fff',
      '&:hover': {
        bgcolor: colors.primaryDark,
      },
    },
    outlined: {
      color: colors.primary,
      borderColor: colors.primary,
      '&:hover': {
        borderColor: colors.primary,
        bgcolor: colors.primaryLight,
      },
    },
  },
};

// Common chip styles
export const chipStyles = {
  success: {
    bgcolor: 'rgba(76, 175, 80, 0.1)',
    color: '#4CAF50',
  },
  error: {
    bgcolor: 'rgba(244, 67, 54, 0.1)',
    color: '#F44336',
  },
  warning: {
    bgcolor: 'rgba(255, 152, 0, 0.1)',
    color: '#FF9800',
  },
  info: {
    bgcolor: 'rgba(33, 150, 243, 0.1)',
    color: '#2196F3',
  },
  default: {
    bgcolor: 'rgba(0, 0, 0, 0.1)',
    color: '#666666',
  },
};

// Common modal styles
export const modalStyles = {
  paper: {
    borderRadius: 2,
  },
  content: {
    p: 3,
  },
  actions: {
    p: 2.5,
    pt: 0,
  },
};
