import { StanderedResponse } from "../Responses/Standered/standeredResponse";

export interface SignInInterface {
    email:string,
    password:string
    name:string
}

export interface AuthResponseInterface extends StanderedResponse {
    token?:string
}
