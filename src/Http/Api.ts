import Axios, { AxiosRequestConfig } from "axios";

export interface PostParams {
    url: string;
    data?: any;
    config?: AxiosRequestConfig;
}

export default {
    post: async ({ url, data = {}, config = {} }: PostParams) => {
        return Axios.post(url, data, config);
    }
}
