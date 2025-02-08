<Grid container spacing={2}>
  <Grid item xs={6}>
    <Typography color="text.secondary" variant="body2">
      Water Usage
    </Typography>
    <Typography variant="h6">฿{bill.waterAmount.toLocaleString()}</Typography>
    <Typography variant="caption" color="text.secondary">
      {bill.waterUsage} units
    </Typography>
  </Grid>
  <Grid item xs={6}>
    <Typography color="text.secondary" variant="body2">
      Electricity Usage
    </Typography>
    <Typography variant="h6">
      ฿{bill.electricityAmount.toLocaleString()}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {bill.electricityUsage} units
    </Typography>
  </Grid>
</Grid>;
