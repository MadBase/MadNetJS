import Axios, { AxiosRequestConfig } from "axios";

export interface PostParams {
    url: string;
    data: any;
    config: AxiosRequestConfig;
}

export async function post({ url, data = {}, config = {} }: PostParams) {
    return Axios.post(url, data, config);
}
