import { StanderedResponse } from "../Responses/Standered/standeredResponse";

export interface SubjectAndQuestionCount {
    subjectName:string,
    count:number
}
export interface SummaryQuestoinResponse extends StanderedResponse {
    totalQuestion?:number,
    subjects?:SubjectAndQuestionCount[]
}

export interface SummaryData {
    subjects: SubjectAndQuestionCount[],
    total: [
        {
            _id:null,
            totalCount:number
        }
    ]
}