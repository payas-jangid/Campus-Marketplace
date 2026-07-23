import axios from "axios";
import { useAuth } from "@clerk/clerk-expo";

export const API_BASE_URL = "http://localhost:5000/api";

export const api = axios.create({
    baseURL : API_BASE_URL
})

export const useApiClient = () => {
    const {getToken} = useAuth();

    const getAuthClient = async () => {
        const token = await getToken();

        return axios.create({
            baseURL: API_BASE_URL,
            headers:{
                Authorization: `Bearer ${token}`
            },
        });
    }
    return {getAuthClient}
}