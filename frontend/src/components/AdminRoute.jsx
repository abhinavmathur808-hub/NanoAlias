import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

export default function AdminRoute() {
    const { userInfo, token } = useSelector((state) => state.auth);

    if (!token) return <Navigate to="/login" replace />;
    if (userInfo?.role !== "admin") return <Navigate to="/dashboard" replace />;

    return <Outlet />;
}
