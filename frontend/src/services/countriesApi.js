import axios from "axios";

const API = axios.create({
  baseURL: "https://restcountries.com/v3.1",
});

export const getAllCountries = async () => {
  const response = await API.get(
    "/all?fields=name,cca2"
  );
  const data = Array.isArray(response.data) ? response.data : [];
  return data
    .map((item) => ({
      code: item.cca2 || item.name?.common || "",
      name: item?.name?.common || item?.name?.official || "",
    }))
    .filter((item) => item.name)
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
};
