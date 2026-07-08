import { useSelector } from "react-redux";

export default function useAuth() {
    const { userInfo, token } = useSelector((state) => state.auth);
    return { user: userInfo, token, isAuthenticated: !!token, isAdmin: userInfo?.role === "admin" };
}
