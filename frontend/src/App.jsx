import { useState } from "react";
import "./App.css";
import api from "./api/axios";

function App() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const submit = async () => {
    try {
      const res = await api.post("/api/name", {
        name,
      });

      setMessage(res.data.message);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div
      style={{
        width: "400px",
        margin: "100px auto",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter Name"
      />

      <button onClick={submit}>Send</button>

      <h2>{message}</h2>
    </div>
  );
}

export default App;
