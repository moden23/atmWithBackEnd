const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const {
  createNewAccount,
  authenticateUser,
  deposit,
  withdraw,
  balance,
  transfer,
  client,
} = require("./db");

app.post("/create", (req, res) => {
  const { username, password } = req.body;
  createNewAccount({ username, password }, (msg) => {
    res.json({ sts: "success", msg });
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  authenticateUser({ username, password }, (isAuthenticated, userData) => {
    if (isAuthenticated) {
      const acId = userData;
      return res.json({ status: "success", acId });
    } else {
      return res
        .status(401)
        .json({ status: "error", msg: "Invalid username or password" });
    }
  });
});

app.put("/transfer", express.json(), (req, res) => {
  console.log(req.body);
  transfer(req.body, (msg) => {
    res.json({ sts: "success", msg });
  });
});

app.put("/withdraw", express.json(), (req, res) => {
  withdraw(req.body, (msg) => {
    res.json({ sts: "success", msg });
  });
});

app.put("/deposit", express.json(), (req, res) => {
  deposit(req.body, (msg) => {
    res.json({ sts: "success", msg });
  });
});

app.get("/balance/:acId", (req, res) => {
  const acId = req.params.acId;
  console.log("asdasdsad" + acId);
  balance(acId, (bal) => {
    if (bal !== null) {
      res.json({ bal });
    }
  });
});

app.listen(port, () => {
  console.log(`Banking App app listening on port ${port}`);
});
