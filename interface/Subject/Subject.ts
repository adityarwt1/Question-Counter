import { StanderedResponse } from "../Responses/Standered/standeredResponse"

export interface AddSubjectInterface {
    subjectName:string
}

export interface SubjectInterface {
    _id:string
    subjectName:string,
    dppCount:number,
    classCount:number,
    pyqCount:number
    chatGptCount:number
    bookCount:number    
}
export interface GetSubjectInterface extends StanderedResponse {
    subjects?:SubjectInterface[]
}