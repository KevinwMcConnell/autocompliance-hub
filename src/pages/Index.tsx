import { Navigate } from "react-router-dom";

// This file is no longer used as a direct page - Dashboard handles the index route
// Keeping for backwards compatibility
export default function Index() {
  return <Navigate to="/" replace />;
}
