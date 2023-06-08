"use client";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./login.module.scss";

interface IProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function LoginPage({ searchParams }: IProps) {
  const [userName, setUserName] = useState("");
  const [pass, setPass] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null); // explicit
  const [showPassword, setShowPassword] = useState(false); // added th
  const DJ_URL = process.env.DJ_URL ?? "https://aaron404.com";

  const toggleShowPassword = () => {
    // added this function
    setShowPassword(!showPassword);
  };
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`${DJ_URL}/eac/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: userName,
          password: pass,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token);
        navigate("/");
      } else {
        const errorData = await res.json(); // Get the error response
        setError(`Error ${res.status}: ${errorData.message || res.statusText}`); // Set error to HTTP status code and message
      }
    } catch (error) {
      if (error instanceof Error) {
        // Checking if error is an instance of Error
        setError(error.message); // If error is an object, this line will get the error message
      }
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <h2 className={styles.title}>Login</h2>
        {error && <div className={styles.error}>{error}</div>}
        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.label} htmlFor="username">
            User Name
          </label>
          <input
            id="username"
            type="text"
            className={styles.input}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <div className={styles.inputGroup}>
            {" "}
            {/* added this div */}
            <input
              id="password"
              type={showPassword ? "text" : "password"} // modified this line
              className={styles.input}
              onChange={(e) => setPass(e.target.value)}
              required
            />
            <button onClick={toggleShowPassword} type="button">
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <button className={styles.button} type="submit">
            Login
          </button>
        </form>
        <p className={styles.signUp}>
          Dont have an account?{" "}
          <a href="https://eac.aaron404.com/register" className={styles.link}>
            Sign up here
          </a>
          .
        </p>
      </div>
    </div>
  );
}
