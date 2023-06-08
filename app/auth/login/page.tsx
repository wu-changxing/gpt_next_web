"use client";
import { signIn } from "next-auth/react";
import { useRef } from "react";

interface IProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

const LoginPage = ({ searchParams }: IProps) => {
  const userName = useRef("");
  const pass = useRef("");

  const onSubmit = async () => {
    const result = await signIn("credentials", {
      username: userName.current,
      password: pass.current,
      redirect: true,
      callbackUrl: "/",
    });
  };
  return (
    <div
      className={
        "flex flex-col justify-center items-center  h-screen bg-gradient-to-br gap-1 from-cyan-300 to-sky-600"
      }
    >
      {searchParams?.message && (
        <p className="text-red-700 bg-red-100 py-2 px-5 rounded-md">
          {searchParams?.message}
        </p>
      )}
      <div className="px-7 py-4 shadow bg-white rounded-md flex flex-col gap-2">
        <label className="font-bold text-gray-600">User Name</label>
        <input
          type="text"
          className="p-2 border border-gray-300 rounded-md"
          onChange={(e) => (userName.current = e.target.value)}
        />
        <label className="font-bold text-gray-600">Password</label>
        <input
          type="password"
          className="p-2 border border-gray-300 rounded-md"
          onChange={(e) => (pass.current = e.target.value)}
        />
        <button
          className="p-2 bg-blue-600 text-white rounded-md mt-2"
          onClick={onSubmit}
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
