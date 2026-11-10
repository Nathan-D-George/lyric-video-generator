"use client";

import { type PropsWithChildren } from "react";
import { create } from "zustand";

export type AuthModes = "home" | "login" | "signup" | "dashboard" | "workbench";

interface AppState {
  email: string;
  password: string;
  errorMessage: string | null;
  authMode: AuthModes;
  // setEmail: Dispatch<SetStateAction<string>>;
  // setPassword: Dispatch<SetStateAction<string>>;
  // setErrorMessage: Dispatch<SetStateAction<string | null>>;
  // setAuthMode: Dispatch<SetStateAction<"home" | "login" | "signup" | "dashboard" | "workbench">>;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setErrorMessage: (value: string | null) => void;
  setAuthMode: (value: AuthModes) => void;
}

// const createNewAppStore = (
//   initialValues: AppState,
// ) => createStore<AppState>()(
//   devtools(
//     (set, get) => ({
//       ...initialValues,
//     })
//   )
// );

// export const useAppStore = create<AppState>()((set, get) => ({
export const useAppStore = create<AppState>()((set,) => ({
  email: '',
  password: '',
  authMode: "home",
  errorMessage: null,
  setAuthMode: (value: AuthModes) => set({
    authMode: value,
  }),
  setEmail: (value: string) => set({
    email: value
  }),
  setPassword: (value: string) => set({
    password: value
  }),
  setErrorMessage: (value: string | null) => set({
    errorMessage: value
  }),
}));

export function AppStore({
  email,
  password,
  authMode,
  errorMessage,
  setEmail,
  setErrorMessage,
  setPassword,
  setAuthMode,
  children,
}: PropsWithChildren<{
  email: string;
  password: string;
  errorMessage: string | null;
  // authMode: "home" | "login" | "signup" | "dashboard" | "workbench";
  authMode: AuthModes;
  // setEmail: Dispatch<SetStateAction<string>>;
  // setPassword: Dispatch<SetStateAction<string>>;
  // setErrorMessage: Dispatch<SetStateAction<string | null>>;
  // setAuthMode: Dispatch<SetStateAction<"home" | "login" | "signup" | "dashboard" | "workbench">>;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setErrorMessage: (value: string | null) => void;
  setAuthMode: (value: AuthModes) => void;
}>) {
  useAppStore.setState({
    email,
    password,
    authMode,
    errorMessage,
    setEmail,
    setPassword,
    setAuthMode,
    setErrorMessage,
  });

  return children
}