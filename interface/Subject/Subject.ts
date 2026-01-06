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
export interface SubjectInterfaceV2 {
    _id:string
    subjectName:string,
    dppCount:number,
    classCount:number,
    pyqCount:number
    chatGptCount:number
    bookCount:number    
    totalQuestionCount:number
}
export interface GetSubjectInterfacev2 extends StanderedResponse {
    subjects?:SubjectInterface[]
}