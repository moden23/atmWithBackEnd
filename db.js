const { Client } = require("pg");
const bcrypt = require("bcrypt");
require("dotenv").config();
//Create your own .env file add user DB_USER=yourUsername DB_PASSWORD=yourPassword DB_HOST=localhost DB_PORT=5432 DB_NAME=yourDatabaseName
const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

client.connect((err) => {
  if (err) {
    console.log("Error in connectivity");
    return;
  }
  console.log("Connected successfyully");
});

const saltRounds = 10;
const createNewAccount = ({ username, password }, onRegister) => {
  const hashedPassword = bcrypt.hashSync(password, saltRounds);

  //Check if the username already exists
  client.query(
    "SELECT * FROM account WHERE username = $1",
    [username],
    (err, res) => {
      if (err) {
        console.log(err);
        return onRegister("Error checking user");
      }
      if (res.rows.length > 0) {
        return onRegister("Username already exists");
      }

      // Insert the new user
      client.query(
        "INSERT INTO account (username, password,balance) VALUES ($1,$2,$3)",
        [username, hashedPassword, 0],
        (err) => {
          if (err) {
            return onRegister("Error registering user");
          }
          return onRegister("User registered successfully");
        }
      );
    }
  );
};

const authenticateUser = ({ username, password }, onAuth) => {
  console.log(username, password);
  client.query(
    "SELECT * FROM account WHERE username=$1",
    [username],
    (err, res) => {
      if (err || res.rows.length === 0) {
        return onAuth(false, null);
      }
      const user = res.rows[0];
      const match = bcrypt.compareSync(password, user.password);
      onAuth(match, match ? user.acid : null);
    }
  );
};
const withdraw = ({ acId, amount }, onWithdraw = undefined) => {
  client.query(
    "SELECT balance FROM account WHERE acId = $1",
    [acId],
    (err, res) => {
      if (err) {
        return onWithdraw("Error fetching balance");
      }

      const { balance } = res.rows[0];

      // Check if there is enough balance
      if (balance < amount) {
        return onWithdraw("Insufficient funds");
      }
      const newBalance = parseFloat(balance) - amount;
      client.query(
        "UPDATE account SET balance = $1 WHERE acId = $2",
        [newBalance, acId],
        (err) => {
          if (err) {
            return onWithdraw("Error during withdrawal");
          }
          if (onWithdraw) onWithdraw("Amount withdrawn successfully");
        }
      );
    }
  );
};

const deposit = ({ acId, amount }, onDeposit = undefined) => {
  client.query(
    "SELECT balance FROM account WHERE acId=$1",
    [acId],
    (err, res) => {
      if (err) console.log("Problem in Deposing");
      else {
        const { balance } = res.rows[0];
        const newBalance = parseFloat(balance) + amount;

        client.query(
          "update account set balance=$1 where acId=$2",
          [newBalance, acId],
          (err, res) => {
            if (err) console.log("Problem in Deposing");
            else {
              if (onDeposit)
                onDeposit("Amount " + amount + " deposited successfully");
            }
          }
        );
      }
    }
  );
};

const depositTransfer = ({ username, amount }, onDeposit = undefined) => {
  console.log(username);
  client.query(
    "SELECT balance FROM account WHERE username=$1",
    [username],
    (err, res) => {
      if (err) console.log("Problem in Deposing");
      else {
        console.log("resdfasdfsa");
        console.log(res);
        const { balance } = res.rows[0];
        const newBalance = parseFloat(balance) + amount;

        client.query(
          "update account set balance=$1 where username=$2",
          [newBalance, username],
          (err, res) => {
            if (err) console.log("Problem in Deposing");
            else {
              if (onDeposit)
                onDeposit("Amount " + amount + " deposited successfully");
            }
          }
        );
      }
    }
  );
};

const transfer = ({ srcId, destName, amount }, onTransfer = undefined) => {
  withdraw({ acId: srcId, amount }, (msgWd) => {
    depositTransfer({ username: destName, amount }, (msgDp) => {
      if (onTransfer) onTransfer(`Amount ${amount} Transferred succesfully`);
    });
  });
};

const balance = (acId, onBalance = undefined) => {
  client.query(
    "select balance from account where acId=$1",
    [acId],
    (err, res) => {
      if (err) console.log("Problem with fetching");
      else {
        const { balance } = res.rows[0];
        if (balance) onBalance(balance);
      }
    }
  );
};

module.exports = {
  createNewAccount,
  authenticateUser,
  deposit,
  withdraw,
  transfer,
  balance,
  client,
};
