import axios from "axios";

const API_URL = "http://localhost:5000/api/collections";

export const getCollections = async () => {
    const res = await axios.get(API_URL);
    return res.data;
};

export const getCollectionById = async (id) => {
    const res = await axios.get(`${API_URL}/${id}`);
    return res.data;
};
