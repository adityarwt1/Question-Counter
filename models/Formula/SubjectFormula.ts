import mongoose , {Schema, Document} from "mongoose";

interface SubjectformulaInterface extends Document {
    subjectName:string,
}

const SubjectFormulaSchema : Schema<SubjectformulaInterface> = new Schema({
    subjectName:{
        type:String,
        required:true
    }
},{
    timestamps:true
})

const FormulaSubject  = mongoose.models.FormulaSubject || mongoose.model<SubjectformulaInterface>("FormulaSubject", SubjectFormulaSchema)
export default FormulaSubject