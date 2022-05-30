import {
  Alert,
  AppBar,
  Box,
  Button,
  createTheme,
  CssBaseline,
  Paper,
  Snackbar,
  TextField,
  ThemeProvider,
  Toolbar,
  Typography
} from "@mui/material";
import { useEffect, useState } from "react";
import { validate } from "uuid";
import HolzIcon from "./holz.svg";

const darkTheme = createTheme({
  palette: {
    mode: "dark"
  }
});

declare global {
  interface Window {
    api: api;
  }
}

type api = {
  solveCaptcha: (cid: string) => void;
  on: (channel: string, callback: (data: any) => void) => void;
};

function App() {
  const [error, setError] = useState<string | null>(null);
  const [successCid, setSuccessCid] = useState<string | null>(null);

  useEffect(() => {
    window.api.on("error", (message) => {
      setError(message);
    });
    window.api.on("captcha", (cid: string) => {
      setSuccessCid(cid);
    });
  }, []);

  const handleErrorAlertClose = () => {
    setError(null);
  };

  const handleSuccessAlertClose = () => {
    setSuccessCid(null);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
        <Header />
        <Content />
      </Box>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={!!error}
        autoHideDuration={6000}
        onClose={handleErrorAlertClose}
      >
        <Alert onClose={handleErrorAlertClose} severity="error" sx={{ width: "100%" }}>
          An error occurred: {error}
        </Alert>
      </Snackbar>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={!!successCid}
        autoHideDuration={6000}
        onClose={handleSuccessAlertClose}
      >
        <Alert onClose={handleSuccessAlertClose} severity="success" sx={{ width: "100%" }}>
          The captcha {successCid} was successfully solved.
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

function Header() {
  return (
    <AppBar position="static">
      <Toolbar>
        <img
          alt="Wolkeneis Icon"
          height={40}
          src={HolzIcon}
          style={{
            cursor: "pointer",
            marginRight: ".5em"
          }}
          width={40}
        />
        <Typography
          component="div"
          sx={{
            cursor: "pointer",
            flexGrow: 1
          }}
          variant="h6"
        >
          Holz Desktop
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

function Content() {
  const [cid, setCid] = useState("");
  const [cidValid, setCidValid] = useState(true);

  useEffect(() => {
    if (cid) {
      setCidValid(validate(cid));
    }
  }, [cid]);

  const solve = () => {
    if (cid && cidValid) {
      console.log(cid);
      window.api.solveCaptcha(cid);
    }
  };

  return (
    <Box sx={{ margin: "auto" }}>
      <Paper sx={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: 4 }}>
        <Typography
          component="div"
          sx={{
            flexGrow: 1
          }}
          variant="h5"
        >
          Solve a Captcha
        </Typography>
        <TextField
          sx={{ width: 330, marginY: 2 }}
          size="small"
          error={!cidValid}
          onChange={(event) => setCid(event.target.value)}
          value={cid}
          id="standard-basic"
          label="Captcha Identifier"
          variant="filled"
        />
        <Button onClick={solve} variant="outlined">
          Solve
        </Button>
      </Paper>
    </Box>
  );
}

export default App;
