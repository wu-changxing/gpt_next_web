// login.tsx
import React, { useRef } from "react";
import { useRouter } from "next/router";
import "./login.module.scss";

interface IProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function LoginPage({ searchParams }: IProps) {
  const userName = useRef("");
  const pass = useRef("");
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("https://aaron404.com/eac/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: userName.current,
        password: pass.current,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("token", data.token);
      router.push("/");
    } else {
      // handle error
      console.log("Error logging in");
    }
  };

  return (
    <div className="loginPage">
      {searchParams?.message && (
        <p className="message">{searchParams?.message}</p>
      )}
      <div className="loginContainer">
        <form onSubmit={onSubmit}>
          <label className="label">User Name</label>
          <input
            type="text"
            className="input"
            onChange={(e) => (userName.current = e.target.value)}
            required
          />
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            onChange={(e) => (pass.current = e.target.value)}
            required
          />
          <button className="button" type="submit">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
